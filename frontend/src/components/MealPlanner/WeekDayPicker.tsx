import React from 'react';
import type { WeekDayPickerProps } from './types';
import { hapticSelection } from '../../utils/haptics';

export const WeekDayPicker: React.FC<WeekDayPickerProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <div className="w-full grid grid-cols-7 gap-1.5 pt-1 pb-2">
      {days.map((day) => {
        const isSelected = day.dateStr === selectedDate;

        return (
          <button
            key={day.dateStr}
            onClick={() => {
              hapticSelection();
              onSelectDate(day.dateStr);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl relative transition-all duration-200 ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.08] z-10'
                : 'bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            {/* Day of week initial (Mo, Di, ...) */}
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                isSelected ? 'text-emerald-100' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {day.dayName}
            </span>

            {/* Day of month number */}
            <span
              className={`text-sm sm:text-base font-bold my-0.5 ${
                isSelected
                  ? 'text-white'
                  : day.isToday
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {day.dayNumber}
            </span>

            {/* Indicator dots: Today vs Planned count */}
            <div className="flex items-center gap-1 h-3 mt-0.5">
              {day.plannedCount > 0 && (
                <span
                  className={`flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full text-[9px] font-bold leading-none ${
                    isSelected
                      ? 'bg-white text-emerald-700'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {day.plannedCount}
                </span>
              )}
              {day.isToday && day.plannedCount === 0 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-emerald-500'
                  }`}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
