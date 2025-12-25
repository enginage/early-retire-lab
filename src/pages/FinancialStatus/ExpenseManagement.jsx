import React, { useState, useEffect } from 'react';

import { getApiUrl, API_ENDPOINTS } from '../../utils/api';

const API_BASE_URL = getApiUrl(API_ENDPOINTS.EXPENSES);

function ExpenseManagement() {
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState({ type: 'fixed', item: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching from:', API_BASE_URL);
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data);
        setFixedExpenses(data.filter(e => e.type === 'fixed'));
        setVariableExpenses(data.filter(e => e.type === 'variable'));
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setError(`데이터를 불러오는데 실패했습니다. (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(`서버에 연결할 수 없습니다: ${err.message}. API URL: ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (type) => {
    setNewRow({ type, item: '', amount: '' });
    setEditingId('new');
  };

  const handleSave = async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      
      const expenseData = {
        type: data.type,
        item: data.item,
        amount: Math.floor(parseFloat(data.amount) || 0)
      };
      
      let response;
      if (id === 'new') {
        response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData),
        });
      }

      if (response.ok) {
        await loadExpenses();
        setEditingId(null);
        setNewRow({ type: 'fixed', item: '', amount: '' });
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

      if (response.ok) {
        await loadExpenses();
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

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewRow({ type: 'fixed', item: '', amount: '' });
  };

  const handleInputChange = (id, field, value) => {
    if (id === 'new') {
      setNewRow({ ...newRow, [field]: value });
    } else {
      const allExpenses = [...fixedExpenses, ...variableExpenses];
      const updated = allExpenses.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      );
      setFixedExpenses(updated.filter(e => e.type === 'fixed'));
      setVariableExpenses(updated.filter(e => e.type === 'variable'));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(Math.floor(amount || 0));
  };

  const calculateTotal = (expenses) => {
    return expenses.reduce((sum, expense) => sum + Math.floor(parseFloat(expense.amount || 0)), 0);
  };

  const renderExpenseGrid = (expenses, type, title) => {
    const currentExpense = expenses.find(e => e.id === editingId);
    const isNewRow = editingId === 'new' && newRow.type === type;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={() => handleAdd(type)}
            disabled={loading || editingId === 'new'}
            className="px-4 py-2 bg-gradient-to-r from-wealth-gold to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>

        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700 bg-wealth-card/50">
                  <th className="text-left py-3 px-4 text-wealth-muted font-semibold text-sm">번호</th>
                  <th className="text-left py-3 px-4 text-wealth-muted font-semibold text-sm">항목</th>
                  <th className="text-right py-3 px-4 text-wealth-muted font-semibold text-sm">금액</th>
                  <th className="text-right py-3 px-4 text-wealth-muted font-semibold text-sm">작업</th>
                </tr>
              </thead>
              <tbody>
                {isNewRow && (
                  <tr className="border-b border-gray-800 hover:bg-wealth-card/30">
                    <td className="py-3 px-4 text-wealth-muted text-sm">-</td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={newRow.item}
                        onChange={(e) => handleInputChange('new', 'item', e.target.value)}
                        className="w-full px-3 py-1 bg-wealth-card border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                        placeholder="항목명"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        step="1"
                        value={newRow.amount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\./g, '');
                          handleInputChange('new', 'amount', value);
                        }}
                        className="w-full px-3 py-1 bg-wealth-card border border-gray-700 rounded text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                        placeholder="금액"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSave('new', newRow)}
                          disabled={loading || !newRow.item || !newRow.amount}
                          className="px-3 py-1 text-sm bg-wealth-gold text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {expenses.map((expense, index) => (
                  <tr key={expense.id} className="border-b border-gray-800 hover:bg-wealth-card/30">
                    <td className="py-3 px-4 text-wealth-muted text-sm">{index + 1}</td>
                    <td className="py-3 px-4">
                      {editingId === expense.id ? (
                        <input
                          type="text"
                          value={currentExpense?.item || expense.item}
                          onChange={(e) => handleInputChange(expense.id, 'item', e.target.value)}
                          className="w-full px-3 py-1 bg-wealth-card border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                        />
                      ) : (
                        <span className="text-white">{expense.item}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === expense.id ? (
                        <input
                          type="number"
                          step="1"
                          value={Math.floor(currentExpense?.amount || expense.amount)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\./g, '');
                            handleInputChange(expense.id, 'amount', value);
                          }}
                          className="w-full px-3 py-1 bg-wealth-card border border-gray-700 rounded text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-wealth-gold"
                        />
                      ) : (
                        <span className="text-white font-mono">{formatCurrency(expense.amount)}원</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        {editingId === expense.id ? (
                          <>
                            <button
                              onClick={() => handleSave(expense.id, currentExpense || expense)}
                              disabled={loading}
                              className="px-3 py-1 text-sm bg-wealth-gold text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={loading}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(expense.id)}
                              disabled={loading || editingId !== null}
                              className="px-3 py-1 text-sm text-wealth-gold hover:bg-wealth-gold/10 rounded transition-colors disabled:opacity-50"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              disabled={loading || editingId !== null}
                              className="px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length > 0 && (
                  <tr className="border-t-2 border-gray-700 bg-wealth-card/30">
                    <td colSpan="2" className="py-3 px-4 text-white font-semibold text-right">합계</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-wealth-gold font-bold font-mono text-lg">
                        {formatCurrency(calculateTotal(expenses))}원
                      </span>
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">월평균지출</h1>
        <p className="text-wealth-muted">월평균지출을 관리하여 조기은퇴 목표를 달성하세요.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {loading && fixedExpenses.length === 0 && variableExpenses.length === 0 ? (
        <div className="text-center py-8 text-wealth-muted">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 고정비 */}
          <div>
            {renderExpenseGrid(fixedExpenses, 'fixed', '고정비')}
            {fixedExpenses.length === 0 && !loading && editingId !== 'new' && (
              <div className="text-center py-8 text-wealth-muted text-sm">등록된 고정비가 없습니다.</div>
            )}
          </div>

          {/* 변동비 */}
          <div>
            {renderExpenseGrid(variableExpenses, 'variable', '변동비')}
            {variableExpenses.length === 0 && !loading && editingId !== 'new' && (
              <div className="text-center py-8 text-wealth-muted text-sm">등록된 변동비가 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {/* 통계 정보 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
          <div className="text-wealth-muted text-sm mb-1">고정비 합계</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(calculateTotal(fixedExpenses))}원
          </div>
        </div>
        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
          <div className="text-wealth-muted text-sm mb-1">변동비 합계</div>
          <div className="text-2xl font-bold text-wealth-gold">
            {formatCurrency(calculateTotal(variableExpenses))}원
          </div>
        </div>
        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
          <div className="text-wealth-muted text-sm mb-1">총 지출</div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(calculateTotal([...fixedExpenses, ...variableExpenses]))}원
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseManagement;

