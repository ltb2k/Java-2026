
import React from 'react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Giám sát IoT', icon: '📡' },
  { id: 'rooms-trays', label: 'Phòng & Khay', icon: '🍄' },
  { id: 'rentals', label: 'Yêu cầu thuê', icon: '📋' },
  { id: 'devices', label: 'Quản lý thiết bị', icon: '🔌' },
  { id: 'thresholds', label: 'Cấu hình ngưỡng', icon: '⚙️' },
  { id: 'growth', label: 'Theo dõi sinh trưởng', icon: '🌱' },
  { id: 'harvest', label: 'Quản lý thu hoạch', icon: '🧺' },
  {
    id: 'users',
    label: 'Quản lý tài khoản',
    icon: '👥',
    adminOnly: true,
  },
  {
    id: 'packages',
    label: 'Quản lý gói thuê',
    icon: '📦',
    adminOnly: true,
  },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  role = 'Operator',
}) {
  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.adminOnly || role === 'Admin'
  );

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-200 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-800 flex items-center gap-2.5">
        <span className="text-2xl">🍄</span>

        <div>
          <div className="font-bold text-white text-sm tracking-wide">
            MUSHROOM IOT
          </div>

          <div className="text-[11px] text-slate-400">
            Admin & Operator
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Menu chính">
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Vai trò hiện tại
        </p>

        <p className="text-sm font-semibold text-white mt-1">
          {role === 'Admin' ? 'Quản trị viên' : 'Nhân viên vận hành'}
        </p>
      </div>
    </aside>
  );
}
