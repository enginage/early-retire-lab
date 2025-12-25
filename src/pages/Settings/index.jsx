import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import BasicSettings from './BasicSettings';
import CommonCode from './CommonCode';
import FinancialInstitution from './FinancialInstitution';
import DomesticETF from './DomesticETF';
import USAETF from './USAETF';
import ExperienceLabSettings from './ExperienceLabSettings';

const MENUS = [
  { key: 'basic', label: '기본설정' },
  { key: 'experience-lab', label: '체험실 설정' },
  { key: 'commoncode', label: '공통코드' },
  { key: 'financial', label: '금융기관' },
  { key: 'domestic-etf', label: '국내ETF' },
  { key: 'usa-etf', label: '미국ETF' },
];

function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const menuFromUrl = searchParams.get('menu') || 'basic';
  const [activeMenu, setActiveMenu] = useState(menuFromUrl);

  useEffect(() => {
    const menu = searchParams.get('menu');
    if (!menu) {
      navigate('/settings?menu=basic', { replace: true });
    } else {
      setActiveMenu(menu);
    }
  }, [searchParams, navigate]);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    navigate(`/settings?menu=${menu}`);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'basic':
        return <BasicSettings />;
      case 'experience-lab':
        return <ExperienceLabSettings />;
      case 'commoncode':
        return <CommonCode />;
      case 'financial':
        return <FinancialInstitution />;
      case 'domestic-etf':
        return <DomesticETF />;
      case 'usa-etf':
        return <USAETF />;
      default:
        return <BasicSettings />;
    }
  };

  return (
    <AppLayout
      sideNavTitle="환경설정"
      sideNavMenus={MENUS}
      activeMenu={activeMenu}
      onMenuClick={handleMenuClick}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default Settings;

