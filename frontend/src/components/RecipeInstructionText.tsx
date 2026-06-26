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

    const terms: { term: string; type: 'ingredient' | 'equipment'; original: string; info: string }[] = [];

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
        terms.push({ term: ing.name.toLowerCase(), type: 'ingredient', original: ing.name, info });
      }
      if (ing.baseName && ing.baseName.length >= 2) {
        terms.push({ term: ing.baseName.toLowerCase(), type: 'ingredient', original: ing.name, info });
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

    const tempPattern = `\\b\\d+(?:[.,]\\d+)?(?:\\s*(?:-|bis|to)\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:°[CF]?|Grad|Fahrenheit|Celsius)(?![a-zA-Z0-9])`;
    const timePattern = `\\b\\d+(?:[.,]\\d+)?(?:\\s*(?:-|bis|to)\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:Minuten|Min\\.|Min|Stunden|Std\\.|Std|Sekunden|Sek\\.|Sek|Stunde|Minute|Sekunde|minutes|mins|min\\.|min|hours|hrs|hr\\.|hr|hour|seconds|secs|sec\\.|sec|second)(?![a-zA-Z0-9])`;

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
                className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900/30 align-middle transition-colors hover:bg-orange-100/50 dark:hover:bg-orange-900/40"
              >
                <Thermometer className="w-3 h-3 text-orange-500 dark:text-orange-400" />
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
                className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/30 align-middle transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/40"
              >
                <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
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
                    className="bg-black/90 dark:bg-white/95 text-white dark:text-gray-900 shadow-md rounded-lg backdrop-blur-sm border border-white/10 dark:border-black/10 px-2 py-1.5"
                  >
                    <Popover.Dialog className="outline-none border-none p-0 m-0">
                      <span className="text-xs font-semibold">{matched.info}</span>
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
