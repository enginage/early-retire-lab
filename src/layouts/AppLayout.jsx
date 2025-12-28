import React from 'react';
import TopNav from './TopNav';
import ContentFrame from './ContentFrame';

const AppLayout = ({ 
  children,
}) => {
  return (
    <div className="min-h-screen bg-wealth-dark pb-20">
      <TopNav />
      
      {/* Main Content */}
      <div className="h-[calc(100vh-73px)]">
        <ContentFrame>
          {children}
        </ContentFrame>
      </div>
    </div>
  );
};

export default AppLayout;
