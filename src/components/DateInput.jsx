import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * 재사용 가능한 날짜 입력 컴포넌트
 * - 한국 형식 (YYYY-MM-DD) 강제
 * - 일관된 스타일링
 * - 테이블 내에서도 사용 가능 (label 없이)
 */
const DateInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  className = '',
  required = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  const calendarRef = useRef(null);

  // 날짜 형식 검증 및 포맷팅 (YYYY-MM-DD)
  const formatDateValue = (dateValue) => {
    if (!dateValue) return '';
    
    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Date 객체인 경우
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // 다른 형식의 문자열인 경우 (예: "2022/11/09")
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  // value가 변경될 때 displayValue 업데이트 (포커스가 없을 때만)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDateValue(value));
    }
  }, [value, isFocused]);

  // 외부 클릭 감지 및 스크롤 시 위치 업데이트
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
    };

    const handleScroll = () => {
      if (showCalendar) {
        updateCalendarPosition();
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updateCalendarPosition);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updateCalendarPosition);
      };
    }
  }, [showCalendar]);

  const handleTextChange = (e) => {
    let inputValue = e.target.value;
    
    // 숫자와 하이픈만 허용
    inputValue = inputValue.replace(/[^0-9-]/g, '');
    
    // 최대 길이 제한 (YYYY-MM-DD = 10자)
    if (inputValue.length > 10) {
      inputValue = inputValue.substring(0, 10);
    }
    
    // 입력 중에는 값을 그대로 유지 (하이픈 자동 삽입만)
    let formatted = inputValue;
    
    // 숫자만 입력된 경우 하이픈 자동 삽입
    const numbersOnly = inputValue.replace(/-/g, '');
    
    if (numbersOnly.length > 0) {
      if (numbersOnly.length <= 4) {
        // YYYY
        formatted = numbersOnly;
      } else if (numbersOnly.length <= 6) {
        // YYYY-MM
        formatted = numbersOnly.substring(0, 4) + '-' + numbersOnly.substring(4);
      } else {
        // YYYY-MM-DD
        formatted = numbersOnly.substring(0, 4) + '-' + numbersOnly.substring(4, 6) + '-' + numbersOnly.substring(6, 8);
      }
    }
    
    // 입력 중에는 값을 그대로 표시 (사라지지 않도록)
    setDisplayValue(formatted);
  };

  const handleTextBlur = (e) => {
    let formatted = displayValue.trim();
    
    // 빈 값이면 그대로 처리
    if (!formatted) {
      setDisplayValue('');
      onChange({
        target: {
          name,
          value: '',
        },
      });
      return;
    }
    
    // YYYY-MM-DD 형식으로 포맷팅
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      // 형식이 맞지 않으면 포맷팅 시도
      const numbersOnly = formatted.replace(/[^0-9]/g, '');
      if (numbersOnly.length >= 8) {
        formatted = `${numbersOnly.substring(0, 4)}-${numbersOnly.substring(4, 6)}-${numbersOnly.substring(6, 8)}`;
      } else {
        // 형식이 완전하지 않으면 빈 값으로 처리
        setDisplayValue('');
        onChange({
          target: {
            name,
            value: '',
          },
        });
        return;
      }
    }
    
    // 유효한 날짜인지 확인
    const date = new Date(formatted);
    if (!isNaN(date.getTime())) {
      // 날짜가 유효하면 포맷팅된 값으로 설정
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formatted = `${year}-${month}-${day}`;
      
      setDisplayValue(formatted);
      onChange({
        target: {
          name,
          value: formatted,
        },
      });
    } else {
      // 유효하지 않은 날짜면 빈 값으로 처리
      setDisplayValue('');
      onChange({
        target: {
          name,
          value: '',
        },
      });
    }
  };

  const handleCalendarChange = (e) => {
    const dateValue = e.target.value;
    const formatted = formatDateValue(dateValue);
    setDisplayValue(formatted);
    setShowCalendar(false);
    
    onChange({
      target: {
        name,
        value: formatted,
      },
    });
  };

  const updateCalendarPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (!disabled && !readOnly) {
      updateCalendarPosition();
      setShowCalendar(true);
    }
  };
  
  const handleCalendarToggle = () => {
    if (!showCalendar) {
      updateCalendarPosition();
    }
    setShowCalendar(!showCalendar);
  };
  
  const handleInputBlur = (e) => {
    setIsFocused(false);
    // 탭키로 포커스가 이동할 때 캘린더 닫기
    // 약간의 지연을 두어 탭키 이벤트가 완전히 처리된 후 닫기
    setTimeout(() => {
      setShowCalendar(false);
    }, 100);
    handleTextBlur(e);
  };

  const handleKeyDown = (e) => {
    // Tab 키를 눌렀을 때 캘린더 닫기
    if (e.key === 'Tab') {
      setShowCalendar(false);
    }
    // Escape 키를 눌렀을 때도 캘린더 닫기
    if (e.key === 'Escape') {
      setShowCalendar(false);
      inputRef.current?.blur();
    }
  };

  const generateCalendarDays = () => {
    const currentDate = displayValue ? new Date(displayValue) : new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }
    
    // 현재 달의 날들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i),
      });
    }
    
    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length; // 6주 * 7일
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i),
      });
    }
    
    return days;
  };

  const handleDayClick = (day) => {
    const formatted = formatDateValue(day.fullDate);
    setDisplayValue(formatted);
    setShowCalendar(false);
    
    onChange({
      target: {
        name,
        value: formatted,
      },
    });
  };

  const calendarDays = generateCalendarDays();
  const currentDate = displayValue ? new Date(displayValue) : new Date();
  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();

  const inputElement = (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'YYYY-MM-DD'}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={10}
        pattern="\d{4}-\d{2}-\d{2}"
        className={`w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white placeholder:text-wealth-muted focus:outline-none focus:ring-2 focus:ring-wealth-gold transition-colors ${
          readOnly ? 'bg-gray-800/50 cursor-not-allowed' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      />
      
      {/* 캘린더 아이콘 */}
      {!disabled && !readOnly && (
        <button
          type="button"
          onClick={handleCalendarToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-wealth-muted hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  );

  // 캘린더 팝업 (Portal로 렌더링)
  const calendarPopup = showCalendar && !disabled && !readOnly ? (
    createPortal(
      <div
        ref={calendarRef}
        className="fixed bg-wealth-card border border-gray-700 rounded-lg shadow-xl p-4 w-64 z-[9999]"
        style={{
          top: `${calendarPosition.top}px`,
          left: `${calendarPosition.left}px`,
        }}
      >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(calendarYear, calendarMonth - 1, 1);
                setDisplayValue(formatDateValue(newDate));
              }}
              className="text-wealth-muted hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-white font-semibold">
              {calendarYear}년 {calendarMonth + 1}월
            </div>
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(calendarYear, calendarMonth + 1, 1);
                setDisplayValue(formatDateValue(newDate));
              }}
              className="text-wealth-muted hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center text-sm text-wealth-muted font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isToday = day.fullDate.toDateString() === new Date().toDateString();
              const isSelected = displayValue && formatDateValue(day.fullDate) === displayValue;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`p-2 text-sm rounded transition-colors ${
                    !day.isCurrentMonth
                      ? 'text-gray-600'
                      : isSelected
                      ? 'bg-wealth-gold text-white font-semibold'
                      : isToday
                      ? 'bg-wealth-gold/20 text-wealth-gold font-semibold'
                      : 'text-white hover:bg-gray-700'
                  }`}
                >
                  {day.date}
                </button>
              );
            })}
          </div>
          
        {/* 숨겨진 date input (브라우저 네이티브 캘린더 사용) */}
        <input
          type="date"
          value={displayValue}
          onChange={handleCalendarChange}
          className="absolute opacity-0 pointer-events-none"
          style={{ position: 'absolute', left: '-9999px' }}
        />
      </div>,
      document.body
    )
  ) : null;

  // label이 없으면 input과 캘린더만 반환 (테이블 내 사용 시)
  if (!label) {
    return (
      <>
        {inputElement}
        {calendarPopup}
      </>
    );
  }

  // label이 있으면 label과 함께 반환
  return (
    <div>
      <label className="block text-sm font-medium text-wealth-muted mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {inputElement}
      {calendarPopup}
    </div>
  );
};

export default DateInput;

