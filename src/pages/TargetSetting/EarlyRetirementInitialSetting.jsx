import React, { useState, useEffect } from 'react';
import CurrencyInput from '../../components/CurrencyInput';
import RatioInput from '../../components/RatioInput';
import Simulation from './Simulation';

import { getApiUrl, API_ENDPOINTS } from '../../utils/api';

const API_BASE_URL = getApiUrl(API_ENDPOINTS.EARLY_RETIREMENT_INITIAL_SETTING);
const EXPENSE_API_BASE_URL = getApiUrl(API_ENDPOINTS.EXPENSES);

const DIVIDEND_OPTIONS = [
  { value: 'medium', label: '중배당', rate: 5 },
  { value: 'high', label: '고배당', rate: 10 },
  { value: 'ultra_high', label: '초고배당', rate: 20 },
];

function EarlyRetirementInitialSetting() {
  const [formData, setFormData] = useState({
    investable_assets: '',
    standby_fund_ratio: '',
    standby_fund: '',
    dividend_option: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [totalExpensesMonthly, setTotalExpensesMonthly] = useState(0);
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  useEffect(() => {
    loadData();
    loadExpenses();
  }, []);

  useEffect(() => {
    // 대기자금 자동 계산
    if (formData.investable_assets && formData.standby_fund_ratio) {
      const investableAssets = parseFloat(formData.investable_assets) || 0;
      const standbyFundRatio = parseFloat(formData.standby_fund_ratio) || 0;
      const standbyFund = Math.floor((investableAssets * standbyFundRatio) / 100);
      setFormData(prev => ({
        ...prev,
        standby_fund: standbyFund.toString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        standby_fund: '',
      }));
    }
  }, [formData.investable_assets, formData.standby_fund_ratio]);

  // 배당 옵션 선택
  const selectedDividendOption = DIVIDEND_OPTIONS.find(opt => opt.value === formData.dividend_option);

  // 투입가능자산 계산 (투자가능자산 - 대기자금)
  const investableAssetsForInvestment = React.useMemo(() => {
    const investableAssets = parseFloat(formData.investable_assets) || 0;
    const standbyFund = parseFloat(formData.standby_fund) || 0;
    return Math.max(0, investableAssets - standbyFund);
  }, [formData.investable_assets, formData.standby_fund]);

  // 배당 수익 계산 (투입가능자산 × 배당율)
  const dividendIncome = React.useMemo(() => {
    if (!selectedDividendOption) return 0;
    return Math.floor((investableAssetsForInvestment * selectedDividendOption.rate) / 100);
  }, [investableAssetsForInvestment, selectedDividendOption]);

  // 지출총액(년)
  const totalExpensesYearly = totalExpensesMonthly * 12;

  // 부족 금액 계산 (지출총액(년) - 배당 수익)
  const shortfall = React.useMemo(() => {
    return totalExpensesYearly - dividendIncome;
  }, [totalExpensesYearly, dividendIncome]);

  // 추가로 필요한 투입자산 계산 (부족금액 / 배당옵션 비율)
  const additionalRequiredAssets = React.useMemo(() => {
    if (shortfall > 0 && selectedDividendOption) {
      const dividendRate = selectedDividendOption.rate / 100; // 5% -> 0.05
      return Math.ceil(shortfall / dividendRate); // 올림 처리
    }
    return 0;
  }, [shortfall, selectedDividendOption]);

  const loadData = async () => {
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
        setFormData({
          investable_assets: data.investable_assets?.toString() || '',
          standby_fund_ratio: data.standby_fund_ratio?.toString() || '',
          standby_fund: data.standby_fund?.toString() || '',
          dividend_option: data.dividend_option || 'medium',
          additional_required_assets: data.additional_required_assets?.toString() || '',
        });
      } else if (response.status === 404) {
        // 데이터가 없으면 빈 폼 유지
        setFormData({
          investable_assets: '',
          standby_fund_ratio: '',
          standby_fund: '',
          dividend_option: 'medium',
        });
      } else {
        const errorText = await response.text();
        setError(`데이터를 불러오는데 실패했습니다. (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      // 네트워크 오류는 무시하고 빈 폼 유지
      setFormData({
        investable_assets: '',
        standby_fund_ratio: '',
        standby_fund: '',
        dividend_option: 'medium',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await fetch(EXPENSE_API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const total = data.reduce((sum, expense) => sum + Math.floor(parseFloat(expense.amount || 0)), 0);
        setTotalExpensesMonthly(total);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const investableAssets = Math.floor(parseFloat(formData.investable_assets) || 0);
      const standbyFundRatio = parseFloat(formData.standby_fund_ratio) || 0;
      const standbyFund = Math.floor((investableAssets * standbyFundRatio) / 100);

      if (!investableAssets || investableAssets <= 0) {
        setError('투자가능자산을 입력해주세요.');
        setLoading(false);
        return;
      }

      if (!standbyFundRatio || standbyFundRatio < 0 || standbyFundRatio > 100) {
        setError('대기자금 비율을 0-100 사이의 값으로 입력해주세요.');
        setLoading(false);
        return;
      }

      // 추가로 필요한 투입자산 계산 (부족금액이 있을 때만)
      const additionalRequiredAssetsValue = shortfall > 0 && selectedDividendOption
        ? Math.ceil(shortfall / (selectedDividendOption.rate / 100))
        : null;

      const payload = {
        investable_assets: investableAssets,
        standby_fund_ratio: standbyFundRatio,
        standby_fund: standbyFund,
        dividend_option: formData.dividend_option,
        additional_required_assets: additionalRequiredAssetsValue,
      };

      // 먼저 GET으로 데이터 존재 여부 확인
      const checkResponse = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let response;
      if (checkResponse.ok) {
        // 데이터가 있으면 PUT (업데이트)
        response = await fetch(API_BASE_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // 데이터가 없으면 POST (생성)
        response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setSuccess(true);
        await loadData();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '저장에 실패했습니다.');
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('ko-KR').format(Math.floor(num));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">조기은퇴 필요자산</h1>
        <p className="text-wealth-muted">투자 가능한 자산과 대기자금 비율을 설정하여 조기은퇴 계획의 기초를 마련하세요.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400">
          저장되었습니다.
        </div>
      )}

      <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl p-6">
        <div className="space-y-6">
          {/* 지출 총액 정보 */}
          <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-wealth-muted mb-1">지출총액(월)</div>
                <div className="text-xl font-bold text-red-400">
                  {formatCurrency(totalExpensesMonthly)}원
                </div>
              </div>
              <div>
                <div className="text-sm text-wealth-muted mb-1">지출총액(년)</div>
                <div className="text-xl font-bold text-red-400">
                  {formatCurrency(totalExpensesMonthly * 12)}원
                </div>
              </div>
            </div>
          </div>

          {/* 투자가능자산, 대기자금 비율, 대기자금, 투입가능자산 - 한 줄 배치 */}
          <div className="grid grid-cols-4 gap-4">
            {/* 투자가능자산 */}
            <CurrencyInput
              label="투자가능자산"
              name="investable_assets"
              value={formData.investable_assets}
              onChange={handleChange}
              placeholder="투자가능자산을 입력하세요"
              suffix="원"
              disabled={loading}
              showHelperText={true}
            />

            {/* 대기자금(여유자금) 비율 */}
            <RatioInput
              label="대기자금(여유자금) 비율"
              name="standby_fund_ratio"
              value={formData.standby_fund_ratio}
              onChange={handleChange}
              placeholder="대기자금(여유자금) 비율을 입력하세요 (0-100)"
              suffix="%"
              min={0}
              max={100}
              step={1}
              disabled={loading}
            />

            {/* 대기자금(여유자금) (자동계산) */}
            <CurrencyInput
              label={
                <>
                  대기자금(여유자금) <span className="text-xs text-wealth-muted">(자동계산)</span>
                </>
              }
              name="standby_fund"
              value={formData.standby_fund}
              onChange={() => {}}
              readOnly={true}
              suffix="원"
              disabled={true}
              showHelperText={!!formData.standby_fund}
              helperText={formData.standby_fund ? `투자가능자산 × 대기자금(여유자금) 비율 = ${formatCurrency(formData.standby_fund)}원` : ''}
            />

            {/* 투입가능자산 (자동계산) */}
            <CurrencyInput
              label={
                <>
                  투입가능자산 <span className="text-xs text-wealth-muted">(자동계산)</span>
                </>
              }
              name="investable_assets_for_investment"
              value={investableAssetsForInvestment.toString()}
              onChange={() => {}}
              readOnly={true}
              suffix="원"
              disabled={true}
              showHelperText={investableAssetsForInvestment > 0}
              helperText={investableAssetsForInvestment > 0 ? `투자가능자산 - 대기자금(여유자금) = ${formatCurrency(investableAssetsForInvestment)}원` : ''}
            />
          </div>

          {/* 배당옵션(세후) */}
          <div>
            <label className="block text-sm font-medium text-wealth-muted mb-2">
              배당옵션(세후)
            </label>
            <div className="grid grid-cols-3 gap-4">
              {DIVIDEND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'dividend_option', value: option.value } })}
                  disabled={loading}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.dividend_option === option.value
                      ? 'border-wealth-gold bg-wealth-gold/20 text-wealth-gold'
                      : 'border-gray-700 bg-wealth-card text-white hover:border-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-wealth-muted">{option.rate}%</div>
                </button>
              ))}
            </div>
            {selectedDividendOption && (
              <div className="mt-2">
                <p className="text-sm text-wealth-muted">
                  선택된 옵션: {selectedDividendOption.label} ({selectedDividendOption.rate}%)
                </p>
                {formData.dividend_option === 'high' && (
                  <p className="mt-1 text-sm text-wealth-muted">
                    주기적인 리밸런싱 필요
                  </p>
                )}
                {formData.dividend_option === 'ultra_high' && (
                  <p className="mt-1 text-sm text-wealth-muted">
                    주기적인 리밸런싱과 공격적인 투자 필요
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 배당 수익 및 부족 금액 정보 - 한 줄 배치 */}
          {investableAssetsForInvestment > 0 && selectedDividendOption && (
            <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
              <div className="grid grid-cols-4 gap-4">
                {/* 예상 배당 수익 */}
                <div>
                  <div className="text-sm text-wealth-muted mb-1">
                    예상 배당 수익 (연간)
                  </div>
                  <div className="text-xl font-bold text-wealth-gold">
                    {formatCurrency(dividendIncome)}원
                  </div>
                  <p className="mt-1 text-xs text-wealth-muted">
                    투입가능자산 × {selectedDividendOption.rate}%
                  </p>
                </div>

                {/* 지출총액(년) */}
                <div>
                  <div className="text-sm text-wealth-muted mb-1">
                    지출총액(년)
                  </div>
                  <div className="text-xl font-semibold text-red-400">
                    {formatCurrency(totalExpensesYearly)}원
                  </div>
                </div>

                {/* 부족 금액 또는 여유 금액 또는 정확히 일치 */}
                {shortfall > 0 ? (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <div className="text-sm text-red-400 mb-1">
                      부족 금액
                    </div>
                    <div className="text-lg font-bold text-red-400">
                      {formatCurrency(shortfall)}원
                    </div>
                  </div>
                ) : shortfall < 0 ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                    <div className="text-sm text-green-400 mb-1">
                      여유 금액
                    </div>
                    <div className="text-lg font-bold text-green-400">
                      {formatCurrency(Math.abs(shortfall))}원
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
                    <div className="text-sm text-blue-400 mb-1">
                      정확히 일치
                    </div>
                    <div className="text-lg font-bold text-blue-400">
                      0원
                    </div>
                  </div>
                )}

                {/* 추가로 필요한 투입자산 (부족금액이 있을 때만 표시) */}
                {shortfall > 0 && additionalRequiredAssets > 0 ? (
                  <button
                    onClick={() => setShowSimulationModal(true)}
                    className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 text-left hover:bg-orange-500/30 hover:border-orange-500/70 transition-all cursor-pointer w-full"
                  >
                    <div className="text-sm text-orange-400 mb-1">
                      추가로 필요한 투입자산
                    </div>
                    <div className="text-lg font-bold text-orange-400">
                      {formatCurrency(additionalRequiredAssets)}원
                    </div>
                    <p className="mt-1 text-xs text-orange-400/80">
                      부족금액 ÷ {selectedDividendOption.rate}%
                    </p>
                    <p className="mt-2 text-xs text-orange-400/60 italic">
                      클릭하여 시뮬레이션 보기
                    </p>
                  </button>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={loading || !formData.investable_assets || !formData.standby_fund_ratio}
              className="w-full px-6 py-3 bg-gradient-to-r from-wealth-gold to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 시뮬레이션 모달 */}
      {showSimulationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSimulationModal(false)}
        >
          <div 
            className="bg-wealth-card rounded-xl border border-gray-800 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">시뮬레이션</h2>
              <button
                onClick={() => setShowSimulationModal(false)}
                className="text-wealth-muted hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 모달 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              <Simulation 
                initialBalance={investableAssetsForInvestment}
                targetClosingBalance={investableAssetsForInvestment + additionalRequiredAssets}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EarlyRetirementInitialSetting;

