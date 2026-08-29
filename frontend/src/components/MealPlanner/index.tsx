import React, { useCallback } from 'react';
import type { MealPlannerViewProps } from './types';
import { useMealPlanner } from './useMealPlanner';
import { MealPlannerHeader } from './MealPlannerHeader';
import { WeekNavigator } from './WeekNavigator';
import { WeekDayPicker } from './WeekDayPicker';
import { DailyInsightPill } from './DailyInsightPill';
import { DayMealSlots } from './DayMealSlots';
import { RecipePickerModal } from './RecipePickerModal';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  history,
  onSelectRecipe,
  onOpenCookMode,
  addRecipeIngredients,
}) => {
  const {
    currentWeekStart,
    weekEnd,
    isCurrentWeek,
    selectedDate,
    setSelectedDate,
    mealPlans,
    activeDayEntries,
    weekDays,
    isLoading,
    isAddingToShopping,
    isShopAdded,
    pickerSlot,
    setPickerSlot,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    addPlan,
    updateServings,
    toggleCooked,
    moveToTomorrow,
    deletePlan,
    addWeekToShoppingList,
  } = useMealPlanner(history, addRecipeIngredients);

  const goToNextDay = useCallback(() => {
    const days = weekDays;
    const idx = days.findIndex(d => d.dateStr === selectedDate);
    if (idx < days.length - 1) {
      setSelectedDate(days[idx + 1].dateStr);
    } else {
      goToNextWeek();
    }
  }, [weekDays, selectedDate, setSelectedDate, goToNextWeek]);

  const goToPrevDay = useCallback(() => {
    const days = weekDays;
    const idx = days.findIndex(d => d.dateStr === selectedDate);
    if (idx > 0) {
      setSelectedDate(days[idx - 1].dateStr);
    } else {
      goToPrevWeek();
    }
  }, [weekDays, selectedDate, setSelectedDate, goToPrevWeek]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: goToNextDay,
    onSwipeRight: goToPrevDay,
  });

  return (
    <div className="w-full flex flex-col gap-3 overflow-hidden">
      {/* Header with page title & shopping action */}
      <MealPlannerHeader
        plannedTotalCount={mealPlans.length}
        isAddingToShopping={isAddingToShopping}
        isShopAdded={isShopAdded}
        onShopWeek={addWeekToShoppingList}
      />

      {/* Unified Calendar Widget Card */}
      <div className="w-full flex flex-col gap-1.5 p-2 rounded-3xl bg-gray-100/75 dark:bg-gray-900/90 border-none shadow-2xs">
        <WeekNavigator
          weekStart={currentWeekStart}
          weekEnd={weekEnd}
          isCurrentWeek={isCurrentWeek}
          onPrevWeek={goToPrevWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
        />
        <WeekDayPicker
          days={weekDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {/* Daily Macro/Time Insight integrated into widget */}
        <DailyInsightPill entries={activeDayEntries} />
      </div>

      {/* Loading state skeleton vs Day Slots */}
      {isLoading && mealPlans.length === 0 ? (
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gray-200/60 dark:bg-gray-800/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div
          key={selectedDate}
          className="animate-fade-in"
          style={{ animationDuration: '200ms' }}
          {...swipeHandlers}
        >
          <DayMealSlots
            selectedDateStr={selectedDate}
            entries={activeDayEntries}
            onAddRecipeToSlot={(slotType) => setPickerSlot({ date: selectedDate, mealType: slotType })}
            onUpdateServings={updateServings}
            onToggleCooked={toggleCooked}
            onDeleteEntry={deletePlan}
            onMoveToTomorrow={moveToTomorrow}
            onSelectRecipe={onSelectRecipe}
            onOpenCookMode={onOpenCookMode}
          />
        </div>
      )}

      {/* Recipe Picker Modal */}
      <RecipePickerModal
        isOpen={!!pickerSlot}
        mealType={pickerSlot?.mealType ?? null}
        dateStr={pickerSlot?.date ?? selectedDate}
        history={history}
        onClose={() => setPickerSlot(null)}
        onSelectRecipe={(saved) => {
          if (pickerSlot) {
            addPlan(saved, pickerSlot.date, pickerSlot.mealType);
          }
        }}
      />
    </div>
  );
};

export default MealPlannerView;
