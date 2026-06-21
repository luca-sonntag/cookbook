import { useState, useEffect } from 'react';

interface UseCookingModeProps {
  instructionsCount: number;
  initialStepIndex?: number;
  onClose: () => void;
}

export function useCookingMode({
  instructionsCount,
  initialStepIndex = 0,
  onClose,
}: UseCookingModeProps) {
  const [cookingStepIndex, setCookingStepIndex] = useState(initialStepIndex);
  const [, setWakeLock] = useState<any>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleNextCookingStep = () => {
    if (cookingStepIndex < instructionsCount - 1) {
      setCookingStepIndex(prev => prev + 1);
    }
  };

  const handlePrevCookingStep = () => {
    if (cookingStepIndex > 0) {
      setCookingStepIndex(prev => prev - 1);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 60) {
      handleNextCookingStep();
    } else if (diff < -60) {
      handlePrevCookingStep();
    }
    setTouchStartX(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextCookingStep();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCookingStep();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cookingStepIndex, instructionsCount, onClose]);

  // Screen Wake Lock
  useEffect(() => {
    let activeWakeLock: any = null;
    const requestWakeLock = async () => {
      const nav = navigator as any;
      if (nav.wakeLock) {
        try {
          activeWakeLock = await nav.wakeLock.request('screen');
          setWakeLock(activeWakeLock);
        } catch (err) {
          console.warn('Could not acquire Screen Wake Lock:', err);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (activeWakeLock) {
        activeWakeLock.release().catch((err: any) => {
          console.warn('Error releasing Wake Lock:', err);
        });
      }
    };
  }, []);

  return {
    cookingStepIndex,
    setCookingStepIndex,
    handleNextCookingStep,
    handlePrevCookingStep,
    handleTouchStart,
    handleTouchEnd,
  };
}
