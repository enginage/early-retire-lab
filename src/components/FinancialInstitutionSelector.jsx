import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api/v1/financial-institutions';

function FinancialInstitutionSelector({ isOpen, onClose, onSelect }) {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInstitutions();
    }
  }, [isOpen]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      } else {
        setError('금융기관 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (institution) => {
    onSelect(institution);
    onClose();
  };

  const filteredInstitutions = institutions.filter(institution =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institution.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredInstitutions.length === 1) {
      e.preventDefault();
      handleSelect(filteredInstitutions[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-wealth-card rounded-xl border border-gray-800 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">금융기관 선택</h2>
          <button
            onClick={onClose}
            className="text-wealth-muted hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 */}
        <div className="p-4 border-b border-gray-800">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="금융기관명 또는 코드로 검색..."
            className="w-full px-4 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white placeholder:text-wealth-muted focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          />
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-wealth-muted">로딩 중...</div>
          ) : (
            <div className="space-y-2">
              {filteredInstitutions.length === 0 ? (
                <div className="text-center py-8 text-wealth-muted">
                  검색 결과가 없습니다.
                </div>
              ) : (
                filteredInstitutions.map((institution) => (
                  <button
                    key={institution.id}
                    onClick={() => handleSelect(institution)}
                    className="w-full text-left px-4 py-3 bg-wealth-card/50 hover:bg-wealth-card border border-gray-700 rounded-lg transition-colors"
                  >
                    <div className="font-semibold text-white">{institution.name}</div>
                    <div className="text-sm text-wealth-muted font-mono">{institution.code}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancialInstitutionSelector;


