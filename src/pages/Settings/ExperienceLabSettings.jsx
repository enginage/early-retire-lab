import React, { useState, useEffect } from 'react';
import DataGrid from '../../components/DataGrid';
import DomesticETFSelector from '../../components/DomesticETFSelector';
import USAETFSelector from '../../components/USAETFSelector';

const MASTER_API_BASE_URL = 'http://localhost:8000/api/v1/common-code-masters';
const DETAIL_API_BASE_URL = 'http://localhost:8000/api/v1/common-code-details';
const EXPERIENCE_LAB_STOCKS_API_BASE_URL = 'http://localhost:8000/api/v1/experience-lab-stocks';
const DOMESTIC_ETF_API_BASE_URL = 'http://localhost:8000/api/v1/domestic-etfs';
const USA_ETF_API_BASE_URL = 'http://localhost:8000/api/v1/usa-etfs';

function ExperienceLabSettings() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 체험실 종목 관련 상태
  const [stocks, setStocks] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockRow, setNewStockRow] = useState({
    experience_service_code: '',
    ticker: '',
  });
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  
  // ETF 선택 팝업 관련 상태
  const [showETFSelector, setShowETFSelector] = useState(false);
  const [selectingETFFor, setSelectingETFFor] = useState(null); // 'new' or stock id
  
  // ETF 목록 (국내/미국)
  const [domesticEtfs, setDomesticEtfs] = useState([]);
  const [usaEtfs, setUsaEtfs] = useState([]);

  useEffect(() => {
    loadExperienceServiceDetails();
    loadETFs();
  }, []);

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (activeTab) {
      // 탭 변경 시 편집 상태 초기화
      setEditingStockId(null);
      setNewStockRow({
        experience_service_code: activeTab,
        ticker: '',
      });
      setSelectingETFFor(null);
      setShowETFSelector(false);
      // 해당 탭의 종목 로드
      loadStocks(activeTab);
    }
  }, [activeTab]);

  const loadExperienceServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 먼저 마스터 코드로 마스터 ID 찾기
      const masterResponse = await fetch(`${MASTER_API_BASE_URL}?skip=0&limit=100`);
      if (!masterResponse.ok) {
        throw new Error('마스터 코드를 불러오는데 실패했습니다.');
      }
      const masters = await masterResponse.json();
      const master = masters.find(m => m.code === 'experience_service');
      
      if (!master) {
        setError('experience_service 마스터 코드를 찾을 수 없습니다.');
        setTabs([]);
        return;
      }
      
      // 마스터 ID로 상세 코드 조회
      const detailResponse = await fetch(`${DETAIL_API_BASE_URL}?master_id=${master.id}`);
      if (detailResponse.ok) {
        const details = await detailResponse.json();
        const tabList = details.map(detail => ({
          id: detail.detail_code,
          label: detail.detail_code_name
        }));
        setTabs(tabList);
        if (tabList.length > 0) {
          setActiveTab(tabList[0].id);
        }
      } else {
        throw new Error('상세 코드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
      setTabs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadETFs = async () => {
    try {
      console.log('ETF 로드 시작...');
      // 국내 ETF 로드
      const domesticResponse = await fetch(`${DOMESTIC_ETF_API_BASE_URL}?skip=0&limit=10000`);
      console.log('국내ETF 응답:', domesticResponse.status, domesticResponse.ok);
      if (domesticResponse.ok) {
        const data = await domesticResponse.json();
        console.log('국내ETF 데이터:', data);
        setDomesticEtfs(data);
        console.log('국내ETF 로드 완료:', data.length);
      } else {
        const errorText = await domesticResponse.text();
        console.error('국내ETF 로드 실패:', domesticResponse.status, errorText);
      }

      // 미국 ETF 로드
      const usaResponse = await fetch(`${USA_ETF_API_BASE_URL}?skip=0&limit=10000`);
      console.log('미국ETF 응답:', usaResponse.status, usaResponse.ok);
      if (usaResponse.ok) {
        const data = await usaResponse.json();
        console.log('미국ETF 데이터:', data);
        setUsaEtfs(data);
        console.log('미국ETF 로드 완료:', data.length);
      } else {
        const errorText = await usaResponse.text();
        console.error('미국ETF 로드 실패:', usaResponse.status, errorText);
      }
    } catch (err) {
      console.error('ETF 로드 오류:', err);
    }
  };

  const loadStocks = async (serviceCode) => {
    try {
      setStockLoading(true);
      setStockError(null);
      const response = await fetch(`${EXPERIENCE_LAB_STOCKS_API_BASE_URL}?experience_service_code=${serviceCode}`);
      
      if (response.ok) {
        const data = await response.json();
        setStocks(data);
      } else {
        throw new Error('체험실 종목을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setStockError(err.message);
      console.error(err);
      setStocks([]);
    } finally {
      setStockLoading(false);
    }
  };

  const getAvailableETFs = () => {
    // 탭 ID 기반으로 판단: domestic_로 시작하면 국내ETF, usa_로 시작하면 미국ETF
    let etfs = [];
    if (activeTab && (activeTab.startsWith('domestic_') || activeTab.startsWith('kr-'))) {
      etfs = domesticEtfs;
      console.log('국내ETF 선택:', { activeTab, count: etfs.length, domesticEtfsCount: domesticEtfs.length });
    } else if (activeTab && (activeTab.startsWith('usa_') || activeTab.startsWith('us-'))) {
      etfs = usaEtfs;
      console.log('미국ETF 선택:', { activeTab, count: etfs.length, usaEtfsCount: usaEtfs.length });
    }
    return etfs;
  };

  const isDomesticTab = () => {
    return activeTab && (activeTab.startsWith('domestic_') || activeTab.startsWith('kr-'));
  };

  const isUsaTab = () => {
    return activeTab && (activeTab.startsWith('usa_') || activeTab.startsWith('us-'));
  };

  const handleStockAdd = () => {
    setNewStockRow({
      experience_service_code: activeTab,
      ticker: '',
    });
    setEditingStockId('new');
  };

  const handleStockSave = async (stockData) => {
    try {
      setStockLoading(true);
      setStockError(null);

      if (!stockData.ticker || stockData.ticker.trim() === '') {
        setStockError('종목코드를 선택해주세요.');
        setStockLoading(false);
        return;
      }

      const payload = {
        experience_service_code: activeTab,
        ticker: stockData.ticker,
      };

      let response;
      if (stockData.id) {
        // 업데이트
        response = await fetch(`${EXPERIENCE_LAB_STOCKS_API_BASE_URL}/${stockData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // 생성
        response = await fetch(EXPERIENCE_LAB_STOCKS_API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await loadStocks(activeTab);
        setEditingStockId(null);
        setNewStockRow({
          experience_service_code: activeTab,
          ticker: '',
        });
      } else {
        const errorData = await response.json();
        setStockError(errorData.detail || '저장에 실패했습니다.');
      }
    } catch (err) {
      setStockError('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setStockLoading(true);
      setStockError(null);
      const response = await fetch(`${EXPERIENCE_LAB_STOCKS_API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        await loadStocks(activeTab);
      } else {
        const errorData = await response.json();
        setStockError(errorData.detail || '삭제에 실패했습니다.');
      }
    } catch (err) {
      setStockError('삭제 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockEdit = (id) => {
    setEditingStockId(id);
  };

  const handleStockCancel = () => {
    setEditingStockId(null);
    setNewStockRow({
      experience_service_code: activeTab,
      ticker: '',
    });
  };

  const handleStockInputChange = (id, field, value) => {
    if (id === 'new') {
      setNewStockRow((prev) => ({ ...prev, [field]: value }));
    } else {
      setStocks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    }
  };

  const handleETFSelect = (etf) => {
    console.log('handleETFSelect called:', { etf, selectingETFFor, activeTab });
    if (selectingETFFor === 'new') {
      setNewStockRow({
        experience_service_code: activeTab,
        ticker: etf.ticker,
      });
    } else if (selectingETFFor) {
      // 편집 중인 행의 ETF 변경
      handleStockInputChange(selectingETFFor, 'ticker', etf.ticker);
    }
    setSelectingETFFor(null);
    setShowETFSelector(false);
  };

  const renderTabContent = () => {
    if (!activeTab) return null;

    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (!activeTabData) return null;

    const availableETFs = getAvailableETFs();
    console.log('renderTabContent:', { activeTab, availableETFsCount: availableETFs.length, domesticEtfsCount: domesticEtfs.length, usaEtfsCount: usaEtfs.length });

    return (
      <>
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{activeTabData.label} 설정</h2>
          
          {/* 체험실 종목 그리드 */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">체험실 종목</h3>
              <button
                onClick={handleStockAdd}
                disabled={stockLoading || editingStockId === 'new'}
                className="px-4 py-2 bg-gradient-to-r from-wealth-gold to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                + 종목 추가
              </button>
            </div>

            {stockError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 mb-4 text-sm">
                {stockError}
              </div>
            )}

            <div className="bg-wealth-card/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
              <DataGrid
                key={`stock-grid-${activeTab}`}
                columns={[
                  { key: 'ticker', label: '종목코드(티커)', align: 'left' },
                  { key: 'stock_name', label: '종목명', align: 'left' },
                ]}
                data={stocks}
                editingId={editingStockId}
                selectedId={null}
                onRowClick={null}
                onEdit={handleStockEdit}
                onDelete={handleStockDelete}
                onSave={(row) => handleStockSave(row || newStockRow)}
                onCancel={handleStockCancel}
                loading={stockLoading}
                showRowNumber={true}
                showActions={true}
                renderNewRow={() => {
                  const selectedEtf = availableETFs.find(e => e.ticker === newStockRow.ticker);
                  return (
                    <>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={newStockRow.ticker}
                          disabled
                          placeholder="종목코드"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={selectedEtf ? selectedEtf.name : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('종목명 클릭 - new row', { activeTab, availableETFs: availableETFs.length });
                            setSelectingETFFor('new');
                            setShowETFSelector(true);
                          }}
                          readOnly
                          placeholder="종목명 클릭"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold cursor-pointer hover:border-wealth-gold transition-colors"
                        />
                      </td>
                    </>
                  );
                }}
                renderEditRow={(row) => {
                  const selectedEtf = availableETFs.find(e => e.ticker === row.ticker);
                  return (
                    <>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={row.ticker}
                          disabled
                          placeholder="종목코드"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={selectedEtf ? selectedEtf.name : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('종목명 클릭 - edit row', { rowId: row.id, activeTab, availableETFs: availableETFs.length });
                            setSelectingETFFor(row.id);
                            setShowETFSelector(true);
                          }}
                          readOnly
                          placeholder="종목명 클릭"
                          className="w-full px-3 py-2 bg-wealth-card border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-wealth-gold cursor-pointer hover:border-wealth-gold transition-colors"
                        />
                      </td>
                    </>
                  );
                }}
                renderViewRow={(row) => {
                  const etf = availableETFs.find(e => e.ticker === row.ticker);
                  return (
                    <>
                      <td className="py-3 px-4 text-white text-sm">{row.ticker}</td>
                      <td className="py-3 px-4 text-white text-sm">{etf ? etf.name : '-'}</td>
                    </>
                  );
                }}
                emptyMessage="등록된 종목이 없습니다."
              />
            </div>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">체험실 설정</h1>
        <p className="text-wealth-muted">체험실 기능의 설정을 관리합니다.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wealth-gold"></div>
            <span className="ml-3 text-wealth-muted">로딩 중...</span>
          </div>
        </div>
      ) : tabs.length === 0 ? (
        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <div className="text-center py-8 text-wealth-muted">
            등록된 체험실 서비스가 없습니다.
          </div>
        </div>
      ) : (
        <div className="bg-wealth-card/50 backdrop-blur-sm rounded-xl border border-gray-800">
          {/* 탭 헤더 */}
          <div className="border-b border-gray-800">
            <nav className="flex space-x-1 px-6 pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    // 탭 변경 시 편집 상태 초기화
                    setEditingStockId(null);
                    setSelectingETFFor(null);
                    setShowETFSelector(false);
                    setActiveTab(tab.id);
                  }}
                  className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-wealth-gold border-wealth-gold'
                      : 'text-wealth-muted border-transparent hover:text-white hover:border-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-6 space-y-6">
            {renderTabContent()}
          </div>
        </div>
      )}

      {/* ETF 선택 팝업 */}
      {showETFSelector && isDomesticTab() && (
        <DomesticETFSelector
          isOpen={showETFSelector}
          onClose={() => {
            console.log('DomesticETFSelector onClose');
            setShowETFSelector(false);
            setSelectingETFFor(null);
          }}
          onSelect={(etf) => {
            console.log('DomesticETFSelector onSelect', etf);
            handleETFSelect(etf);
          }}
        />
      )}
      {showETFSelector && isUsaTab() && (
        <USAETFSelector
          isOpen={showETFSelector}
          onClose={() => {
            console.log('USAETFSelector onClose');
            setShowETFSelector(false);
            setSelectingETFFor(null);
          }}
          onSelect={(etf) => {
            console.log('USAETFSelector onSelect', etf);
            handleETFSelect(etf);
          }}
        />
      )}
    </div>
  );
}

export default ExperienceLabSettings;

