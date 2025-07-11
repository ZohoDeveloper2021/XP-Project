import React, { useState,useEffect } from "react";
import { format, addMinutes } from "date-fns";

const DateTimePicker = ({
  date,
  label,
  onDateChange,
  time,
  required = false,
  disabled = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const initialDate = date || new Date();
  
  const [tempDate, setTempDate] = useState(() => {
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      return newDate;
    }
    return new Date(initialDate);
  });

  const [currentMonth, setCurrentMonth] = useState(tempDate.getMonth());
  const [currentYear, setCurrentYear] = useState(tempDate.getFullYear());


  useEffect(() => {
  if (date && time) {
    const [hours, minutes] = time.split(":").map(Number);
    const newTemp = new Date(date);
    newTemp.setHours(hours, minutes);
    setTempDate(newTemp);
  }
}, [date, time]);


  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      const newDate = new Date(tempDate);
      newDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setTempDate(newDate);
    }
  };

  const handleTimeChange = (type, value) => {
    const newDate = new Date(tempDate);

    if (type === "hour") {
      const hour = parseInt(value, 10);
      const currentIsPM = newDate.getHours() >= 12;
      newDate.setHours(currentIsPM ? hour + 12 : hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      if (value === "AM" && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (value === "PM" && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    setTempDate(newDate);
  };

const handleSave = () => {
  const fullDateTime = new Date(tempDate); // includes selected date + time
  onDateChange && onDateChange(fullDateTime); // just one combined value
  setShowPicker(false);
};

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(year => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(year => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysFromPrevMonth = firstDayOfMonth;
    const daysFromNextMonth = 42 - (daysInMonth + daysFromPrevMonth); // 6 weeks
    
    const days = [];

    // Previous month days
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="p-1 text-center text-gray-400 text-sm">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const isSelected = tempDate.getDate() === day && 
                        tempDate.getMonth() === currentMonth && 
                        tempDate.getFullYear() === currentYear;
      const isToday = dayDate.toDateString() === new Date().toDateString();
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(dayDate)}
          className={`w-8 h-8 rounded-full text-sm flex items-center justify-center 
            ${isSelected ? "bg-blue-500 text-white" : 
              isToday ? "border border-blue-500" : "hover:bg-gray-100"}`}
          disabled={disabled}
        >
          {day}
        </button>
      );
    }

    // Next month days
    for (let day = 1; day <= daysFromNextMonth; day++) {
      days.push(
        <div key={`next-${day}`} className="p-1 text-center text-gray-400 text-sm">
          {day}
        </div>
      );
    }

    return days;
  };

  const displayValue = format(tempDate, "MM/dd/yyyy hh:mm aa");

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setCurrentMonth(tempDate.getMonth());
          setCurrentYear(tempDate.getFullYear());
          setShowPicker(true);
        }}
        className={`w-full border rounded px-3 py-2 text-left text-sm flex items-center justify-between
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
        disabled={disabled}
      >
        {displayValue}
        {!disabled && (
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {showPicker && !disabled && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-4 w-auto max-w-[90vw]">
            <div className="flex flex-col sm:flex-row">
              {/* Calendar Section */}
              <div className="p-2">
                <div className="text-center mb-2 flex justify-between items-center">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-sm font-semibold">
                    {format(new Date(currentYear, currentMonth), "MMMM yyyy")}
                  </div>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-1 text-xs text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="font-medium p-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays()}
                </div>
              </div>
              
              {/* Time Selection Section */}
              <div className="flex flex-col sm:flex-row sm:h-[260px] divide-y sm:divide-y-0 sm:divide-x border-t sm:border-t-0">
                {/* Hours */}
                <div className="overflow-y-auto max-h-[200px] sm:max-h-none">
                  <div className="flex flex-wrap sm:flex-col p-1">
                    {Array.from({ length: 12 }, (_, i) => i + 1)
                      .reverse()
                      .map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          className={`w-10 h-10 rounded-full flex items-center justify-center m-1 text-sm
                            ${tempDate.getHours() % 12 === hour % 12 ? 
                              "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                          onClick={() => handleTimeChange("hour", hour.toString())}
                        >
                          {hour}
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Minutes */}
                <div className="overflow-y-auto max-h-[200px] sm:max-h-none">
                  <div className="flex flex-wrap sm:flex-col p-1">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map(
                      (minute) => (
                        <button
                          key={minute}
                          type="button"
                          className={`w-10 h-10 rounded-full flex items-center justify-center m-1 text-sm
                            ${tempDate.getMinutes() === minute ? 
                              "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                          onClick={() => handleTimeChange("minute", minute.toString())}
                        >
                          {minute.toString().padStart(2, "0")}
                        </button>
                      )
                    )}
                  </div>
                </div>
                
                {/* AM/PM */}
                <div className="overflow-y-auto max-h-[200px] sm:max-h-none">
                  <div className="flex flex-wrap sm:flex-col p-1">
                    {["AM", "PM"].map((ampm) => (
                      <button
                        key={ampm}
                        type="button"
                        className={`w-10 h-10 rounded-full flex items-center justify-center m-1 text-sm
                          ${((ampm === "AM" && tempDate.getHours() < 12) ||
                            (ampm === "PM" && tempDate.getHours() >= 12)) ? 
                            "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                        onClick={() => handleTimeChange("ampm", ampm)}
                      >
                        {ampm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;