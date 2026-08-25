import React from 'react';
import { Button } from '@heroui/react';
import { Sparkles, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { useI18n } from '../../../context/I18nContext';
import type { CopilotChatListProps } from './types';



export const CopilotChatList: React.FC<CopilotChatListProps> = ({
  history,
  isPending,
  pendingAction,
  error,
  messagesEndRef,
  onLoadNewRecipe,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-4 scrollbar-none bg-[#f9fafb] dark:bg-[var(--color-gray-950)]">
      {/* Welcome message if history is empty */}
      {history.length === 0 && (
        <div className="my-auto flex flex-col items-center text-center max-w-sm mx-auto gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('copilot.title')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Ich helfe dir, dieses Rezept anzupassen, Zutaten auszutauschen oder einen Timer zu starten. Frag mich einfach!
          </p>
        </div>
      )}

      {/* Chat bubbles */}
      {history.map((msg, idx) => {
        const isAI = msg.role === 'model';
        return (
          <div
            key={idx}
            className={`flex gap-2.5 max-w-[88%] ${
              isAI ? 'self-start items-end' : 'self-end flex-row-reverse items-end'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs mb-1 ${
                isAI
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isAI
                    ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)] border-none'
                    : 'bg-emerald-600 text-white rounded-br-xs shadow-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Remix system card if recipe was modified */}
              {isAI && msg.isRemixReady && msg.newRecipe && msg.newJobId && (
                <div className="p-4 border-none bg-emerald-500/10 dark:bg-emerald-500/15 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {t('copilot.remixReady')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">
                    Eine neue Version des Rezepts wurde generiert:{' '}
                    <span className="font-semibold italic">„{msg.newRecipe.title}“</span>.
                  </p>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-10 flex items-center justify-center gap-1.5 border-none shadow-none active:scale-95 transition-all text-xs"
                    onPress={() => onLoadNewRecipe(msg.newRecipe!, msg.newJobId!)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('copilot.remixLoadBtn')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loader/Pending reply */}
      {isPending && (
        <div className="flex gap-2.5 max-w-[88%] self-start items-end animate-pulse">
          <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mb-1">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3.5 py-3 rounded-2xl rounded-bl-xs border-none shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-2">
              <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>{pendingAction || t('copilot.loading')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border-none text-red-600 dark:text-red-400 text-xs text-center font-medium self-center max-w-[90%] shadow-xs">
          {error}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
export default CopilotChatList;
