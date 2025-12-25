import React, { useState, useEffect } from 'react';
import CurrencyInput from '../../components/CurrencyInput';
import DateInput from '../../components/DateInput';
import IRPAccountDetail from './IRPAccountDetail';
import FinancialInstitutionSelector from '../../components/FinancialInstitutionSelector';
import CommonCodeSelector from '../../components/CommonCodeSelector';
import DataGrid from '../../components/DataGrid';

const API_BASE_URL = 'http://localhost:8000/api/v1/irp-accounts';
const DETAIL_API_BASE_URL = 'http://localhost:8000/api/v1/irp-account-details';
const MASTER_API_BASE_URL = 'http://localhost:8000/api/v1/common-code-masters';
const COMMON_DETAIL_API_BASE_URL = 'http://localhost:8000/api/v1/common-code-details';

function IRPAccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState({
    financial_institution_code: '',
    financial_institution_name: '',
    account_number: '',
    registration_date: '',
    cash_balance: '',
    account_status_code: '',
  });
  const [accountStatusMap, setAccountStatusMap] = useState({}); // 계좌상태코드명 매핑
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFinancialInstitutionSelector, setShowFinancialInstitutionSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); // 'new' or account id

  useEffect(() => {
    loadAccounts();
    loadAccountStatusMap();
  }, []);

  // 계좌 목록이 로드되고 데이터가 있으면 첫 번째 계좌 자동 선택
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId && !loading && editingId === null) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, loading]);

  const loadAccountStatusMap = async () => {
    try {
      // account_status 마스터 코드 찾기
      const masterResponse = await fetch(`${MASTER_API_BASE_URL}?skip=0&limit=100`);
      if (!masterResponse.ok) return;
      
      const masters = await masterResponse.json();
      const accountStatusMaster = masters.find(m => m.code === 'account_status');
      
      if (!accountStatusMaster) return;
      
      // 상세 코드 조회
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

  const handleAdd = () => {
    setNewRow({
      financial_institution_code: '',
      financial_institution_name: '',
      account_number: '',
      registration_date: '',
      cash_balance: '',
      account_status_code: '',
    });
    setEditingId('new');
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewRow({
      financial_institution_code: '',
      financial_institution_name: '',
      account_number: '',
      registration_date: '',
      cash_balance: '',
      account_status_code: '',
    });
    // 데이터 다시 로드하여 수정 전 상태로 복원
    loadAccounts();
  };

  const handleInputChange = (id, field, value) => {
    if (id === 'new') {
      setNewRow((prev) => ({ ...prev, [field]: value }));
    } else {
      setAccounts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    }
  };

  const handleFinancialInstitutionClick = (accountId) => {
    setSelectingFor(accountId);
    setShowFinancialInstitutionSelector(true);
  };

  const handleFinancialInstitutionSelect = (institution) => {
    if (selectingFor === 'new') {
      setNewRow({
        ...newRow,
        financial_institution_code: institution.code,
        financial_institution_name: institution.name,
      });
    } else {
      // 기존 계좌 수정 시
      setAccounts(accounts.map(acc =>
        acc.id === selectingFor
          ? { ...acc, financial_institution_code: institution.code, financial_institution_name: institution.name }
          : acc
      ));
    }
    setSelectingFor(null);
  };

  const handleSave = async (accountData) => {
    try {
      setLoading(true);
      setError(null);

      // 필수 필드 검증
      if (!accountData.financial_institution_code) {
        setError('금융기관을 선택해주세요.');
        setLoading(false);
        return;
      }
      if (!accountData.account_number || accountData.account_number.trim() === '') {
        setError('계좌번호를 입력해주세요.');
        setLoading(false);
        return;
      }
      if (!accountData.account_status_code || accountData.account_status_code.trim() === '') {
        setError('계좌상태를 선택해주세요.');
        setLoading(false);
        return;
      }

      const payload = {
        financial_institution_code: accountData.financial_institution_code,
        account_number: accountData.account_number,
        registration_date: accountData.registration_date && accountData.registration_date.trim() !== '' ? accountData.registration_date : null,
        cash_balance: Math.floor(parseFloat(accountData.cash_balance) || 0),
        account_status_code: accountData.account_status_code,
      };

      let response;
      if (accountData.id) {
        // 업데이트
        response = await fetch(`${API_BASE_URL}/${accountData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // 생성
        response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await loadAccounts();
        setEditingId(null);
        setNewRow({
          financial_institution_code: '',
          financial_institution_name: '',
          account_number: '',
          registration_date: '',
          cash_balance: '',
          account_status_code: '',
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
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        await loadAccounts();
        if (selectedAccountId === id) {
          setSelectedAccountId(null);
        }
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

  const handleRowClick = (accountId) => {
    // 등록이나 수정 상태가 아닐 때만 클릭 가능
    if (editingId === null) {
      setSelectedAccountId(accountId);
    }
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">IRP 관리</h1>
        <p className="text-wealth-muted">IRP 계좌 정보를 관리하고 종목별 상세 정보를 확인하세요.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">IRP 목록</h2>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading || editingId === 'new'}
            className="px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + 추가
          </button>
        </div>

        {/* 마스터 그리드 */}
        <div className="overflow-x-auto -mx-6 px-6">
          <DataGrid
            columns={[
              { key: 'financial_institution', label: '금융기관', align: 'left' },
              { key: 'account_number', label: '계좌번호', align: 'left' },
              { key: 'registration_date', label: '가입일자', align: 'left' },
              { key: 'cash_balance', label: '현금잔고', align: 'left' },
              { key: 'account_status', label: '계좌상태', align: 'left' },
            ]}
            data={accounts}
            editingId={editingId}
            selectedId={selectedAccountId}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSave={(row) => handleSave(row || newRow)}
            onCancel={handleCancel}
            loading={loading}
            showRowNumber={true}
            showActions={true}
            renderNewRow={() => (
              <>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectingFor('new');
                      setShowFinancialInstitutionSelector(true);
                    }}
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                  >
                    {newRow.financial_institution_name || '금융기관 선택'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={newRow.account_number}
                    onChange={(e) => setNewRow({ ...newRow, account_number: e.target.value })}
                    placeholder="계좌번호"
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                  />
                </td>
                <td className="py-3 px-4">
                  <DateInput
                    name="registration_date"
                    value={newRow.registration_date}
                    onChange={(e) => setNewRow({ ...newRow, registration_date: e.target.value })}
                    className="!mb-0"
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="cash_balance"
                      value={newRow.cash_balance ? new Intl.NumberFormat('ko-KR').format(Math.floor(parseFloat(newRow.cash_balance) || 0)) : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setNewRow({ ...newRow, cash_balance: numericValue });
                      }}
                      placeholder="현금잔고"
                      className="w-full px-3 py-2 pr-12 bg-wealth-card border border-gray-700 rounded-lg text-white text-right placeholder:text-left focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wealth-muted pointer-events-none">
                      원
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <CommonCodeSelector
                    masterCode="account_status"
                    value={newRow.account_status_code}
                    onChange={(e) => setNewRow({ ...newRow, account_status_code: e.target.value })}
                    placeholder="계좌상태 선택"
                  />
                </td>
              </>
            )}
            renderEditRow={(row) => (
              <>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFinancialInstitutionClick(row.id);
                    }}
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                  >
                    {row.financial_institution_name || row.financial_institution_code || '금융기관 선택'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={row.account_number}
                    onChange={(e) => handleInputChange(row.id, 'account_number', e.target.value)}
                    className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                  />
                </td>
                <td className="py-3 px-4">
                  <DateInput
                    name="registration_date"
                    value={row.registration_date}
                    onChange={(e) => handleInputChange(row.id, 'registration_date', e.target.value)}
                    className="!mb-0"
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="cash_balance"
                      value={row.cash_balance ? new Intl.NumberFormat('ko-KR').format(Math.floor(parseFloat(row.cash_balance) || 0)) : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange(row.id, 'cash_balance', numericValue);
                      }}
                      className="w-full px-3 py-2 pr-12 bg-wealth-card border border-gray-700 rounded-lg text-white text-right placeholder:text-left focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wealth-muted pointer-events-none">
                      원
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <CommonCodeSelector
                    masterCode="account_status"
                    value={row.account_status_code}
                    onChange={(e) => handleInputChange(row.id, 'account_status_code', e.target.value)}
                    placeholder="계좌상태 선택"
                  />
                </td>
              </>
            )}
            renderViewRow={(row) => (
              <>
                <td className="py-3 px-4 text-white">{row.financial_institution_name || '-'}</td>
                <td className="py-3 px-4 text-white">{row.account_number}</td>
                <td className="py-3 px-4 text-white">{formatDate(row.registration_date)}</td>
                <td className="py-3 px-4 text-white text-right">{formatCurrency(row.cash_balance)}원</td>
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

        {/* 상세 그리드 */}
        {selectedAccountId && (
          <div className="mt-8">
            <IRPAccountDetail accountId={selectedAccountId} />
          </div>
        )}
      </div>

      {/* 금융기관 선택 팝업 */}
      <FinancialInstitutionSelector
        isOpen={showFinancialInstitutionSelector}
        onClose={() => {
          setShowFinancialInstitutionSelector(false);
          setSelectingFor(null);
        }}
        onSelect={handleFinancialInstitutionSelect}
      />
    </div>
  );
}

export default IRPAccountManagement;

