import React, { useState } from 'react';
import DomesticETFSelector, { findDomesticETFByCode } from './DomesticETFSelector';

function DomesticETFInput({ value, onChange, placeholder = "종목코드 입력" }) {
  const [showSelector, setShowSelector] = useState(false);

  const handleCodeChange = (e) => {
    const code = e.target.value.toUpperCase().trim();
    const etf = findDomesticETFByCode(code);
    onChange({
      stock_code: code,
      stock_name: etf ? etf.name : '',
    });
  };

  const handleSelectClick = () => {
    setShowSelector(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <input
          type="text"
          value={value?.stock_code || ''}
          onChange={handleCodeChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold"
        />
        <button
          type="button"
          onClick={handleSelectClick}
          className="px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          title="ETF 선택"
        >
          선택
        </button>
      </div>
      <DomesticETFSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={(etf) => {
          onChange({
            stock_code: etf.ticker,
            stock_name: etf.name,
          });
          setShowSelector(false);
        }}
      />
    </>
  );
}

export default DomesticETFInput;

