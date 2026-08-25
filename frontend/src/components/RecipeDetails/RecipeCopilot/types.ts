import type { Recipe } from '../../../types';

export interface Chip {
  label: string;
  prompt: string;
  category: string;
}

export interface PendingChange {
  id: string;
  text: string;
}

export interface CopilotMessage {
  role: 'user' | 'model';
  text: string;
  isRemixReady?: boolean;
  newJobId?: string;
  newRecipe?: Recipe;
}

export interface RecipeCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  onRemixSuccess: (newRecipe: Recipe, newJobId: string) => void;
  onReplaceCurrent: (newRecipe: Recipe) => void;
}
