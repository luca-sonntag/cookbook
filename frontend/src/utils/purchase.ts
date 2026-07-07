import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabase';

const REVENUECAT_ANDROID_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;

let isRCInitialized = false;

export async function initBilling(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isRCInitialized) return;

  if (!REVENUECAT_ANDROID_API_KEY) {
    console.warn('RevenueCat API Key is missing. Billing will not work.');
    return;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({
      apiKey: REVENUECAT_ANDROID_API_KEY,
      appUserID: userId,
    });
    isRCInitialized = true;
    console.log('RevenueCat configured successfully for user:', userId);
  } catch (err) {
    console.error('Failed to configure RevenueCat:', err);
  }
}

export async function buyPremium(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Billing is only supported on native mobile platforms.');
  }

  // Get current user to ensure we are initialized
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be logged in to purchase Premium.');
  }

  await initBilling(user.id);

  if (!isRCInitialized) {
    throw new Error('Billing service is not initialized (missing API key).');
  }

  try {
    // Get offerings
    const offerings = await Purchases.getOfferings();
    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      throw new Error('No active products or subscription packages found.');
    }

    // Purchase the first available package (usually 'monthly' or the current offering)
    const packageToBuy = offerings.current.availablePackages[0];
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: packageToBuy,
    });

    // Check if the user has active entitlements.
    // In RevenueCat, you usually configure an entitlement like 'premium'.
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    console.log('Active entitlements:', activeEntitlements);
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    if (isPremium) {
      // Opt-in: Update Supabase metadata locally as a fallback,
      // although the source of truth should be updated via RevenueCat webhooks to our backend.
      const { error } = await supabase.auth.updateUser({
        data: { tier: 'premium' }
      });
      if (error) {
        console.warn('Failed to update local user metadata:', error.message);
      }
      return true;
    }

    const activeList = activeEntitlements.length > 0 ? activeEntitlements.join(', ') : 'none';
    throw new Error(`Purchase was successful, but the 'premium' entitlement is not active (Active: [${activeList}]). Please verify that you have configured an entitlement with ID 'premium' in the RevenueCat dashboard and linked it to this product.`);
  } catch (err: any) {
    // If the user cancelled, return false silently
    if (err.userCancelled) {
      return false;
    }
    throw new Error(err.message || 'Purchase failed.');
  }
}
