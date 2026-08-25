import React, { lazy, Suspense, useState, useEffect } from 'react';

const PremiumModal = lazy(() => import('./PremiumModal'));
const WelcomeGuide = lazy(() => import('./WelcomeGuide'));
const AlphaWelcome = lazy(() => import('./AlphaWelcome'));

interface AppOverlaysProps {
  isPremiumModalOpen: boolean;
  setIsPremiumModalOpen: (open: boolean) => void;
  showOnboarding: boolean;
  onCompleteOnboarding: () => void;
  showAlphaWelcome: boolean;
  onCompleteAlphaWelcome: () => void;
}

export const AppOverlays: React.FC<AppOverlaysProps> = ({
  isPremiumModalOpen,
  setIsPremiumModalOpen,
  showOnboarding,
  onCompleteOnboarding,
  showAlphaWelcome,
  onCompleteAlphaWelcome,
}) => {
  // Mount the (lazy) premium modal only once it's first opened, then keep it
  // mounted so its close transition still runs.
  const [premiumModalLoaded, setPremiumModalLoaded] = useState(false);

  useEffect(() => {
    if (isPremiumModalOpen) {
      setPremiumModalLoaded(true);
    }
  }, [isPremiumModalOpen]);

  return (
    <>
      {/* Global Premium Modal */}
      {premiumModalLoaded && (
        <Suspense fallback={null}>
          <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
        </Suspense>
      )}

      {/* First-launch onboarding overlay (rendered via portal) */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <WelcomeGuide onClose={onCompleteOnboarding} />
        </Suspense>
      )}

      {/* Alpha tester welcome overlay — after onboarding so they don't stack */}
      {!showOnboarding && showAlphaWelcome && (
        <Suspense fallback={null}>
          <AlphaWelcome onClose={onCompleteAlphaWelcome} />
        </Suspense>
      )}
    </>
  );
};
export default AppOverlays;
