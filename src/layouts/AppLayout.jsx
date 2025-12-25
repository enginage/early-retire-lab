import React from 'react';
import TopNav from './TopNav';
import SideNav from './SideNav';
import ContentFrame from './ContentFrame';

const AppLayout = ({ 
  sideNavTitle, 
  sideNavMenus, 
  activeMenu, 
  onMenuClick, 
  children,
  showSideNav = true
}) => {
  return (
    <div className="min-h-screen bg-wealth-dark pb-20">
      <TopNav />
      
      {/* Main Content - 좌우 분할 레이아웃 */}
      <div className="flex h-[calc(100vh-73px)]">
        {showSideNav && (
          <SideNav
            title={sideNavTitle}
            menus={sideNavMenus}
            activeMenu={activeMenu}
            onMenuClick={onMenuClick}
          />
        )}
        <ContentFrame>
          {children}
        </ContentFrame>
      </div>
    </div>
  );
};

export default AppLayout;

