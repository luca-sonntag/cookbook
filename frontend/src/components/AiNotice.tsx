import { Sparkles, Info } from 'lucide-react';
import { Popover } from '@heroui/react';
import { useI18n } from '../context/I18nContext';

interface AiNoticeProps {
  type?: 'inline' | 'badge';
  label?: string;
  tooltipText?: string;
  className?: string;
}

export default function AiNotice({ type = 'badge', label, tooltipText, className = '' }: AiNoticeProps) {
  const { t } = useI18n();

  const defaultLabel = label || t('recipe.aiEstimateNotice');
  const defaultTooltip = tooltipText || t('recipe.aiEstimateTooltip');

  if (type === 'badge') {
    return (
      <Popover>
        <Popover.Trigger>
          <button className={`text-gray-400 hover:text-emerald-500 dark:text-gray-500 dark:hover:text-emerald-400 transition-colors p-0.5 rounded-full outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer flex items-center justify-center ${className}`}>
            <Info className="w-3.5 h-3.5" />
          </button>
        </Popover.Trigger>
        <Popover.Content
          placement="top"
          className="max-w-[280px] p-2.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 rounded-xl shadow-lg"
        >
          <Popover.Dialog className="outline-none border-none p-0 m-0">
            {defaultTooltip}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
  }

  // A card/alert style for inline notices
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5 border border-emerald-500/10 text-gray-700 dark:text-gray-300 text-xs transition-all ${className}`}>
      <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">{defaultLabel}</span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">{defaultTooltip}</span>
      </div>
    </div>
  );
}
