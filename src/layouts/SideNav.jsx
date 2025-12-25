import React from 'react';

const SideNav = ({ title, menus, activeMenu, onMenuClick }) => {
  return (
    <aside className="w-48 bg-wealth-card/50 backdrop-blur-sm border-r border-gray-800 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-4 px-2">{title}</h2>
        <nav className="space-y-1">
          {menus.map((menu) => (
            <button
              key={menu.key}
              onClick={() => onMenuClick(menu.key)}
              className={`w-[170px] text-left px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                activeMenu === menu.key
                  ? 'bg-wealth-gold/20 text-wealth-gold font-medium'
                  : 'text-wealth-muted hover:text-white hover:bg-wealth-card/50'
              }`}
            >
              {menu.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default SideNav;

