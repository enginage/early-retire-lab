import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-wealth-card/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
        </div>
        <nav className="hidden md:flex space-x-8">
          <Link 
            to="/" 
            className={`transition-colors text-sm font-medium ${
              isActive('/') 
                ? 'text-wealth-gold font-medium' 
                : 'text-wealth-muted hover:text-wealth-gold'
            }`}
          >
            소개
          </Link>
          <Link 
            to="/experience-lab?menu=early-retirement" 
            className={`transition-colors text-sm font-medium ${
              isActive('/experience-lab') 
                ? 'text-wealth-gold font-medium' 
                : 'text-wealth-muted hover:text-wealth-gold'
            }`}
          >
            체험실
          </Link>
          <Link 
            to="/financial-status?menu=expense" 
            className={`transition-colors text-sm font-medium ${
              isActive('/financial-status') 
                ? 'text-wealth-gold font-medium' 
                : 'text-wealth-muted hover:text-wealth-gold'
            }`}
          >
            재무상태
          </Link>
          <Link 
            to="/target-setting?menu=initial-setting" 
            className={`transition-colors text-sm font-medium ${
              isActive('/target-setting') 
                ? 'text-wealth-gold font-medium' 
                : 'text-wealth-muted hover:text-wealth-gold'
            }`}
          >
            시드모으기
          </Link>
          <Link 
            to="/free-living" 
            className={`transition-colors text-sm font-medium ${
              isActive('/free-living') 
                ? 'text-wealth-gold font-medium' 
                : 'text-wealth-muted hover:text-wealth-gold'
            }`}
          >
            자유롭게살기
          </Link>
          <Link 
            to="/settings?menu=basic" 
            className={`transition-colors text-sm font-medium ${
              isActive('/settings') 
                ? 'text-wealth-gold font-medium' 
                : 'text-wealth-muted hover:text-wealth-gold'
            }`}
          >
            환경설정
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              className="transition-colors text-sm font-medium text-wealth-muted hover:text-wealth-gold"
            >
              로그아웃
            </button>
          ) : (
            <Link 
              to="/login" 
              className={`transition-colors text-sm font-medium ${
                isActive('/login') 
                  ? 'text-wealth-gold font-medium' 
                  : 'text-wealth-muted hover:text-wealth-gold'
              }`}
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default TopNav;

