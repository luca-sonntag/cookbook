import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea
} from '@heroui/react';
import { Sparkles, Wand2 } from 'lucide-react';
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

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom-center"
      backdrop="blur"
      isDismissable={!isPending}
      hideCloseButton={isPending}
    >
      <ModalContent className="sm:m-4 bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 rounded-t-2xl sm:rounded-2xl">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-6 pt-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Recipe Remix
              </h3>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Lass die KI das Rezept für dich anpassen.
              </p>
            </ModalHeader>
            <ModalBody className="px-6 py-2">
              <div className="flex flex-wrap gap-2 mb-4">
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
              <Textarea
                value={prompt}
                onValueChange={setPrompt}
                placeholder="Oder schreibe deinen eigenen Wunsch... z.B. 'Ich habe keine Eier, was kann ich nehmen?'"
                minRows={3}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-black/10 dark:border-white/10"
                }}
                disabled={isPending}
              />
              
              {isPending && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-pulse">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    Remix wird generiert...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status: {jobStatus}
                  </p>
                </div>
              )}

              {jobError && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {jobError}
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="px-6 pb-6">
              <Button 
                variant="light" 
                onPress={onClose}
                disabled={isPending}
                className="font-semibold"
              >
                Abbrechen
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isPending}
                isDisabled={!prompt.trim()}
                className="bg-emerald-600 font-semibold shadow-md"
                endContent={!isPending && <Wand2 className="w-4 h-4" />}
              >
                Remix starten
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
