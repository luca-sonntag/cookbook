import { useState, useEffect, useRef } from 'react';
import { Button, Drawer, Input, Card } from '@heroui/react';
import { Send, Sparkles, Clock, ShoppingCart, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useTimerManager } from '../../hooks/useTimerManager';
import { useShoppingList } from '../../hooks/useShoppingList';
import type { Recipe } from '../../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  isRemixReady?: boolean;
  newJobId?: string;
  newRecipe?: Recipe;
}

interface RecipeCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  onRemixSuccess: (newRecipe: Recipe, newJobId: string) => void;
}

export default function RecipeCopilot({ isOpen, onClose, recipe, onRemixSuccess }: RecipeCopilotProps) {
  const { t, language } = useI18n();
  const { getAccessToken } = useAuth();
  const { addTimer } = useTimerManager();
  const { addCustomItem } = useShoppingList();

  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto focus input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, history]);

  // Extract first 3 ingredients from the recipe to generate dynamic substitution chips
  const displayIngredients = recipe.ingredients
    .flatMap(g => g.items)
    .slice(0, 3)
    .map(i => i.name);

  // Quick Chips categories
  const remixChips = [
    { label: t('remix.chips.vegan.label'), prompt: language === 'de' ? 'Mache es vegan' : 'Make it vegan' },
    { label: t('remix.chips.highProtein.label'), prompt: language === 'de' ? 'Mache es eiweißreich' : 'Make it high protein' },
    { label: t('copilot.chipPortions'), prompt: language === 'de' ? 'Portionen anpassen' : 'Adjust portions' }
  ];

  const helpChips = [
    { label: t('copilot.chipAirfryer'), prompt: t('copilot.chipAirfryer') },
    { label: t('copilot.chipRoux'), prompt: t('copilot.chipRoux') },
    { label: t('copilot.chipFreeze'), prompt: t('copilot.chipFreeze') }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isPending) return;

    setError(null);
    setIsPending(true);
    setMessage('');

    // Add user message to history
    const userMsg: Message = { role: 'user', text: textToSend };
    setHistory(prev => [...prev, userMsg]);

    try {
      const token = await getAccessToken();
      const cleanHistory = history.map(h => ({ role: h.role, text: h.text }));

      const res = await fetch(`/api/jobs/${recipe.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend,
          history: cleanHistory
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.code === 'PREMIUM_REQUIRED') {
          throw new Error(t('copilot.errorForbidden'));
        }
        throw new Error(errorData.error || t('copilot.errorGeneral'));
      }

      const data = await res.json();

      // Handle tool calls in frontend
      if (data.toolCalled === 'add_missing_ingredients_to_shopping_list' && data.toolArgs?.ingredients) {
        const items: string[] = data.toolArgs.ingredients;
        items.forEach(name => {
          // Look up ingredient details in current recipe for smart defaults
          let foundIng: any = null;
          for (const group of recipe.ingredients) {
            const match = group.items.find(i => 
              i.name.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(i.name.toLowerCase()) ||
              (i.baseName && i.baseName.toLowerCase().includes(name.toLowerCase()))
            );
            if (match) {
              foundIng = match;
              break;
            }
          }

          if (foundIng) {
            addCustomItem(
              foundIng.name + (foundIng.modifier ? `, ${foundIng.modifier}` : ''),
              foundIng.amount,
              foundIng.unit,
              foundIng.notes || ''
            );
          } else {
            addCustomItem(name, 0, '');
          }
        });
      } else if (data.toolCalled === 'set_cooking_timer' && data.toolArgs?.duration_minutes) {
        const mins = data.toolArgs.duration_minutes;
        const label = data.toolArgs.label || t('copilot.timerNoLabel');
        addTimer(mins * 60, label, recipe.id);
      }

      // Add AI reply to history
      const modelMsg: Message = {
        role: 'model',
        text: data.chatMessage,
        isRemixReady: data.recipeWasModified,
        newJobId: data.newJobId,
        newRecipe: data.updatedRecipeJson
      };

      setHistory(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Error sending message to Copilot:', err);
      setError(err.message || t('copilot.errorGeneral'));
      // Remove the last user message on failure to allow retry
      setHistory(prev => prev.slice(0, -1));
      setMessage(textToSend);
    } finally {
      setIsPending(false);
      setPendingAction(null);
    }
  };

  const handleLoadNewRecipe = (newRecipe: Recipe, newJobId: string) => {
    onRemixSuccess(newRecipe, newJobId);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} placement="bottom" className="!z-[100] h-[85vh] sm:h-[80vh] md:max-w-2xl md:mx-auto md:rounded-t-3xl">
      <Drawer.Content className="!z-[100] h-full">
        <Drawer.Dialog className="!bg-white dark:!bg-gray-900 flex flex-col h-full overflow-hidden">
          <Drawer.Handle />

          {/* Header */}
          <Drawer.Header className="border-b border-black/5 dark:border-white/5 py-4 px-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-500/10">
              <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <Drawer.Heading className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
                {t('copilot.title')}
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </Drawer.Heading>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-normal">
                {t('copilot.subtitle')}
              </p>
            </div>
          </Drawer.Header>

          {/* Body (Messages) */}
          <Drawer.Body className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 scrollbar-none bg-gray-50/50 dark:bg-black/10">
            
            {/* Welcome message if history is empty */}
            {history.length === 0 && (
              <div className="my-auto flex flex-col items-center text-center max-w-sm mx-auto gap-3 py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {t('copilot.title')}
                </h4>
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
                  className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                    isAI 
                      ? 'bg-emerald-600 border border-emerald-500/10' 
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                      isAI
                        ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-xs border border-black/5 dark:border-white/5'
                        : 'bg-emerald-600 text-white rounded-tr-xs'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Remix system card if recipe was modified */}
                    {isAI && msg.isRemixReady && msg.newRecipe && msg.newJobId && (
                      <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {t('copilot.remixReady')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">
                          Eine neue Version des Rezepts wurde generiert: <span className="font-semibold italic">„{msg.newRecipe.title}“</span>.
                        </p>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-xs"
                          onPress={() => handleLoadNewRecipe(msg.newRecipe!, msg.newJobId!)}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {t('copilot.remixLoadBtn')}
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loader/Pending reply */}
            {isPending && (
              <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600/50" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs px-3.5 py-3 rounded-2xl rounded-tl-xs border border-black/5 dark:border-white/5 flex items-center gap-2">
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>{pendingAction || t('copilot.loading')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium self-center max-w-[90%]">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </Drawer.Body>

          {/* Footer: Quick Chips & Message Input */}
          <div className="border-t border-black/5 dark:border-white/5 p-4 flex flex-col gap-3.5 bg-white dark:bg-gray-900 flex-shrink-0">
            
            {/* Quick Chips Scroll Container */}
            {history.length < 5 && (
              <div className="flex flex-col gap-2">
                {/* Category 1: Remix */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 mr-1">
                    {t('copilot.chipsHeaderRemix')}:
                  </span>
                  {remixChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip.prompt)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-semibold rounded-full border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Category 2: Preparation Help */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 mr-1">
                    {t('copilot.chipsHeaderHelp')}:
                  </span>
                  {helpChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip.prompt)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-semibold rounded-full border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Category 3: Substitutions */}
                {displayIngredients.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 mr-1">
                      {t('copilot.chipsHeaderSubs')}:
                  </span>
                    {displayIngredients.map((ing, idx) => {
                      const promptText = language === 'de' 
                        ? `Ich habe kein/e ${ing} mehr - was kann ich als Alternative nehmen?` 
                        : `I don't have any ${ing} left - what can I use as a substitute?`;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSend(promptText)}
                          disabled={isPending}
                          className="px-3 py-1.5 text-xs font-semibold rounded-full border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Alternative für {ing}?
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Message Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(message);
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('copilot.placeholder')}
                disabled={isPending}
                aria-label={t('copilot.placeholder')}
                className="flex-1"
                classNames={{
                  input: 'text-sm bg-transparent',
                  inputWrapper: 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 h-11'
                }}
                endContent={
                  <Button
                    type="submit"
                    isIconOnly
                    size="sm"
                    disabled={isPending || !message.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-8 w-8 min-w-8 shadow-sm flex-shrink-0 active:scale-90 transition-all"
                    aria-label={t('copilot.sendAria')}
                  >
                    <Send className="w-4 h-4 fill-white" />
                  </Button>
                }
              />
            </form>
          </div>

        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer>
  );
}
