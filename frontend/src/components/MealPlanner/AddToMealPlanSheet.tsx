import React, { useState } from 'react';
import { Drawer } from '@heroui/react';
import { Calendar, Sun, Utensils, Moon, Cookie, Plus, Minus, Loader2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../api';
import type { MealType, Recipe } from '../../types';
import { formatDateIso, addDays } from './useMealPlanner';

interface AddToMealPlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipe: Recipe;
  initialServings?: number;
  onAddedSuccess?: () => void;
}

const MEAL_OPTIONS: Array<{ type: MealType; labelKey: string; icon: React.ReactNode }> = [
  { type: 'breakfast', labelKey: 'mealPlanner.meals.breakfast', icon: <Sun className="w-4 h-4 text-amber-500" /> },
  { type: 'lunch', labelKey: 'mealPlanner.meals.lunch', icon: <Utensils className="w-4 h-4 text-emerald-500" /> },
  { type: 'dinner', labelKey: 'mealPlanner.meals.dinner', icon: <Moon className="w-4 h-4 text-indigo-500" /> },
  { type: 'snack', labelKey: 'mealPlanner.meals.snack', icon: <Cookie className="w-4 h-4 text-rose-500" /> },
];

export const AddToMealPlanSheet: React.FC<AddToMealPlanSheetProps> = ({
  isOpen,
  onClose,
  recipeId,
  recipe,
  initialServings = 2,
  onAddedSuccess,
}) => {
  const { t } = useI18n();
  const { getAccessToken, user } = useAuth();
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateIso(new Date()));
  const [selectedMeal, setSelectedMeal] = useState<MealType>('dinner');
  const [servings, setServings] = useState<number>(initialServings);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick date chips for the next 5 days
  const quickDays = React.useMemo(() => {
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = addDays(today, i);
      const dStr = formatDateIso(d);
      const label =
        i === 0
          ? t('mealPlanner.today')
          : d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
      return { dateStr: dStr, label };
    });
  }, [t]);

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl('/api/meal-plan'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipeId,
          planDate: selectedDate,
          mealType: selectedMeal,
          servings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('mealPlanner.addedToPlan'));
        onAddedSuccess?.();
        onClose();
      } else {
        toast.danger('Fehler beim Hinzufügen zum Plan');
      }
    } catch (err) {
      console.error('Failed to add recipe to meal plan:', err);
      toast.danger('Netzwerkfehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Drawer>
        <Drawer.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
          className="!z-[100]"
        >
          <Drawer.Content placement="bottom" className="!z-[100]">
            <Drawer.Dialog className="relative !bg-white dark:!bg-gray-900 max-h-[85vh] flex flex-col p-5 pb-[calc(1.5rem_+_var(--safe-area-inset-bottom))] rounded-t-3xl border-none shadow-2xl">
              <Drawer.Handle />

              {/* Header */}
              <Drawer.Header className="pb-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <Drawer.Heading className="text-base font-bold text-gray-900 dark:text-white">
                      {t('mealPlanner.addToPlan')}
                    </Drawer.Heading>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{recipe.title}</p>
              </Drawer.Header>

              {/* Body */}
              <Drawer.Body className="overflow-y-auto py-2 flex flex-col gap-4">
                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('mealPlanner.selectDate')}
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {quickDays.map((q) => (
                      <button
                        key={q.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(q.dateStr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                          selectedDate === q.dateStr
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Meal Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('mealPlanner.selectMealType')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSelectedMeal(opt.type)}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border-none text-xs font-semibold transition-all cursor-pointer ${
                          selectedMeal === opt.type
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm shadow-emerald-600/10'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {opt.icon}
                        <span>{t(opt.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Servings Stepper */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('mealPlanner.servings')}
                  </label>
                  <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setServings((s) => Math.max(1, s - 1))}
                      disabled={servings <= 1}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold min-w-4 text-center">{servings}</span>
                    <button
                      type="button"
                      onClick={() => setServings((s) => s + 1)}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700 active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Drawer.Body>

              {/* Footer */}
              <Drawer.Footer className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-200 active:scale-95 transition-all"
                >
                  {t('mealPlanner.cancelBtn')}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex-[2] py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('mealPlanner.addToPlan')
                  )}
                </button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
};

export default AddToMealPlanSheet;
