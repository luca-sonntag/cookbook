import React from 'react';
import type { WeekDayPickerProps } from './types';
import { hapticSelection } from '../../utils/haptics';

export const WeekDayPicker: React.FC<WeekDayPickerProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <div className="w-full grid grid-cols-7 gap-1 pt-0.5 pb-0.5">
      {days.map((day) => {
        const isSelected = day.dateStr === selectedDate;

        return (
          <button
            key={day.dateStr}
            onClick={() => {
              hapticSelection();
              onSelectDate(day.dateStr);
            }}
            className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl relative transition-all duration-200 cursor-pointer border-none ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.04] z-10'
                : 'bg-white/80 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 shadow-sm shadow-black/[0.02]'
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
