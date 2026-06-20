import { Card, Button } from '@heroui/react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  jobError: string | null;
  triggerExtraction: (url: string) => void;
  url: string;
}

export default function ErrorBanner({
  isPending,
  jobStatus,
  jobError,
  triggerExtraction,
  url
}: ErrorBannerProps) {
  if (isPending || jobStatus !== 'failed') return null;

  return (
    <Card className="glass-panel p-5 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/10">
      <div className="flex items-start gap-3 text-red-500">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Extraction Failed</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{jobError || 'An unknown error occurred while analyzing the Reel.'}</p>
          <Button 
            size="sm" 
            variant="tertiary" 
            className="mt-3 text-xs text-gray-800 dark:text-white border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" 
            onPress={() => triggerExtraction(url)}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Retry
          </Button>
        </div>
      </div>
    </Card>
  );
}
