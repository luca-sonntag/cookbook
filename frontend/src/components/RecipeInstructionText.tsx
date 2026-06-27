import { useMemo } from 'react';
import { Popover } from '@heroui/react';
import { Thermometer, Clock } from 'lucide-react';
import type { Recipe } from '../types';
import { useI18n } from '../context/I18nContext';

interface RecipeInstructionTextProps {
  text: string;
  recipe: Recipe;
  formatAmount: (amount: number, unit?: string) => string;
}

export default function RecipeInstructionText({ text, recipe, formatAmount }: RecipeInstructionTextProps) {
  const { t } = useI18n();

  // Flat list of ingredients
  const allIngredients = useMemo(() => {
    return recipe.ingredients ? recipe.ingredients.flatMap(g => g.items) : [];
  }, [recipe.ingredients]);

  // Highlights ingredients and equipment in instructions text
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

    const rangeSeparator = `(?:-|bis|to|a|al|et|and|or|ve)`;
    const tempPattern = `\\b\\d+(?:[.,]\\d+)?(?:\\s*${rangeSeparator}\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:Fahrenheit|Celsius|stopniach|degrees|stopnie|stopnia|degree|grados|degrés|graden|derece|stopni|grado|degré|graus|gradi|grau|Grad|°[CF]?)(?![a-zA-Z0-9])`;
    const timePattern = `\\b\\d+(?:[.,]\\d+)?(?:\\s*${rangeSeparator}\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:Sekunden|segundos|secondes|Minuten|minutes|minutos|Stunden|godzina|godziny|seconds|secondi|sekunda|seconde|secondo|segundo|sekundy|minuti|dakika|minuts|minuta|minuto|minute|minuty|heures|godzin|stunde|saniye|sekund|second|minut|hours|horas|godz\\.|heure|min\\.|mins|hour|hora|std\\.|godz|uren|saat|sek\\.|secs|sec\\.|sec\\.|seg\\.|min|dk\\.|std|hrs|hr\\.|ore|ora|uur|sek|sec|seg|sn\\.|dk|hr|u\\.|h\\.|sn|u|h)(?![a-zA-Z0-9])`;

    const escapedTerms = uniqueTerms.map(t => {
      let esc = t.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (t.term.length <= 3) {
        esc = `(?<=^|[\\s.,:;!?()\\[\\]{}'"\\-\\/])${esc}(?=$|[\\s.,:;!?()\\[\\]{}'"\\-\\/])`;
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
                className="inline-flex items-center gap-0.5 mx-0.5 font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 align-middle transition-colors cursor-default"
              >
                <Thermometer className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
                {part}
              </span>
            );
          }

          // Check for Timespan match
          const isTime = new RegExp(`^${timePattern}$`, 'i').test(part);
          if (isTime) {
            return (
              <span
                key={index}
                className="inline-flex items-center gap-0.5 mx-0.5 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 align-middle transition-colors cursor-default"
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
            return (
              <span key={index} onClick={(e) => e.stopPropagation()}>
                <Popover>
                  <Popover.Trigger>
                    <span className={`inline-block font-semibold decoration-dotted underline underline-offset-4 cursor-pointer transition-all outline-none ${isIng
                      ? 'text-emerald-600 dark:text-emerald-400 decoration-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-300'
                      : 'text-amber-600 dark:text-amber-400 decoration-amber-500 hover:text-amber-500 dark:hover:text-amber-300'
                      }`}>
                      {part}
                    </span>
                  </Popover.Trigger>
                  <Popover.Content
                    placement="top"
                    className="bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border border-black/10 dark:border-white/10 rounded-xl shadow-lg px-3 py-2"
                  >
                    <Popover.Dialog className="outline-none border-none p-0 m-0">
                      {matched.type === 'ingredient' && matched.ingredient ? (
                        <div className="flex flex-col gap-1 min-w-[140px] max-w-[240px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                              {matched.ingredient.name}
                            </span>
                            {(matched.ingredient.amount > 0 || matched.ingredient.unit) && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                                {formatAmount(matched.ingredient.amount, matched.ingredient.unit)}
                                {matched.ingredient.unit ? ` ${matched.ingredient.unit}` : ''}
                              </span>
                            )}
                          </div>
                          {(matched.ingredient.modifier || matched.ingredient.notes) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5 border-t border-black/5 dark:border-white/10 pt-1.5">
                              {matched.ingredient.modifier && (
                                <span className="text-[10px] text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-medium">
                                  {matched.ingredient.modifier}
                                </span>
                              )}
                              {matched.ingredient.notes && (
                                <span className="text-[10px] text-gray-600 dark:text-gray-400 italic font-normal">
                                  {matched.ingredient.notes}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{matched.info}</span>
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
  }, [text, recipe.ingredients, recipe.equipment, allIngredients, formatAmount, t]);

  return <>{renderedContent}</>;
}
