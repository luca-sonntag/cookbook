import { useState } from 'react';
import { Button, Card } from '@heroui/react';
import { Sparkles, Wand2, X } from 'lucide-react';
import { useRecipeRemix } from '../hooks/useRecipeRemix';
import type { Recipe } from '../types';

interface RemixModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipeId: string;
  onRemixSuccess: (newRecipe: Recipe) => void;
}

const QUICK_CHIPS = [
  { label: '🌱 Vegan', prompt: 'Make it vegan' },
  { label: '💪 High Protein', prompt: 'Make it high protein' },
  { label: '📉 Kalorienarm', prompt: 'Make it low calorie' },
  { label: '💰 Günstig', prompt: 'Make it budget friendly' },
  { label: '🌾 Glutenfrei', prompt: 'Make it gluten free' }
];

export default function RemixModal({ isOpen, onOpenChange, recipeId, onRemixSuccess }: RemixModalProps) {
  const [prompt, setPrompt] = useState('');
  
  const handleSuccess = (newRecipe: Recipe) => {
    onOpenChange(false);
    onRemixSuccess(newRecipe);
  };

  const { isPending, triggerRemix, jobStatus, jobError } = useRecipeRemix(handleSuccess);

  const handleChipClick = (chipPrompt: string) => {
    setPrompt(chipPrompt);
  };

  const handleSubmit = () => {
    triggerRemix(recipeId, prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => !isPending && onOpenChange(false)}
      />

      {/* Modal Container */}
      <Card className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-2xl bg-white dark:bg-gray-900 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 z-10">
        
        {!isPending && (
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col gap-1 pr-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Recipe Remix
          </h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Lass die KI das Rezept für dich anpassen.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip.prompt)}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Oder schreibe deinen eigenen Wunsch... z.B. 'Ich habe keine Eier, was kann ich nehmen?'"
            rows={3}
            disabled={isPending}
            className="w-full text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
          
          {isPending && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-pulse">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Remix wird generiert...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                Status: {jobStatus}
              </p>
            </div>
          )}

          {jobError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {jobError}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 mt-2">
          <Button 
            variant="ghost" 
            onPress={() => onOpenChange(false)}
            isDisabled={isPending}
            className="font-semibold text-gray-600 dark:text-gray-300"
          >
            Abbrechen
          </Button>
          <Button
            onPress={handleSubmit}
            isDisabled={isPending || !prompt.trim()}
            className="bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 flex items-center gap-2"
          >
            Remix starten
            {!isPending && <Wand2 className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
