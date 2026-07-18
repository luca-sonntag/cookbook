import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabase';
import { apiUrl } from '../api';

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

    // Initial status sync on app launch to verify actual entitlements
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      await syncBillingStatus(isPremium);
    } catch (syncErr) {
      console.warn('Initial billing status sync failed:', syncErr);
    }
  } catch (err) {
    console.error('Failed to configure RevenueCat:', err);
  }
}

async function syncBillingStatus(isPremium: boolean): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(apiUrl('/api/billing/sync'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tier: isPremium ? 'premium' : 'free' }),
    });

    if (response.ok) {
      // Refresh local session to obtain the updated JWT containing the app_metadata.tier
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn('Failed to refresh local Supabase session:', error.message);
      } else {
        console.log('Billing status synced successfully with backend. Tier:', isPremium ? 'premium' : 'free');
      }
    } else {
      console.error('Failed to sync billing status with backend:', await response.text());
    }
  } catch (err) {
    console.error('Error syncing billing status:', err);
  }
}

export async function getSubscriptionOfferings(): Promise<any[]> {
  // Ensure initialized
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  await initBilling(user.id);

  if (!isRCInitialized) return [];

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (err) {
    console.error('Failed to get offerings from RevenueCat:', err);
    return [];
  }
}

export async function buyPremium(packageId?: string): Promise<boolean> {
  // Get current user to ensure we are logged in
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

    // Find the requested package or fall back to the first available package
    let packageToBuy = offerings.current.availablePackages[0];
    if (packageId) {
      const found = offerings.current.availablePackages.find(p => p.identifier === packageId);
      if (found) {
        packageToBuy = found;
      } else {
        console.warn(`Requested package '${packageId}' not found. Falling back to default package.`);
      }
    }

    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: packageToBuy,
    });

    // Check if the user has active entitlements.
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    if (isPremium) {
      await syncBillingStatus(true);
      return true;
    }

    await syncBillingStatus(false);
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
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

