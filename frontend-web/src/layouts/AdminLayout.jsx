
import React from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/header/Header';

export default function AdminLayout({
  activeTab,
  setActiveTab,
  title,
  role = 'Operator',
  onToggleRole,
  children,
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          title={title}
          role={role}
          onToggleRole={onToggleRole}
        />

        <main className="flex-1 p-6">
          {children ?? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {title}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Nội dung trang sẽ được phát triển ở các bước tiếp theo.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
