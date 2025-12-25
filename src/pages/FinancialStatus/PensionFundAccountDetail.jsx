import React, { useState, useEffect } from 'react';
import CurrencyInput from '../../components/CurrencyInput';
import RatioInput from '../../components/RatioInput';
import DomesticETFSelector from '../../components/DomesticETFSelector';
import DataGrid from '../../components/DataGrid';

import { getApiUrl, API_ENDPOINTS } from '../../utils/api';

const DETAIL_API_BASE_URL = getApiUrl(API_ENDPOINTS.PENSION_FUND_ACCOUNT_DETAILS);

function PensionFundAccountDetail({ accountId }) {
  const [details, setDetails] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState({
    stock_code: '',
    stock_name: '',
    quantity: '',
    purchase_avg_price: '',
    current_price: '',
    purchase_fee: '',
    sale_fee: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showETFSelector, setShowETFSelector] = useState(false);
  const [selectingETFFor, setSelectingETFFor] = useState(null); // 'new' or detail id

  useEffect(() => {
    if (accountId) {
      loadDetails();
    }
  }, [accountId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${DETAIL_API_BASE_URL}/account/${accountId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
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

  const handleAdd = () => {
    setNewRow({
      stock_code: '',
      stock_name: '',
      quantity: '',
      purchase_avg_price: '',
      current_price: '',
      purchase_fee: '',
      sale_fee: '',
    });
    setEditingId('new');
  };

  const handleSave = async (detailData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        account_id: accountId,
        stock_code: detailData.stock_code,
        quantity: parseFloat(detailData.quantity) || 0,
        purchase_avg_price: parseFloat(detailData.purchase_avg_price) || 0,
        current_price: parseFloat(detailData.current_price) || 0,
        purchase_fee: Math.floor(parseFloat(detailData.purchase_fee) || 0),
        sale_fee: Math.floor(parseFloat(detailData.sale_fee) || 0),
      };

      let response;
      if (detailData.id) {
        // 업데이트
        response = await fetch(`${DETAIL_API_BASE_URL}/${detailData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // 생성
        response = await fetch(DETAIL_API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await loadDetails();
        setEditingId(null);
        setNewRow({
          stock_code: '',
          stock_name: '',
          quantity: '',
          purchase_avg_price: '',
          current_price: '',
          purchase_fee: '',
          sale_fee: '',
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

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${DETAIL_API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        await loadDetails();
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

  // 계산 함수들
  const calculatePurchaseAmount = (quantity, purchaseAvgPrice, purchaseFee) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(purchaseAvgPrice) || 0;
    const fee = parseFloat(purchaseFee) || 0;
    return qty * price + fee;
  };

  const calculateValuationAmount = (quantity, currentPrice) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(currentPrice) || 0;
    return qty * price;
  };

  const calculateProfitLoss = (detail) => {
    const purchaseAmount = calculatePurchaseAmount(
      detail.quantity,
      detail.purchase_avg_price,
      detail.purchase_fee
    );
    const valuationAmount = calculateValuationAmount(detail.quantity, detail.current_price);
    const saleFee = parseFloat(detail.sale_fee) || 0;
    return valuationAmount - purchaseAmount - saleFee;
  };

  const calculateReturnRate = (detail) => {
    const purchaseAmount = calculatePurchaseAmount(
      detail.quantity,
      detail.purchase_avg_price,
      detail.purchase_fee
    );
    const profitLoss = calculateProfitLoss(detail);
    if (purchaseAmount === 0) return 0;
    return (profitLoss / purchaseAmount) * 100;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('ko-KR').format(Math.floor(num));
  };

  const formatDecimal = (value, decimals = 2) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // 전체 합계 계산
  const calculateTotalPurchaseAmount = () => {
    return details.reduce((total, detail) => {
      return total + calculatePurchaseAmount(
        detail.quantity,
        detail.purchase_avg_price,
        detail.purchase_fee
      );
    }, 0);
  };

  const calculateTotalValuationAmount = () => {
    return details.reduce((total, detail) => {
      return total + calculateValuationAmount(detail.quantity, detail.current_price);
    }, 0);
  };

  const calculateTotalProfitLoss = () => {
    return details.reduce((total, detail) => {
      return total + calculateProfitLoss(detail);
    }, 0);
  };

  const calculateTotalReturnRate = () => {
    const totalPurchaseAmount = calculateTotalPurchaseAmount();
    const totalProfitLoss = calculateTotalProfitLoss();
    if (totalPurchaseAmount === 0) return 0;
    return (totalProfitLoss / totalPurchaseAmount) * 100;
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleInputChange = (id, field, value) => {
    setDetails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleETFSelect = (etf) => {
    if (selectingETFFor === 'new') {
      setNewRow({
        ...newRow,
        stock_code: etf.ticker,
        stock_name: etf.name,
      });
    } else {
      // 편집 중인 행의 ETF 변경
      handleInputChange(selectingETFFor, 'stock_code', etf.ticker);
      handleInputChange(selectingETFFor, 'stock_name', etf.name);
    }
    setSelectingETFFor(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewRow({
      stock_code: '',
      stock_name: '',
      quantity: '',
      purchase_avg_price: '',
      current_price: '',
      purchase_fee: '',
      sale_fee: '',
    });
    // 데이터 다시 로드하여 수정 전 상태로 복원
    if (accountId) {
      loadDetails();
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(getApiUrl('/api/v1/pension-fund-account-details/template/download'));
      if (!response.ok) {
        throw new Error('템플릿 다운로드에 실패했습니다.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pension_fund_account_detail_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('템플릿 다운로드 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      event.target.value = ''; // 파일 input 초기화
      return;
    }

    // 기존 데이터가 있을 때만 확인 메시지 표시
    if (details.length > 0) {
      if (!window.confirm('기존 데이터는 갱신됩니다. 계속하시겠습니까?')) {
        event.target.value = ''; // 파일 input 초기화
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(getApiUrl(`/api/v1/pension-fund-account-details/upload/${accountId}`), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail && typeof errorData.detail === 'object') {
          // 에러 상세 정보가 있는 경우
          const errorMessages = [];
          if (errorData.detail.errors && errorData.detail.errors.length > 0) {
            errorMessages.push(...errorData.detail.errors);
          }
          if (errorData.detail.success_count > 0) {
            errorMessages.push(`성공: ${errorData.detail.success_count}건`);
          }
          setError(errorMessages.join('\n'));
        } else {
          setError(errorData.detail || '파일 업로드에 실패했습니다.');
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      await loadDetails();
      
      if (result.error_count > 0) {
        const messages = [];
        if (result.create_count > 0) messages.push(`추가: ${result.create_count}건`);
        if (result.update_count > 0) messages.push(`수정: ${result.update_count}건`);
        messages.push(`실패: ${result.error_count}건`);
        setError(`업로드 완료: ${messages.join(', ')}\n${result.errors.join('\n')}`);
      } else {
        setError(null);
        const messages = [];
        if (result.create_count > 0) messages.push(`추가: ${result.create_count}건`);
        if (result.update_count > 0) messages.push(`수정: ${result.update_count}건`);
        alert(`업로드 완료: ${messages.join(', ')}`);
      }
    } catch (err) {
      setError('파일 업로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
      // 파일 input 초기화
      event.target.value = '';
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">연금저축펀드 종목 관리</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            템플릿 다운로드
          </button>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            엑셀 업로드
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
          <button
            onClick={handleAdd}
            disabled={loading || editingId === 'new'}
            className="px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + 종목 추가
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-4 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* 전체 합계 표시 */}
      {details.length > 0 && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div className="text-sm text-wealth-muted mb-1">전체 매수금액</div>
            <div className="text-xl font-semibold text-white">
              {formatCurrency(calculateTotalPurchaseAmount())}원
            </div>
          </div>
          <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div className="text-sm text-wealth-muted mb-1">전체 평가금액</div>
            <div className="text-xl font-semibold text-white">
              {formatCurrency(calculateTotalValuationAmount())}원
            </div>
          </div>
          <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div className="text-sm text-wealth-muted mb-1">전체 평가손익</div>
            <div className={`text-xl font-semibold ${
              calculateTotalProfitLoss() >= 0 ? 'text-red-400' : 'text-blue-400'
            }`}>
              {calculateTotalProfitLoss() >= 0 ? '+' : ''}
              {formatCurrency(calculateTotalProfitLoss())}원
            </div>
          </div>
          <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div className="text-sm text-wealth-muted mb-1">전체 수익률</div>
            <div className={`text-xl font-semibold ${
              calculateTotalReturnRate() >= 0 ? 'text-red-400' : 'text-blue-400'
            }`}>
              {calculateTotalReturnRate() >= 0 ? '+' : ''}
              {formatDecimal(calculateTotalReturnRate())}%
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-6 px-6">
        <div style={{ minWidth: '1400px' }}>
          <DataGrid
            columns={[
              { key: 'stock_code', label: '종목코드', align: 'left', width: '120px' },
              { key: 'stock_name', label: '종목명', align: 'left', width: '220px' },
              { key: 'quantity', label: '수량', align: 'right', width: '120px' },
              { key: 'purchase_avg_price', label: '매입단가', align: 'right', width: '150px' },
              { key: 'current_price', label: '현재가', align: 'right', width: '150px' },
              { key: 'purchase_fee', label: '매수수수료', align: 'right', width: '150px' },
              { key: 'sale_fee', label: '매도수수료', align: 'right', width: '150px' },
              { key: 'purchase_amount', label: '매수금액', align: 'right', width: '150px' },
              { key: 'valuation_amount', label: '평가금액', align: 'right', width: '150px' },
              { key: 'profit_loss', label: '평가손익', align: 'right', width: '150px' },
              { key: 'return_rate', label: '수익률', align: 'right', width: '120px' },
            ]}
            data={details}
            editingId={editingId}
            selectedId={null}
            onRowClick={null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSave={(row) => handleSave(row || newRow)}
            onCancel={handleCancel}
            loading={loading}
            showRowNumber={true}
            showActions={true}
            renderNewRow={(columns) => (
              <>
                <td className="py-3 px-6" style={columns[0]?.width ? { width: columns[0].width } : {}}>
                  <input
                    type="text"
                    value={newRow.stock_code}
                    disabled
                    placeholder="종목코드"
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="py-3 px-6" style={columns[1]?.width ? { width: columns[1].width } : {}}>
                  <input
                    type="text"
                    value={newRow.stock_name}
                    onClick={() => {
                      setSelectingETFFor('new');
                      setShowETFSelector(true);
                    }}
                    readOnly
                    placeholder="종목명 클릭"
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold cursor-pointer hover:border-wealth-gold transition-colors"
                  />
                </td>
                <td className="py-3 px-6" style={columns[2]?.width ? { width: columns[2].width } : {}}>
                  <RatioInput
                    name="quantity"
                    value={newRow.quantity}
                    onChange={(e) => setNewRow({ ...newRow, quantity: e.target.value })}
                    placeholder="수량"
                    suffix=""
                    min={0}
                    max={999999999}
                    step={0.01}
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[3]?.width ? { width: columns[3].width } : {}}>
                  <CurrencyInput
                    name="purchase_avg_price"
                    value={newRow.purchase_avg_price}
                    onChange={(e) => setNewRow({ ...newRow, purchase_avg_price: e.target.value })}
                    placeholder="매입단가"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[4]?.width ? { width: columns[4].width } : {}}>
                  <CurrencyInput
                    name="current_price"
                    value={newRow.current_price}
                    onChange={(e) => setNewRow({ ...newRow, current_price: e.target.value })}
                    placeholder="현재가"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[5]?.width ? { width: columns[5].width } : {}}>
                  <CurrencyInput
                    name="purchase_fee"
                    value={newRow.purchase_fee}
                    onChange={(e) => setNewRow({ ...newRow, purchase_fee: e.target.value })}
                    placeholder="매수수수료"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[6]?.width ? { width: columns[6].width } : {}}>
                  <CurrencyInput
                    name="sale_fee"
                    value={newRow.sale_fee}
                    onChange={(e) => setNewRow({ ...newRow, sale_fee: e.target.value })}
                    placeholder="매도수수료"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[7]?.width ? { width: columns[7].width } : {}}>
                  {formatCurrency(
                    calculatePurchaseAmount(
                      newRow.quantity,
                      newRow.purchase_avg_price,
                      newRow.purchase_fee
                    )
                  )}
                  원
                </td>
                <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[8]?.width ? { width: columns[8].width } : {}}>
                  {formatCurrency(calculateValuationAmount(newRow.quantity, newRow.current_price))}원
                </td>
                <td className="py-3 px-6 text-right text-white" style={columns[9]?.width ? { width: columns[9].width } : {}}>-</td>
                <td className="py-3 px-6 text-right text-white" style={columns[10]?.width ? { width: columns[10].width } : {}}>-</td>
              </>
            )}
            renderEditRow={(row, columns) => (
              <>
                <td className="py-3 px-6" style={columns[0]?.width ? { width: columns[0].width } : {}}>
                  <input
                    type="text"
                    value={row.stock_code}
                    disabled
                    placeholder="종목코드"
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="py-3 px-6" style={columns[1]?.width ? { width: columns[1].width } : {}}>
                  <input
                    type="text"
                    value={row.stock_name}
                    onClick={() => {
                      setSelectingETFFor(row.id);
                      setShowETFSelector(true);
                    }}
                    readOnly
                    placeholder="종목명 클릭"
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold cursor-pointer hover:border-wealth-gold transition-colors"
                  />
                </td>
                <td className="py-3 px-6" style={columns[2]?.width ? { width: columns[2].width } : {}}>
                  <RatioInput
                    name="quantity"
                    value={row.quantity}
                    onChange={(e) => handleInputChange(row.id, 'quantity', e.target.value)}
                    placeholder="수량"
                    suffix=""
                    min={0}
                    max={999999999}
                    step={0.01}
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[3]?.width ? { width: columns[3].width } : {}}>
                  <CurrencyInput
                    name="purchase_avg_price"
                    value={row.purchase_avg_price}
                    onChange={(e) => handleInputChange(row.id, 'purchase_avg_price', e.target.value)}
                    placeholder="매입단가"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[4]?.width ? { width: columns[4].width } : {}}>
                  <CurrencyInput
                    name="current_price"
                    value={row.current_price}
                    onChange={(e) => handleInputChange(row.id, 'current_price', e.target.value)}
                    placeholder="현재가"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[5]?.width ? { width: columns[5].width } : {}}>
                  <CurrencyInput
                    name="purchase_fee"
                    value={row.purchase_fee}
                    onChange={(e) => handleInputChange(row.id, 'purchase_fee', e.target.value)}
                    placeholder="매수수수료"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6" style={columns[6]?.width ? { width: columns[6].width } : {}}>
                  <CurrencyInput
                    name="sale_fee"
                    value={row.sale_fee}
                    onChange={(e) => handleInputChange(row.id, 'sale_fee', e.target.value)}
                    placeholder="매도수수료"
                    suffix="원"
                    className="w-full"
                  />
                </td>
                <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[7]?.width ? { width: columns[7].width } : {}}>
                  {formatCurrency(
                    calculatePurchaseAmount(
                      row.quantity,
                      row.purchase_avg_price,
                      row.purchase_fee
                    )
                  )}
                  원
                </td>
                <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[8]?.width ? { width: columns[8].width } : {}}>
                  {formatCurrency(calculateValuationAmount(row.quantity, row.current_price))}원
                </td>
                <td className="py-3 px-6 text-right text-white" style={columns[9]?.width ? { width: columns[9].width } : {}}>-</td>
                <td className="py-3 px-6 text-right text-white" style={columns[10]?.width ? { width: columns[10].width } : {}}>-</td>
              </>
            )}
            renderViewRow={(row, columns) => {
              const profitLoss = calculateProfitLoss(row);
              const returnRate = calculateReturnRate(row);
              return (
                <>
                  <td className="py-3 px-6 text-white whitespace-nowrap" style={columns[0]?.width ? { width: columns[0].width } : {}}>{row.stock_code}</td>
                  <td className="py-3 px-6 text-white whitespace-nowrap overflow-hidden text-ellipsis" style={columns[1]?.width ? { width: columns[1].width } : {}} title={row.stock_name}>{row.stock_name}</td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[2]?.width ? { width: columns[2].width } : {}}>{formatCurrency(row.quantity)}주</td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[3]?.width ? { width: columns[3].width } : {}}>{formatCurrency(row.purchase_avg_price)}원</td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[4]?.width ? { width: columns[4].width } : {}}>{formatCurrency(row.current_price)}원</td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[5]?.width ? { width: columns[5].width } : {}}>{formatCurrency(row.purchase_fee)}원</td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[6]?.width ? { width: columns[6].width } : {}}>{formatCurrency(row.sale_fee)}원</td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[7]?.width ? { width: columns[7].width } : {}}>
                    {formatCurrency(
                      calculatePurchaseAmount(
                        row.quantity,
                        row.purchase_avg_price,
                        row.purchase_fee
                      )
                    )}
                    원
                  </td>
                  <td className="py-3 px-6 text-right text-white whitespace-nowrap" style={columns[8]?.width ? { width: columns[8].width } : {}}>
                    {formatCurrency(calculateValuationAmount(row.quantity, row.current_price))}원
                  </td>
                  <td
                    className={`py-3 px-6 text-right font-semibold whitespace-nowrap ${
                      profitLoss >= 0 ? 'text-red-400' : 'text-blue-400'
                    }`}
                    style={columns[9]?.width ? { width: columns[9].width } : {}}
                  >
                    {profitLoss >= 0 ? '+' : ''}
                    {formatCurrency(profitLoss)}원
                  </td>
                  <td
                    className={`py-3 px-6 text-right font-semibold whitespace-nowrap ${
                      returnRate >= 0 ? 'text-red-400' : 'text-blue-400'
                    }`}
                    style={columns[10]?.width ? { width: columns[10].width } : {}}
                  >
                    {returnRate >= 0 ? '+' : ''}
                    {formatDecimal(returnRate)}%
                  </td>
                </>
              );
            }}
            emptyMessage="등록된 종목이 없습니다."
          />
        </div>
      </div>

      {/* 국내ETF 선택 팝업 */}
      <DomesticETFSelector
        isOpen={showETFSelector}
        onClose={() => {
          setShowETFSelector(false);
          setSelectingETFFor(null);
        }}
        onSelect={handleETFSelect}
      />
    </div>
  );
}

export default PensionFundAccountDetail;

