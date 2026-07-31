import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

export const DatePicker = ({ label, value, onChange, icon: Icon = CalendarIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'months' | 'years'
  const datePickerRef = useRef(null);

  // Default to 08 June 2005 if no value is provided
  const initialDate = value ? new Date(value) : new Date(2005, 5, 8);
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    const formatted = newDate.toISOString().split('T')[0];
    onChange(formatted);
    setIsOpen(false);
    setViewMode('days');
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate years from 1950 to current year
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="shadcn-input-group" ref={datePickerRef} style={{ position: 'relative' }}>
      {label && <label className="shadcn-label">{label}</label>}
      
      <div
        className="shadcn-input-wrapper"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <Icon className="shadcn-input-icon" size={18} />
        <input
          type="text"
          readOnly
          className="shadcn-input has-icon"
          placeholder="Select Date of Birth"
          value={
            selectedDate
              ? `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}/${selectedDate.getFullYear()}`
              : ''
          }
        />
      </div>

      {/* Custom Upper-Side Non-Overflowing Neo-Brutalist Popover */}
      {isOpen && (
        <div className="neo-datepicker-popover-upper">
          {/* Header Bar */}
          <div className="neo-dp-header">
            <button type="button" onClick={prevMonth} className="neo-dp-nav-btn" title="Previous Month">
              <ChevronLeft size={14} />
            </button>

            <div className="neo-dp-selects-container">
              {/* Click Month to Toggle Month Grid */}
              <button
                type="button"
                className={`neo-dp-mode-btn ${viewMode === 'months' ? 'active' : ''}`}
                onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                style={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <span>{months[month]}</span>
                <ChevronDown size={12} />
              </button>

              {/* Click Year to Toggle Year Grid */}
              <button
                type="button"
                className={`neo-dp-mode-btn ${viewMode === 'years' ? 'active' : ''}`}
                onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                style={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <span>{year}</span>
                <ChevronDown size={12} />
              </button>
            </div>

            <button type="button" onClick={nextMonth} className="neo-dp-nav-btn" title="Next Month">
              <ChevronRight size={14} />
            </button>

            <button type="button" onClick={() => setIsOpen(false)} className="neo-dp-close">
              <X size={14} />
            </button>
          </div>

          {/* VIEW 1: DAYS CALENDAR */}
          {viewMode === 'days' && (
            <>
              <div className="neo-dp-weekdays">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              <div className="neo-dp-days-grid">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <span key={`empty-${i}`} className="neo-dp-empty"></span>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`neo-dp-day-btn ${isSelected ? 'selected' : ''}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* VIEW 2: COMPACT MONTHS GRID */}
          {viewMode === 'months' && (
            <div className="neo-dp-compact-grid">
              {months.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  className={`neo-dp-grid-btn ${idx === month ? 'selected' : ''}`}
                  onClick={() => {
                    setViewDate(new Date(year, idx, 1));
                    setViewMode('days');
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* VIEW 3: COMPACT SCROLLABLE YEARS GRID (LOCKED 140PX HEIGHT) */}
          {viewMode === 'years' && (
            <div className="neo-dp-compact-years">
              {yearsList.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`neo-dp-grid-btn ${y === year ? 'selected' : ''}`}
                  onClick={() => {
                    setViewDate(new Date(y, month, 1));
                    setViewMode('days');
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
