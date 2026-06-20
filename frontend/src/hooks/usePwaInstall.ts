import { useState, useEffect } from 'react';
import type { BeforeInstallPromptEvent } from '../types';

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<'installed' | 'standalone' | 'browser'>('browser');

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator && 
      (window.navigator as Navigator & { standalone?: boolean }).standalone;

    if (isStandalone || isIOSStandalone) {
      setTimeout(() => {
        setInstallStatus('standalone');
      }, 0);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallStatus('installed');
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  return {
    isInstallable,
    installStatus,
    handleInstallClick,
  };
}
