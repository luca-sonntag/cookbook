import { Card } from '@heroui/react';
import { Cpu } from 'lucide-react';

interface ProgressTrackerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  statusDetails: { text: string; sub: string } | null;
}

export default function ProgressTracker({ isPending, jobStatus, statusDetails }: ProgressTrackerProps) {
  if (!isPending || !statusDetails) return null;

  return (
    <Card className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5">
      <div className="flex items-start gap-4">
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400 animate-pulse-slow">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{statusDetails.text}</h3>
            <span className="text-xs text-emerald-400 font-mono capitalize">{jobStatus}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{statusDetails.sub}</p>

          {/* Progress bar steps */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className={`h-1.5 rounded-full ${['pending', 'scraping', 'processing', 'completed'].includes(jobStatus || '') ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'}`}></div>
            <div className={`h-1.5 rounded-full ${['scraping', 'processing', 'completed'].includes(jobStatus || '') ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'} ${jobStatus === 'scraping' ? 'animate-pulse-slow' : ''}`}></div>
            <div className={`h-1.5 rounded-full ${['processing', 'completed'].includes(jobStatus || '') ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'} ${jobStatus === 'processing' ? 'animate-pulse-slow' : ''}`}></div>
          </div>
        </div>
      </div>
    </Card>
  );
}
