import React from 'react';
import AppLayout from '../../layouts/AppLayout';

function FreeLiving() {
  return (
    <AppLayout
      sideNavTitle="자유롭게살기"
      sideNavMenus={[]}
      activeMenu=""
      onMenuClick={() => {}}
      showSideNav={false}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">자유롭게살기</h1>
          <p className="text-wealth-muted">자유롭게 살기 위한 기능을 준비 중입니다.</p>
        </div>
      </div>
    </AppLayout>
  );
}

export default FreeLiving;

