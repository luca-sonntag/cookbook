import { useMemo, useState } from 'react';
import { Popover } from '@heroui/react';
import { Thermometer, Clock } from 'lucide-react';
import type { Recipe } from '../types';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import TimerConfirmSheet from './TimerConfirmSheet';
import PremiumModal from './PremiumModal';

interface RecipeInstructionTextProps {
  text: string;
  recipe: Recipe;
  formatAmount: (amount: number, unit?: string) => string;
  stepNum?: number;
}

// ─── Time parsing helper ──────────────────────────────────────────────────────

/**
 * Converts a matched time string like "15 Minuten", "1,5 Stunden", "30 min" into seconds.
 * Returns 0 if parsing fails.
 */
function parseTimeToSeconds(timeStr: string): number {
  const s = timeStr.toLowerCase().trim();

  // Extract the first numeric value (supports decimals with . or ,)
  const numMatch = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) return 0;
  const value = parseFloat(numMatch[1].replace(',', '.'));

  // Detect unit
  const isHour = /stunden?|hours?|heures?|horas?|ore|uur|saat|std\.?|hrs?\.?|h\.?|godz\.?|godzin|godziny\b/.test(s);
  const isMinute = /minuten?|minutes?|minutos?|minuti|minuts?|minuty|minute?|minuta|minuty|dakika|min\.?|mins?\.?|dk\.?\b/.test(s);
  const isSecond = /sekunden?|seconds?|segundos?|secondes?|secondi|sekunda|sekundy|sekund|sekunde|saniye|sek\.?|secs?\.?|sec\.?|seg\.?|sn\.?\b/.test(s);

  if (isHour) return Math.round(value * 3600);
  if (isMinute) return Math.round(value * 60);
  if (isSecond) return Math.round(value);

  // Fallback: treat as minutes if no unit detected
  return Math.round(value * 60);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecipeInstructionText({ text, recipe, formatAmount, stepNum }: RecipeInstructionTextProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();

  // Timer confirm sheet state
  const [timerSheet, setTimerSheet] = useState<{ isOpen: boolean; seconds: number; label: string }>({
    isOpen: false,
    seconds: 0,
    label: '',
  });

  // In-app timers are a premium feature — free users get the upsell instead.
  const [premiumOpen, setPremiumOpen] = useState(false);

  // Flat list of ingredients
  const allIngredients = useMemo(() => {
    return recipe.ingredients ? recipe.ingredients.flatMap(g => g.items) : [];
  }, [recipe.ingredients]);

  // Highlights ingredients, equipment, temperatures, and time spans in instructions text
  const renderedContent = useMemo(() => {
    if (!text) return text;
    if (!recipe.ingredients && !recipe.equipment) return <span>{text}</span>;

    const terms: {
      term: string;
      type: 'ingredient' | 'equipment';
      original: string;
      ingredient?: typeof allIngredients[number];
      info: string;
    }[] = [];

    // Add ingredients
    allIngredients.forEach(ing => {
      const scaledAmount = formatAmount(ing.amount, ing.unit);
      const amountStr = scaledAmount ? `${scaledAmount} ` : '';
      const unitStr = ing.unit ? `${ing.unit} ` : '';
      const modifierStr = ing.modifier ? ` (${ing.modifier})` : '';
      const noteStr = ing.notes ? ` (${ing.notes})` : '';
      let info = `${ing.name}${modifierStr}`.trim();
      if (noteStr) {
        info += ` ,${noteStr}`;
      }
      info += ` (${amountStr}${unitStr})`;

      if (ing.name && ing.name.length >= 2) {
        terms.push({
          term: ing.name.toLowerCase(),
          type: 'ingredient',
          original: ing.name,
          ingredient: ing,
          info
        });
      }
      if (ing.baseName && ing.baseName.length >= 2) {
        terms.push({
          term: ing.baseName.toLowerCase(),
          type: 'ingredient',
          original: ing.name,
          ingredient: ing,
          info
        });
      }
    });

    // Add equipment
    if (recipe.equipment) {
      recipe.equipment.forEach(eq => {
        if (eq && eq.length > 2) {
          terms.push({
            term: eq.toLowerCase(),
            type: 'equipment',
            original: eq,
            info: t('recipe.equipmentTooltip', { name: eq })
          });
        }
      });
    }

    // Sort by term length descending to match longest terms first
    terms.sort((a, b) => b.term.length - a.term.length);

    // Remove duplicates
    const uniqueTerms = terms.filter((item, index, self) =>
      self.findIndex(t => t.term === item.term) === index
    );

    const rangeSeparator = `(?:–|—|-|bis|to|a|al|et|and|or|ve)`;
    const tempPattern = `\\b\\d+(?:[.,]\\d+)?(?:\\s*${rangeSeparator}\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:Fahrenheit|Celsius|stopniach|degrees|stopnie|stopnia|degree|grados|degrés|graden|derece|stopni|grado|degré|graus|gradi|grau|Grad|°[CF]?)(?![a-zA-Z0-9])`;
    const timePattern = `\\b\\d+(?:[.,]\\d+)?(?:\\s*${rangeSeparator}\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:Sekunden|segundos|secondes|Minuten|minutes|minutos|Stunden|godzina|godziny|seconds|secondi|sekunda|seconde|secondo|segundo|sekundy|minuti|dakika|minuts|minuta|minuto|minute|minuty|heures|godzin|stunde|saniye|sekund|second|minut|hours|horas|godz\\.|heure|min\\.|mins|hour|hora|std\\.|godz|uren|saat|sek\\.|secs|sec\\.|sec\\.|seg\\.|min|dk\\.|std|hrs|hr\\.|ore|ora|uur|sek|sec|seg|sn\\.|dk|hr|u\\.|h\\.|sn|u|h)(?![a-zA-Z0-9])`;

    const escapedTerms = uniqueTerms.map(t => {
      let esc = t.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (t.term.length <= 3) {
        esc = `(?<=^|[\\s.,:;!?()\[\\]{}'\"\\-\\/])${esc}(?=$|[\\s.,:;!?()\[\\]{}'\"\\-\\/])`;
      } else {
        // Also match parenthetical suffixes like (n), (er) as part of the word
        esc = `${esc}(?:\\([^)]*\\))?`;
      }
      return esc;
    });

    const regex = new RegExp(`(${[tempPattern, timePattern, ...escapedTerms].join('|')})`, 'gi');

    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) => {
          // Check for Temperature match
          const isTemp = new RegExp(`^${tempPattern}$`, 'i').test(part);
          if (isTemp) {
            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-lg text-[0.9em] font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors cursor-default select-none"
              >
                {part}
              </span>
            );
          }

          // Check for Timespan match — render as clickable timer trigger
          const isTime = new RegExp(`^${timePattern}$`, 'i').test(part);
          if (isTime) {
            const seconds = parseTimeToSeconds(part);
            const canTimer = seconds >= 15; // Only show timer if ≥15 seconds

            return (
              <span
                key={index}
                onClick={canTimer ? (e) => {
                  e.stopPropagation();
                  if (!isPremium) {
                    setPremiumOpen(true);
                    return;
                  }
                  setTimerSheet({ isOpen: true, seconds, label: text });
                } : undefined}
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 mx-0.5 rounded-lg text-[0.9em] font-semibold transition-all select-none ${
                  canTimer
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer shadow-sm active:scale-95'
                    : 'bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/20 cursor-default'
                }`}
                title={canTimer ? 'Timer starten / Start timer' : undefined}
              >
                <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                {part}
              </span>
            );
          }

          const matched = uniqueTerms.find(t => {
            const lower = part.toLowerCase();
            if (lower === t.term) return true;
            // Match term with parenthetical suffix like "Zwiebel(n)", "Tomate(er)"
            if (lower.startsWith(t.term) && /^\([^)]*\)$/.test(lower.slice(t.term.length))) return true;
            return false;
          });
          if (matched) {
            const isIng = matched.type === 'ingredient';

            // Equipment: always plain text, no popover, no underline
            if (!isIng) {
              return <span key={index} className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-lg text-[0.9em] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">{part}</span>;
            }

            return (
              <span key={index} onClick={(e) => e.stopPropagation()} className="inline-block">
                <Popover>
                  <Popover.Trigger>
                    <span className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-lg text-[0.9em] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 cursor-pointer transition-all outline-none shadow-sm active:scale-95">
                      {part}
                    </span>
                  </Popover.Trigger>
                  <Popover.Content
                    placement="top"
                    className="bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border border-black/10 dark:border-white/10 rounded-xl shadow-lg px-4 py-2.5"
                  >
                    <Popover.Dialog className="outline-none border-none p-0 m-0">
                      {matched.type === 'ingredient' && matched.ingredient ? (
                        <div className="flex flex-col min-w-[140px] max-w-[260px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                              {matched.ingredient.name}
                            </span>
                            {(matched.ingredient.amount > 0 || matched.ingredient.unit) && (
                              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
                                {formatAmount(matched.ingredient.amount, matched.ingredient.unit)}
                                {matched.ingredient.unit ? ` ${matched.ingredient.unit}` : ''}
                              </span>
                            )}
                          </div>
                          {(matched.ingredient.modifier || matched.ingredient.notes) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 leading-tight">
                              {[matched.ingredient.modifier, matched.ingredient.notes].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{matched.info}</span>
                      )}
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </span>
            );
          }
          return part;
        })}
      </>
    );
  }, [text, recipe.ingredients, recipe.equipment, allIngredients, formatAmount, t, isPremium]);

  return (
    <>
      {renderedContent}
      <TimerConfirmSheet
        isOpen={timerSheet.isOpen}
        durationSeconds={timerSheet.seconds}
        label={timerSheet.label}
        recipeId={recipe.id}
        stepNum={stepNum}
        onClose={() => setTimerSheet(s => ({ ...s, isOpen: false }))}
      />
      <PremiumModal isOpen={premiumOpen} onOpenChange={setPremiumOpen} />
    </>
  );
}
