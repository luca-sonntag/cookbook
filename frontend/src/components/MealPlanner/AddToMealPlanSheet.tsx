import React, { useState, useMemo } from 'react';
import { Drawer } from '@heroui/react';
import {
  Calendar,
  Coffee,
  Utensils,
  Moon,
  Apple,
  Plus,
  Minus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Users,
  X,
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAdOverlay } from '../../context/OverlayStackContext';
import { apiUrl } from '../../api';
import type { MealType, Recipe } from '../../types';
import { formatDateIso, addDays, getMonday } from './useMealPlanner';
import { getTotalTime } from '../../hooks/useSavedCatalog';
import CachedImage from '../CachedImage';
import { hapticLight, hapticSelection } from '../../utils/haptics';

interface AddToMealPlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipe: Recipe;
  initialServings?: number;
  onAddedSuccess?: () => void;
}

const MEAL_OPTIONS: Array<{ type: MealType; labelKey: string; icon: React.ReactNode }> = [
  {
    type: 'breakfast',
    labelKey: 'mealPlanner.meals.breakfast',
    icon: <Coffee className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />,
  },
  {
    type: 'lunch',
    labelKey: 'mealPlanner.meals.lunch',
    icon: <Utensils className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />,
  },
  {
    type: 'dinner',
    labelKey: 'mealPlanner.meals.dinner',
    icon: <Moon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />,
  },
  {
    type: 'snack',
    labelKey: 'mealPlanner.meals.snack',
    icon: <Apple className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />,
  },
];

export const AddToMealPlanSheet: React.FC<AddToMealPlanSheetProps> = ({
  isOpen,
  onClose,
  recipeId,
  recipe,
  initialServings = 2,
  onAddedSuccess,
}) => {
  useAdOverlay(isOpen);
  const { t, language } = useI18n();
  const { getAccessToken, user } = useAuth();
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateIso(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedMeal, setSelectedMeal] = useState<MealType>('dinner');
  const [servings, setServings] = useState<number>(initialServings);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const totalTime = useMemo(() => getTotalTime(recipe), [recipe]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekLabel = useMemo(() => {
    const locale = language === 'en' ? 'en-US' : 'de-DE';
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonth = weekStart.toLocaleDateString(locale, { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString(locale, { month: 'short' });
    if (startMonth === endMonth) {
      return `${startDay}. – ${endDay}. ${startMonth}`;
    }
    return `${startDay}. ${startMonth} – ${endDay}. ${endMonth}`;
  }, [weekStart, weekEnd, language]);

  const weekDays = useMemo(() => {
    const todayStr = formatDateIso(new Date());
    const locale = language === 'en' ? 'en-US' : 'de-DE';
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const dateStr = formatDateIso(d);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
      const dayNumber = d.getDate();
      const isToday = dateStr === todayStr;
      return { dateStr, dayName, dayNumber, isToday };
    });
  }, [weekStart, language]);

  const handlePrevWeek = () => {
    hapticLight();
    setWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    hapticLight();
    setWeekStart((prev) => addDays(prev, 7));
  };

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

  const recipeImage = recipe.imageUrl || recipe.imageUrls?.[0];
  const calories = recipe.nutritionalValues?.calories;

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
            <Drawer.Dialog className="relative !bg-white dark:!bg-gray-900 max-h-[90vh] flex flex-col p-5 pb-[calc(1.5rem_+_var(--safe-area-inset-bottom))] rounded-t-3xl border-none shadow-[0_-4px_30px_rgba(0,0,0,0.12)]">
              <Drawer.Handle />

              {/* Recipe Header Card */}
              <div className="flex items-center justify-between gap-3 pt-1 pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {recipeImage && (
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-2xs bg-gray-100 dark:bg-gray-800">
                      <CachedImage
                        src={recipeImage}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-2.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {totalTime > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{totalTime} min</span>
                        </span>
                      )}
                      {calories ? (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{calories} kcal</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-none flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <Drawer.Body className="overflow-y-auto py-1 flex flex-col gap-4">
                {/* Week & Day Picker Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t('mealPlanner.selectDate')}
                    </span>
                    {/* Mini Week Switcher */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                      <button
                        type="button"
                        onClick={handlePrevWeek}
                        aria-label="Vorherige Woche"
                        className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all border-none cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="select-none min-w-[90px] text-center font-bold text-[11px] text-gray-700 dark:text-gray-300">
                        {weekLabel}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextWeek}
                        aria-label="Nächste Woche"
                        className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all border-none cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Capsule Grid (matching WeekDayPicker) */}
                  <div className="grid grid-cols-7 gap-1 pt-0.5">
                    {weekDays.map((day) => {
                      const isSelected = day.dateStr === selectedDate;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            hapticSelection();
                            setSelectedDate(day.dateStr);
                          }}
                          aria-label={`${day.dayName}, ${day.dayNumber}`}
                          aria-selected={isSelected}
                          className={`group relative flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl transition-all duration-200 cursor-pointer border-none select-none active:scale-[0.93] ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02] z-10'
                              : 'bg-gray-100/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 shadow-2xs'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              isSelected
                                ? 'text-emerald-100'
                                : day.isToday
                                ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                                : 'text-gray-400 dark:text-gray-400'
                            }`}
                          >
                            {day.dayName}
                          </span>
                          <span
                            className={`text-sm sm:text-base font-black my-0.5 leading-none transition-colors ${
                              isSelected
                                ? 'text-white'
                                : day.isToday
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-800 dark:text-gray-100'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                          <div className="flex items-center justify-center h-2 mt-0.5">
                            {day.isToday ? (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-white' : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                }`}
                              />
                            ) : (
                              <span className="w-1.5 h-1.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0.5">
                    {t('mealPlanner.selectMealType')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_OPTIONS.map((opt) => {
                      const isActive = selectedMeal === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            hapticSelection();
                            setSelectedMeal(opt.type);
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border-none text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                              : 'bg-gray-100/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-750'
                          }`}
                        >
                          {opt.icon}
                          <span className="truncate">{t(opt.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Servings Stepper */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-850/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {t('mealPlanner.servings')}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {servings === 1 ? '1 Person' : `${servings} Personen`}
                    </span>
                  </div>

                  {/* Modern Unified Servings Capsule matching MealPlanCardActions */}
                  <div className="flex items-center bg-gray-100/90 dark:bg-gray-800/80 rounded-full h-8.5 px-0.5 shrink-0 select-none border-none">
                    <button
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setServings((s) => Math.max(1, s - 1));
                      }}
                      disabled={servings <= 1}
                      aria-label={t('mealPlanner.changeServings')}
                      className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 active:scale-90 transition-all cursor-pointer border-none"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    <div className="flex items-center gap-1 px-2 min-w-[24px] justify-center text-gray-800 dark:text-gray-100">
                      <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      <span className="text-xs font-black tabular-nums">{servings}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setServings((s) => s + 1);
                      }}
                      aria-label={t('mealPlanner.changeServings')}
                      className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer border-none"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </Drawer.Body>

              {/* Primary Action Button */}
              <div className="pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="w-4.5 h-4.5" />
                      <span>{t('mealPlanner.addToPlan')}</span>
                    </>
                  )}
                </button>
              </div>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
};

export default AddToMealPlanSheet;
