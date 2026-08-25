import React from 'react';
import { Button, Drawer } from '@heroui/react';
import { Bot, X, Trash2 } from 'lucide-react';
import { useI18n } from '../../../context/I18nContext';
import { useRecipeCopilot } from './useRecipeCopilot';
import CopilotChatList from './CopilotChatList';
import CopilotTransactionCard from './CopilotTransactionCard';
import CopilotInputBar from './CopilotInputBar';
import type { RecipeCopilotProps } from './types';

export const RecipeCopilot: React.FC<RecipeCopilotProps> = ({
  isOpen,
  onClose,
  recipe,
  onRemixSuccess,
  onReplaceCurrent,
}) => {
  const { t } = useI18n();

  const {
    message,
    setMessage,
    history,
    isPending,
    pendingAction,
    error,
    showChips,
    setShowChips,
    chips,
    chipsLoading,
    confirmingClear,
    setConfirmingClear,
    pendingChanges,
    choosingApply,
    setChoosingApply,
    messagesEndRef,
    textareaRef,
    handleSend,
    handleLoadNewRecipe,
    removeChange,
    discardAllChanges,
    handleApplyChanges,
    performClearSession,
  } = useRecipeCopilot({
    isOpen,
    recipe,
    onClose,
    onRemixSuccess,
    onReplaceCurrent,
  });

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop className="!z-[100]">
        <Drawer.Content
          placement="bottom"
          className="!z-[100] h-[100dvh] w-full rounded-none md:max-w-2xl md:mx-auto md:h-[85vh] md:rounded-t-3xl"
        >
          <Drawer.Dialog className="relative !bg-white dark:!bg-gray-900 flex flex-col h-full overflow-hidden">
            {/* Header: Clean 3-Column Bar */}
            <div className="h-14 px-4 flex items-center justify-between flex-shrink-0 select-none bg-white dark:bg-gray-900 border-none relative z-10">
              {/* Left: Clear button or empty placeholder */}
              <div className="w-9 flex justify-start">
                {history.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(true)}
                    disabled={isPending}
                    className="w-9 h-9 rounded-xl bg-gray-100/80 hover:bg-red-500/10 dark:bg-gray-800/80 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 active:scale-95 transition-all outline-none border-none cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={t('copilot.clearAria')}
                    title={t('copilot.clearAria')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-9" />
                )}
              </div>

              {/* Center: Title & Live Indicator */}
              <div className="flex items-center gap-2 max-w-[65%]">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 leading-none truncate">
                  {t('copilot.title')}
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </span>
              </div>

              {/* Right: Close button */}
              <div className="w-9 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-gray-100/80 hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white active:scale-95 transition-all outline-none border-none cursor-pointer flex items-center justify-center"
                  aria-label={t('dialog.closeAria')}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Chat message list */}
            <CopilotChatList
              history={history}
              isPending={isPending}
              pendingAction={pendingAction}
              error={error}
              messagesEndRef={messagesEndRef}
              onLoadNewRecipe={handleLoadNewRecipe}
            />

            {/* Footer: Transaction Card, Quick Chips & Message Input */}
            <div className="pt-2 pb-[calc(1rem_+_var(--safe-area-inset-bottom))] px-4 sm:px-6 flex flex-col gap-2.5 bg-white dark:bg-gray-900 flex-shrink-0">
              <CopilotTransactionCard
                pendingChanges={pendingChanges}
                choosingApply={choosingApply}
                setChoosingApply={setChoosingApply}
                isPending={isPending}
                onRemoveChange={removeChange}
                onDiscardAll={discardAllChanges}
                onApplyChanges={handleApplyChanges}
              />

              <CopilotInputBar
                message={message}
                setMessage={setMessage}
                isPending={isPending}
                showChips={showChips}
                setShowChips={setShowChips}
                chips={chips}
                chipsLoading={chipsLoading}
                textareaRef={textareaRef}
                onSend={handleSend}
              />
            </div>

            {/* Clear/Reset confirmation dialog */}
            {confirmingClear && (
              <div className="absolute inset-0 z-[60] flex items-center justify-center p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="w-full max-w-xs rounded-2xl border-none p-5 shadow-2xl bg-white dark:bg-gray-900 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                  <div className="flex gap-3 items-start">
                    <div className="p-2.5 rounded-xl border-none flex-shrink-0 flex items-center justify-center bg-amber-500/10">
                      <Trash2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                        {t('copilot.clearConfirmTitle')}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t('copilot.clearConfirmBody')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5">
                    <Button
                      variant="tertiary"
                      onPress={() => setConfirmingClear(false)}
                      className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium"
                    >
                      {t('dialog.cancelDefault')}
                    </Button>
                    <Button
                      onPress={performClearSession}
                      className="bg-amber-500 hover:bg-amber-400 text-white font-medium shadow-md transition-all"
                    >
                      {t('copilot.clearConfirmBtn')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
};

export default RecipeCopilot;
