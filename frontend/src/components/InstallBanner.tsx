import { Button } from '@heroui/react';
import { Share2 } from 'lucide-react';

interface InstallBannerProps {
  isInstallable: boolean;
  handleInstallClick: () => void;
}

export default function InstallBanner({ isInstallable, handleInstallClick }: InstallBannerProps) {
  if (!isInstallable) return null;

  return (
    <div className="w-full max-w-2xl px-4 mt-6">
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
        <div className="flex gap-3 items-center">
          <Share2 className="text-emerald-400 w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Install as App (PWA)</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Share Reels directly to this app to extract recipes fast!</p>
          </div>
        </div>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium shadow-lg" onPress={handleInstallClick}>
          Install
        </Button>
      </div>
    </div>
  );
}
