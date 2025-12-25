import React, { useState, useEffect } from 'react';
import DataGrid from '../../components/DataGrid';
import DomesticETFInput from '../../components/DomesticETFInput';
import { ensureDomesticETFCache } from '../../components/DomesticETFSelector';

const API_BASE_URL = 'http://localhost:8000/api/v1/isa-accounts';
const SALE_API_BASE_URL = 'http://localhost:8000/api/v1/isa-account-sales';
const DIVIDEND_API_BASE_URL = 'http://localhost:8000/api/v1/isa-account-dividends';
const MASTER_API_BASE_URL = 'http://localhost:8000/api/v1/common-code-masters';
const COMMON_DETAIL_API_BASE_URL = 'http://localhost:8000/api/v1/common-code-details';

function ISAOptimization() {
  const [accounts, setAccounts] = useState([]);
  const [accountStatusMap, setAccountStatusMap] = useState({});
  const [nonTaxTypeMap, setNonTaxTypeMap] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedYearMonth, setSelectedYearMonth] = useState('');
  const [yearMonthOptions, setYearMonthOptions] = useState([]);
  const [sales, setSales] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 매도 그리드 상태
  const [saleEditingId, setSaleEditingId] = useState(null);
  const [saleNewRow, setSaleNewRow] = useState({
    stock_code: '',
    stock_name: '',
    sale_quantity: '',
    purchase_price: '',
    sale_price: '',
    transaction_fee: '',
  });
  // 배당 그리드 상태
  const [dividendEditingId, setDividendEditingId] = useState(null);
  const [dividendNewRow, setDividendNewRow] = useState({
    stock_code: '',
    stock_name: '',
    dividend_amount: '',
  });

  useEffect(() => {
    loadAccounts();
    loadAccountStatusMap();
    loadNonTaxTypeMap();
    // 국내ETF 캐시 초기화
    ensureDomesticETFCache().catch(err => console.error('국내ETF 캐시 초기화 실패:', err));
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount.registration_date) {
      generateYearMonthOptions(selectedAccount.registration_date);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccountId && selectedYearMonth) {
      loadSales();
      loadDividends();
    }
  }, [selectedAccountId, selectedYearMonth]);

  const generateYearMonthOptions = (registrationDate) => {
    const startDate = new Date(registrationDate);
    const endDate = new Date();
    const options = [];
    
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    while (currentDate <= end) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    setYearMonthOptions(options);
    if (options.length > 0 && !selectedYearMonth) {
      setSelectedYearMonth(options[options.length - 1]); // 가장 최근 연월 선택
    }
  };

  const loadAccountStatusMap = async () => {
    try {
      const masterResponse = await fetch(`${MASTER_API_BASE_URL}?skip=0&limit=100`);
      if (!masterResponse.ok) return;
      
      const masters = await masterResponse.json();
      const accountStatusMaster = masters.find(m => m.code === 'account_status');
      
      if (!accountStatusMaster) return;
      
      const detailResponse = await fetch(`${COMMON_DETAIL_API_BASE_URL}?master_id=${accountStatusMaster.id}`);
      if (detailResponse.ok) {
        const details = await detailResponse.json();
        const map = {};
        details.forEach(detail => {
          map[detail.detail_code] = detail.detail_code_name;
        });
        setAccountStatusMap(map);
      }
    } catch (err) {
      console.error('계좌상태 로드 실패:', err);
    }
  };

  const loadNonTaxTypeMap = async () => {
    try {
      const masterResponse = await fetch(`${MASTER_API_BASE_URL}?skip=0&limit=100`);
      if (!masterResponse.ok) return;
      
      const masters = await masterResponse.json();
      const nonTaxTypeMaster = masters.find(m => m.code === 'isa_non_tax_type');
      
      if (!nonTaxTypeMaster) return;
      
      const detailResponse = await fetch(`${COMMON_DETAIL_API_BASE_URL}?master_id=${nonTaxTypeMaster.id}`);
      if (detailResponse.ok) {
        const details = await detailResponse.json();
        const map = {};
        details.forEach(detail => {
          map[detail.detail_code] = detail.detail_code_name;
        });
        setNonTaxTypeMap(map);
      }
    } catch (err) {
      console.error('비과세유형 로드 실패:', err);
    }
  };

  const loadAccounts = async () => {
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
        setAccounts(data);
      } else {
        const errorText = await response.text();
        setError(`데이터를 불러오는데 실패했습니다. (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(`서버에 연결할 수 없습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const response = await fetch(`${SALE_API_BASE_URL}/account/${selectedAccountId}?year_month=${selectedYearMonth}`);
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (err) {
      console.error('매도 내역 로드 실패:', err);
    }
  };

  const loadDividends = async () => {
    try {
      const response = await fetch(`${DIVIDEND_API_BASE_URL}/account/${selectedAccountId}?year_month=${selectedYearMonth}`);
      if (response.ok) {
        const data = await response.json();
        setDividends(data);
      }
    } catch (err) {
      console.error('배당 내역 로드 실패:', err);
    }
  };

  const handleRowClick = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccountId(accountId);
      setSelectedAccount(account);
    }
  };

  const handleSaveSale = async (saleData) => {
    try {
      setLoading(true);
      setError(null);

      if (!saleData.stock_code) {
        setError('종목코드를 입력해주세요.');
        setLoading(false);
        return;
      }

      if (!saleData.stock_name || saleData.stock_name.trim() === '') {
        setError('유효한 종목코드를 입력하거나 팝업에서 선택해주세요.');
        setLoading(false);
        return;
      }

      const payload = {
        account_id: selectedAccountId,
        year_month: selectedYearMonth,
        stock_code: saleData.stock_code,
        sale_quantity: parseFloat(saleData.sale_quantity) || 0,
        purchase_price: parseFloat(saleData.purchase_price) || 0,
        sale_price: parseFloat(saleData.sale_price) || 0,
        transaction_fee: Math.floor(parseFloat(saleData.transaction_fee) || 0),
      };

      let response;
      if (saleData.id) {
        response = await fetch(`${SALE_API_BASE_URL}/${saleData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(SALE_API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await loadSales();
        setSaleEditingId(null);
        setSaleNewRow({
          stock_code: '',
          stock_name: '',
          sale_quantity: '',
          purchase_price: '',
          sale_price: '',
          transaction_fee: '',
        });
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

  const handleDeleteSale = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${SALE_API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        await loadSales();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDividend = async (dividendData) => {
    try {
      setLoading(true);
      setError(null);

      if (!dividendData.stock_code) {
        setError('종목코드를 입력해주세요.');
        setLoading(false);
        return;
      }

      if (!dividendData.stock_name || dividendData.stock_name.trim() === '') {
        setError('유효한 종목코드를 입력하거나 팝업에서 선택해주세요.');
        setLoading(false);
        return;
      }

      const payload = {
        account_id: selectedAccountId,
        year_month: selectedYearMonth,
        stock_code: dividendData.stock_code,
        dividend_amount: Math.floor(parseFloat(dividendData.dividend_amount) || 0),
      };

      let response;
      if (dividendData.id) {
        response = await fetch(`${DIVIDEND_API_BASE_URL}/${dividendData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(DIVIDEND_API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await loadDividends();
        setDividendEditingId(null);
        setDividendNewRow({
          stock_code: '',
          stock_name: '',
          dividend_amount: '',
        });
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

  const handleDeleteDividend = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${DIVIDEND_API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        await loadDividends();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitLoss = (saleQuantity, purchasePrice, salePrice, transactionFee) => {
    const profitLoss = (salePrice - purchasePrice) * saleQuantity - transactionFee;
    return Math.floor(profitLoss);
  };

  const calculateReturnRate = (purchasePrice, salePrice) => {
    if (purchasePrice > 0) {
      return ((salePrice - purchasePrice) / purchasePrice * 100).toFixed(2);
    }
    return '0.00';
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('ko-KR').format(Math.floor(num));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const calculateTotalRevenue = () => {
    // 매도 내역의 손익금액 합계
    const totalProfitLoss = sales.reduce((sum, sale) => {
      return sum + (parseFloat(sale.profit_loss) || 0);
    }, 0);

    // 배당 내역의 배당금 합계
    const totalDividend = dividends.reduce((sum, dividend) => {
      return sum + (parseFloat(dividend.dividend_amount) || 0);
    }, 0);

    return totalProfitLoss + totalDividend;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">ISA 수익 최적화</h1>
        <p className="text-wealth-muted">ISA 계좌 목록을 확인하고 매도/배당 내역을 관리하세요.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">ISA 목록</h2>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <DataGrid
            columns={[
              { key: 'financial_institution', label: '금융기관', align: 'left' },
              { key: 'account_number', label: '계좌번호', align: 'left' },
              { key: 'registration_date', label: '가입일자', align: 'left' },
              { key: 'cash_balance', label: '현금잔고', align: 'left' },
              { key: 'non_tax_type', label: '비과세유형', align: 'left' },
              { key: 'account_status', label: '계좌상태', align: 'left' },
            ]}
            data={accounts}
            editingId={null}
            selectedId={selectedAccountId}
            onRowClick={handleRowClick}
            onEdit={null}
            onDelete={null}
            onSave={null}
            onCancel={null}
            loading={loading}
            showRowNumber={true}
            showActions={false}
            renderViewRow={(row) => (
              <>
                <td className="py-3 px-4 text-white">{row.financial_institution_name || '-'}</td>
                <td className="py-3 px-4 text-white">{row.account_number}</td>
                <td className="py-3 px-4 text-white">{formatDate(row.registration_date)}</td>
                <td className="py-3 px-4 text-white text-right">{formatCurrency(row.cash_balance)}원</td>
                <td className="py-3 px-4 text-white">
                  {row.non_tax_type 
                    ? (nonTaxTypeMap[row.non_tax_type] || row.non_tax_type)
                    : '-'}
                </td>
                <td className="py-3 px-4 text-white">
                  {row.account_status_code 
                    ? (accountStatusMap[row.account_status_code] || row.account_status_code)
                    : '-'}
                </td>
              </>
            )}
            emptyMessage="등록된 계좌가 없습니다."
          />
        </div>

        {/* 연월 선택 및 매도/배당 그리드 */}
        {selectedAccountId && selectedAccount && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-white font-medium">연월 선택:</label>
              <select
                value={selectedYearMonth}
                onChange={(e) => setSelectedYearMonth(e.target.value)}
                className="px-4 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold"
              >
                {yearMonthOptions.map(ym => (
                  <option key={ym} value={ym}>{ym}</option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-white font-medium">해당 월수익:</span>
                <span className={`text-lg font-bold ${calculateTotalRevenue() >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {calculateTotalRevenue() >= 0 ? '+' : ''}{formatCurrency(calculateTotalRevenue())}원
                </span>
              </div>
            </div>

            {/* 매도 그리드 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">매도 내역</h3>
                <button
                  onClick={() => {
                    setSaleNewRow({
                      stock_code: '',
                      stock_name: '',
                      sale_quantity: '',
                      purchase_price: '',
                      sale_price: '',
                      transaction_fee: '',
                    });
                    setSaleEditingId('new');
                  }}
                  disabled={loading || saleEditingId === 'new'}
                  className="px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + 추가
                </button>
              </div>
              <div className="overflow-x-auto -mx-6 px-6">
                <DataGrid
                  columns={[
                    { key: 'stock_code', label: '종목코드', align: 'left' },
                    { key: 'stock_name', label: '종목명', align: 'left' },
                    { key: 'sale_quantity', label: '매도수량', align: 'right' },
                    { key: 'purchase_price', label: '매입단가', align: 'right' },
                    { key: 'sale_price', label: '매도단가', align: 'right' },
                    { key: 'transaction_fee', label: '거래비용', align: 'right' },
                    { key: 'profit_loss', label: '손익금액', align: 'right' },
                    { key: 'return_rate', label: '수익률', align: 'right' },
                  ]}
                  data={sales}
                  editingId={saleEditingId}
                  selectedId={null}
                  onRowClick={null}
                  onEdit={(id) => setSaleEditingId(id)}
                  onDelete={handleDeleteSale}
                  onSave={(row) => handleSaveSale(row || saleNewRow)}
                  onCancel={() => {
                    setSaleEditingId(null);
                    setSaleNewRow({
                      stock_code: '',
                      stock_name: '',
                      sale_quantity: '',
                      purchase_price: '',
                      sale_price: '',
                      transaction_fee: '',
                    });
                  }}
                  loading={loading}
                  showRowNumber={true}
                  showActions={true}
                  renderNewRow={() => (
                    <>
                      <td className="py-3 px-4">
                        <DomesticETFInput
                          value={{ stock_code: saleNewRow.stock_code, stock_name: saleNewRow.stock_name }}
                          onChange={(etfData) => {
                            setSaleNewRow({
                              ...saleNewRow,
                              ...etfData,
                            });
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">{saleNewRow.stock_name || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={saleNewRow.sale_quantity}
                          onChange={(e) => setSaleNewRow({ ...saleNewRow, sale_quantity: e.target.value })}
                          placeholder="매도수량"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={saleNewRow.purchase_price}
                          onChange={(e) => setSaleNewRow({ ...saleNewRow, purchase_price: e.target.value })}
                          placeholder="매입단가"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={saleNewRow.sale_price}
                          onChange={(e) => setSaleNewRow({ ...saleNewRow, sale_price: e.target.value })}
                          placeholder="매도단가"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={saleNewRow.transaction_fee}
                          onChange={(e) => setSaleNewRow({ ...saleNewRow, transaction_fee: e.target.value })}
                          placeholder="거래비용"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4 text-white text-right">
                        {saleNewRow.sale_quantity && saleNewRow.purchase_price && saleNewRow.sale_price && saleNewRow.transaction_fee
                          ? formatCurrency(calculateProfitLoss(
                              parseFloat(saleNewRow.sale_quantity) || 0,
                              parseFloat(saleNewRow.purchase_price) || 0,
                              parseFloat(saleNewRow.sale_price) || 0,
                              parseFloat(saleNewRow.transaction_fee) || 0
                            ))
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-white text-right">
                        {saleNewRow.purchase_price && saleNewRow.sale_price
                          ? `${calculateReturnRate(
                              parseFloat(saleNewRow.purchase_price) || 0,
                              parseFloat(saleNewRow.sale_price) || 0
                            )}%`
                          : '-'}
                      </td>
                    </>
                  )}
                  renderEditRow={(row) => {
                    const profitLoss = calculateProfitLoss(
                      parseFloat(row.sale_quantity) || 0,
                      parseFloat(row.purchase_price) || 0,
                      parseFloat(row.sale_price) || 0,
                      parseFloat(row.transaction_fee) || 0
                    );
                    const returnRate = calculateReturnRate(
                      parseFloat(row.purchase_price) || 0,
                      parseFloat(row.sale_price) || 0
                    );
                    return (
                      <>
                        <td className="py-3 px-4">
                          <div onClick={(e) => e.stopPropagation()}>
                            <DomesticETFInput
                              value={{ stock_code: row.stock_code, stock_name: row.stock_name }}
                              onChange={(etfData) => {
                                const updated = {
                                  ...row,
                                  ...etfData,
                                };
                                const updatedSales = sales.map(s => s.id === row.id ? updated : s);
                                setSales(updatedSales);
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white">{row.stock_name || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.01"
                            value={row.sale_quantity}
                            onChange={(e) => {
                              const updated = { ...row, sale_quantity: e.target.value };
                              const updatedSales = sales.map(s => s.id === row.id ? updated : s);
                              setSales(updatedSales);
                            }}
                            className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.01"
                            value={row.purchase_price}
                            onChange={(e) => {
                              const updated = { ...row, purchase_price: e.target.value };
                              const updatedSales = sales.map(s => s.id === row.id ? updated : s);
                              setSales(updatedSales);
                            }}
                            className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.01"
                            value={row.sale_price}
                            onChange={(e) => {
                              const updated = { ...row, sale_price: e.target.value };
                              const updatedSales = sales.map(s => s.id === row.id ? updated : s);
                              setSales(updatedSales);
                            }}
                            className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={row.transaction_fee}
                            onChange={(e) => {
                              const updated = { ...row, transaction_fee: e.target.value };
                              const updatedSales = sales.map(s => s.id === row.id ? updated : s);
                              setSales(updatedSales);
                            }}
                            className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </td>
                        <td className="py-3 px-4 text-white text-right">
                          {formatCurrency(profitLoss)}
                        </td>
                        <td className="py-3 px-4 text-white text-right">
                          {`${returnRate}%`}
                        </td>
                      </>
                    );
                  }}
                  renderViewRow={(row) => (
                    <>
                      <td className="py-3 px-4 text-white">{row.stock_code || '-'}</td>
                      <td className="py-3 px-4 text-white">{row.stock_name || '-'}</td>
                      <td className="py-3 px-4 text-white text-right">{parseFloat(row.sale_quantity).toLocaleString('ko-KR')}</td>
                      <td className="py-3 px-4 text-white text-right">{formatCurrency(row.purchase_price)}원</td>
                      <td className="py-3 px-4 text-white text-right">{formatCurrency(row.sale_price)}원</td>
                      <td className="py-3 px-4 text-white text-right">{formatCurrency(row.transaction_fee)}원</td>
                      <td className={`py-3 px-4 text-right font-semibold ${parseFloat(row.profit_loss) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {parseFloat(row.profit_loss) >= 0 ? '+' : ''}{formatCurrency(row.profit_loss)}원
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${parseFloat(row.return_rate) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {parseFloat(row.return_rate) >= 0 ? '+' : ''}{parseFloat(row.return_rate).toFixed(2)}%
                      </td>
                    </>
                  )}
                  emptyMessage="등록된 매도 내역이 없습니다."
                />
              </div>
            </div>

            {/* 배당 그리드 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">배당 내역</h3>
                <button
                  onClick={() => {
                    setDividendNewRow({
                      stock_code: '',
                      stock_name: '',
                      dividend_amount: '',
                    });
                    setDividendEditingId('new');
                  }}
                  disabled={loading || dividendEditingId === 'new'}
                  className="px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + 추가
                </button>
              </div>
              <div className="overflow-x-auto -mx-6 px-6">
                <DataGrid
                  columns={[
                    { key: 'stock_code', label: '종목코드', align: 'left' },
                    { key: 'stock_name', label: '종목명', align: 'left' },
                    { key: 'dividend_amount', label: '배당금', align: 'right' },
                  ]}
                  data={dividends}
                  editingId={dividendEditingId}
                  selectedId={null}
                  onRowClick={null}
                  onEdit={(id) => setDividendEditingId(id)}
                  onDelete={handleDeleteDividend}
                  onSave={(row) => handleSaveDividend(row || dividendNewRow)}
                  onCancel={() => {
                    setDividendEditingId(null);
                    setDividendNewRow({
                      stock_code: '',
                      stock_name: '',
                      dividend_amount: '',
                    });
                  }}
                  loading={loading}
                  showRowNumber={true}
                  showActions={true}
                  renderNewRow={() => (
                    <>
                      <td className="py-3 px-4">
                        <DomesticETFInput
                          value={{ stock_code: dividendNewRow.stock_code, stock_name: dividendNewRow.stock_name }}
                          onChange={(etfData) => {
                            setDividendNewRow({
                              ...dividendNewRow,
                              ...etfData,
                            });
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">{dividendNewRow.stock_name || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={dividendNewRow.dividend_amount}
                          onChange={(e) => setDividendNewRow({ ...dividendNewRow, dividend_amount: e.target.value })}
                          placeholder="배당금"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </td>
                    </>
                  )}
                  renderEditRow={(row) => (
                    <>
                      <td className="py-3 px-4">
                        <div onClick={(e) => e.stopPropagation()}>
                          <DomesticETFInput
                            value={{ stock_code: row.stock_code, stock_name: row.stock_name }}
                            onChange={(etfData) => {
                              const updated = {
                                ...row,
                                ...etfData,
                              };
                              const updatedDividends = dividends.map(d => d.id === row.id ? updated : d);
                              setDividends(updatedDividends);
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">{row.stock_name || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={row.dividend_amount}
                          onChange={(e) => {
                            const updated = { ...row, dividend_amount: e.target.value };
                            const updatedDividends = dividends.map(d => d.id === row.id ? updated : d);
                            setDividends(updatedDividends);
                          }}
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </td>
                    </>
                  )}
                  renderViewRow={(row) => (
                    <>
                      <td className="py-3 px-4 text-white">{row.stock_code || '-'}</td>
                      <td className="py-3 px-4 text-white">{row.stock_name || '-'}</td>
                      <td className="py-3 px-4 text-white text-right">{formatCurrency(row.dividend_amount)}원</td>
                    </>
                  )}
                  emptyMessage="등록된 배당 내역이 없습니다."
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default ISAOptimization;
