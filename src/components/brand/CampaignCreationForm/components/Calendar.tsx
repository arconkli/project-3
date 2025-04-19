import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarProps {
  type: 'start' | 'end';
  onSelect: (date: string) => void;
  startDate?: string;
  endDate?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Calendar: React.FC<CalendarProps> = ({ type, onSelect, startDate, endDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Generate calendar dates
  const generateCalendarDates = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return days;
  };

  const calendarDates = generateCalendarDates();

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For start date, disable dates before today
    if (type === 'start') {
      return date < today;
    }

    // For end date, disable dates before start date + 30 days
    if (startDate) {
      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 30);
      return date < minEndDate;
    }

    return false;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (date && !isDateDisabled(date)) {
      const dateStr = date.toISOString().split('T')[0];
      onSelect(dateStr);
    }
  };

  return (
    <motion.div 
      className="bg-black/90 border border-gray-700 rounded-lg p-4 shadow-lg w-full max-w-xs"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          disabled={type === 'start' && currentMonth === new Date().getMonth()}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="font-bold text-white">
          {MONTHS[currentMonth]} {currentYear}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 select-none">
        {calendarDates.map((date, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(date)}
            className={`
              h-8 w-8 flex items-center justify-center rounded-full text-sm transition-colors
              ${date ? 'hover:bg-gray-700 hover:text-white' : ''}
              ${date && isDateDisabled(date) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'}
              ${date && !isDateDisabled(date) ? 'hover:bg-red-600 hover:text-white' : ''}
              ${
                date && type === 'start' && date.toISOString().split('T')[0] === startDate
                  ? 'bg-red-600 text-white'
                  : ''
              }
              ${
                date && type === 'end' && date.toISOString().split('T')[0] === endDate
                  ? 'bg-red-600 text-white'
                  : ''
              }
            `}
            disabled={date ? isDateDisabled(date) : true}
          >
            {date ? date.getDate() : ''}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default Calendar;