import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import EarlyRetirementInitialSetting from './EarlyRetirementInitialSetting';
import IncomeTarget from './IncomeTarget';
import ISAOptimization from './ISAOptimization';

const MENUS = [
  { key: 'initial-setting', label: '조기은퇴 필요자산' },
  { key: 'isa-optimization', label: 'ISA 수익 최적화' },
  { key: 'income', label: '소득목표' },
];

function TargetSetting() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const menuFromUrl = searchParams.get('menu') || 'initial-setting';
  const [activeMenu, setActiveMenu] = useState(menuFromUrl);

  useEffect(() => {
    const menu = searchParams.get('menu');
    if (!menu) {
      navigate('/target-setting?menu=initial-setting', { replace: true });
    } else {
      setActiveMenu(menu);
    }
  }, [searchParams, navigate]);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    navigate(`/target-setting?menu=${menu}`);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'initial-setting':
        return <EarlyRetirementInitialSetting />;
      case 'isa-optimization':
        return <ISAOptimization />;
      case 'income':
        return <IncomeTarget />;
      default:
        return <EarlyRetirementInitialSetting />;
    }
  };

  return (
    <AppLayout
      sideNavTitle="시드모으기"
      sideNavMenus={MENUS}
      activeMenu={activeMenu}
      onMenuClick={handleMenuClick}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default TargetSetting;

