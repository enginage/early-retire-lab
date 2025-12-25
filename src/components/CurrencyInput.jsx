import React from 'react';

/**
 * 재사용 가능한 금액 입력 컴포넌트
 * - 천단위 쉼표 자동 표시
 * - placeholder는 왼쪽 정렬, 입력값은 오른쪽 정렬
 * - suffix(원, % 등)와 겹치지 않도록 padding 조정
 */
const CurrencyInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  suffix = '원',
  disabled = false,
  readOnly = false,
  className = '',
  showHelperText = false,
  helperText = '',
  required = false,
}) => {
  const formatCurrency = (val) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('ko-KR').format(Math.floor(num));
  };

  const handleChange = (e) => {
    // 쉼표 제거 후 숫자만 추출
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onChange({
      target: {
        name,
        value: numericValue,
      },
    });
  };

  const displayValue = value ? formatCurrency(value) : '';

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-wealth-muted mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`w-full px-4 py-3 bg-wealth-card border border-gray-700 rounded-lg text-white text-lg text-right placeholder:text-left focus:outline-none focus:ring-2 focus:ring-wealth-gold autofill:bg-wealth-card autofill:text-white ${
            readOnly ? 'bg-gray-800/50 cursor-not-allowed' : ''
          } ${required && !value ? 'border-red-500' : ''} ${suffix ? 'pr-12' : 'pr-4'} ${className}`}
          style={{
            WebkitBoxShadow: '0 0 0 1000px rgb(30, 41, 59) inset',
            WebkitTextFillColor: 'white',
          }}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-wealth-muted pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {showHelperText && helperText && (
        <p className="mt-2 text-sm text-wealth-muted text-right">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default CurrencyInput;

