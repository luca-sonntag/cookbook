import React, { useMemo } from 'react';
import { Popover } from '@heroui/react';
import type { Recipe } from '../types';
import { useI18n } from '../context/I18nContext';
import { getIngredientTargets, matchesIngredientWord } from '../utils/matching';

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

    const matches: { start: number; end: number; type: 'ingredient' | 'equipment'; info: string; length: number }[] = [];

    // 1. Single word token matching
    const wordRegex = /[a-zA-Z0-9äöüÄÖÜßéèàâêîôûçÈÉÀÂÊÎÔÛÇ\-]+/g;
    let matchExec;
    while ((matchExec = wordRegex.exec(text)) !== null) {
      const textWord = matchExec[0].toLowerCase();
      const start = matchExec.index;
      const end = start + matchExec[0].length;

      // A. Check equipment
      if (recipe.equipment) {
        let matchedEq = false;
        for (const eq of recipe.equipment) {
          if (!eq || eq.length <= 2) continue;
          if (textWord === eq.toLowerCase() || (eq.toLowerCase().startsWith(textWord) && eq.length - textWord.length >= 3 && textWord.length >= 3)) {
            matches.push({
              start,
              end,
              type: 'equipment',
              info: t('recipe.equipmentTooltip', { name: eq }),
              length: matchExec[0].length
            });
            matchedEq = true;
            break;
          }
        }
        if (matchedEq) continue;
      }

      // B. Check ingredients
      for (const ing of allIngredients) {
        const targets = getIngredientTargets(ing);
        const singleWordTargets = targets.filter(t => !t.includes(' '));
        
        const isIngMatch = singleWordTargets.some(target => matchesIngredientWord(textWord, target));
        if (isIngMatch) {
          const scaledAmount = formatAmount(ing.amount, ing.unit);
          const amountStr = scaledAmount ? `${scaledAmount} ` : '';
          const unitStr = ing.unit ? `${ing.unit} ` : '';
          const noteStr = ing.notes ? ` (${ing.notes})` : '';
          let info = `${ing.name}`.trim();
          if (noteStr) {
            info += ` ,${noteStr}`;
          }
          info += ` (${amountStr}${unitStr})`;

          matches.push({
            start,
            end,
            type: 'ingredient',
            info,
            length: matchExec[0].length
          });
          break;
        }
      }
    }

    // 2. Multi-word phrase matching
    allIngredients.forEach(ing => {
      const targets = getIngredientTargets(ing);
      const multiWordTargets = targets.filter(t => t.includes(' '));

      multiWordTargets.forEach(target => {
        const escaped = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const phraseRegex = new RegExp(`(?<=^|[\\s.,:;!?()\\[\\]{}'"\\-\\/])${escaped}(?=$|[\\s.,:;!?()\\[\\]{}'"\\-\\/])`, 'gi');
        let phraseMatch;
        while ((phraseMatch = phraseRegex.exec(text)) !== null) {
          const start = phraseMatch.index;
          const end = start + phraseMatch[0].length;

          const scaledAmount = formatAmount(ing.amount, ing.unit);
          const amountStr = scaledAmount ? `${scaledAmount} ` : '';
          const unitStr = ing.unit ? `${ing.unit} ` : '';
          const noteStr = ing.notes ? ` (${ing.notes})` : '';
          let info = `${ing.name}`.trim();
          if (noteStr) {
            info += ` ,${noteStr}`;
          }
          info += ` (${amountStr}${unitStr})`;

          matches.push({
            start,
            end,
            type: 'ingredient',
            info,
            length: phraseMatch[0].length
          });
        }
      });
    });

    if (recipe.equipment) {
      recipe.equipment.forEach(eq => {
        if (eq && eq.includes(' ') && eq.length > 2) {
          const escaped = eq.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const phraseRegex = new RegExp(`(?<=^|[\\s.,:;!?()\\[\\]{}'"\\-\\/])${escaped}(?=$|[\\s.,:;!?()\\[\\]{}'"\\-\\/])`, 'gi');
          let phraseMatch;
          while ((phraseMatch = phraseRegex.exec(text)) !== null) {
            const start = phraseMatch.index;
            const end = start + phraseMatch[0].length;
            matches.push({
              start,
              end,
              type: 'equipment',
              info: t('recipe.equipmentTooltip', { name: eq }),
              length: phraseMatch[0].length
            });
          }
        }
      });
    }

    // Resolve overlaps (longest match first)
    matches.sort((a, b) => b.length - a.length);

    const acceptedMatches: typeof matches = [];
    const coveredChars = new Set<number>();

    matches.forEach(m => {
      let overlap = false;
      for (let i = m.start; i < m.end; i++) {
        if (coveredChars.has(i)) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        acceptedMatches.push(m);
        for (let i = m.start; i < m.end; i++) {
          coveredChars.add(i);
        }
      }
    });

    // Sort by start index ascending
    acceptedMatches.sort((a, b) => a.start - b.start);

    if (acceptedMatches.length === 0) return <span>{text}</span>;

    const resultParts: React.ReactNode[] = [];
    let currentIndex = 0;

    acceptedMatches.forEach((m, idx) => {
      if (m.start > currentIndex) {
        resultParts.push(text.slice(currentIndex, m.start));
      }

      const matchedText = text.slice(m.start, m.end);
      const isIng = m.type === 'ingredient';

      resultParts.push(
        <span key={`match-${idx}`} onClick={(e) => e.stopPropagation()}>
          <Popover>
            <Popover.Trigger>
              <span className={`inline-block font-semibold decoration-dotted underline underline-offset-4 cursor-pointer transition-all outline-none ${
                isIng
                  ? 'text-emerald-600 dark:text-emerald-400 decoration-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-300'
                  : 'text-amber-600 dark:text-amber-400 decoration-amber-500 hover:text-amber-500 dark:hover:text-amber-300'
              }`}>
                {matchedText}
              </span>
            </Popover.Trigger>
            <Popover.Content
              placement="top"
              className="bg-black/90 dark:bg-white/95 text-white dark:text-gray-900 shadow-md rounded-lg backdrop-blur-sm border border-white/10 dark:border-black/10 px-2 py-1.5"
            >
              <Popover.Dialog className="outline-none border-none p-0 m-0">
                <span className="text-xs font-semibold">{m.info}</span>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </span>
      );

      currentIndex = m.end;
    });

    if (currentIndex < text.length) {
      resultParts.push(text.slice(currentIndex));
    }

    return <>{resultParts}</>;
  }, [text, recipe.ingredients, recipe.equipment, allIngredients, formatAmount, t]);

  return <>{renderedContent}</>;
}
