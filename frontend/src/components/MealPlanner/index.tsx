import React from 'react';
import type { MealPlannerViewProps } from './types';
import { useMealPlanner } from './useMealPlanner';
import { MealPlannerHeader } from './MealPlannerHeader';
import { WeekDayPicker } from './WeekDayPicker';
import { DayMealSlots } from './DayMealSlots';
import { RecipePickerModal } from './RecipePickerModal';

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
    pickerSlot,
    setPickerSlot,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    addPlan,
    updateServings,
    toggleCooked,
    deletePlan,
    addWeekToShoppingList,
  } = useMealPlanner(history, addRecipeIngredients);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header with week navigation & shopping button */}
      <MealPlannerHeader
        weekStart={currentWeekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        plannedTotalCount={mealPlans.length}
        isAddingToShopping={isAddingToShopping}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onShopWeek={addWeekToShoppingList}
      />

      {/* 7-day strip selector */}
      <WeekDayPicker
        days={weekDays}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

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
        <DayMealSlots
          selectedDateStr={selectedDate}
          entries={activeDayEntries}
          onAddRecipeToSlot={(slotType) => setPickerSlot({ date: selectedDate, mealType: slotType })}
          onUpdateServings={updateServings}
          onToggleCooked={toggleCooked}
          onDeleteEntry={deletePlan}
          onSelectRecipe={onSelectRecipe}
          onOpenCookMode={onOpenCookMode}
        />
      )}

      {/* Recipe Picker Modal */}
      {pickerSlot && (
        <RecipePickerModal
          isOpen={!!pickerSlot}
          mealType={pickerSlot.mealType}
          dateStr={pickerSlot.date}
          history={history}
          onClose={() => setPickerSlot(null)}
          onSelectRecipe={(saved) => addPlan(saved, pickerSlot.date, pickerSlot.mealType)}
        />
      )}
    </div>
  );
};

export default MealPlannerView;
