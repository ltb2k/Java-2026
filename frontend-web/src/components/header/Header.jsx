
import React from 'react';

export default function Header({
  title,
  role = 'Operator',
  onToggleRole,
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          {title || 'Tổng quan'}
        </h1>

        <p className="text-xs text-gray-500 mt-1">
          Hệ thống quản lý nuôi trồng nấm thông minh
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-3 py-1.5 rounded-full">
          ● Chưa kết nối Backend
        </span>

        {onToggleRole ? (
          <button
            type="button"
            onClick={onToggleRole}
            title="Chuyển vai trò để kiểm thử giao diện"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full transition"
          >
            Vai trò: {role} ↻
          </button>
        ) : (
          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            Vai trò: {role}
          </span>
        )}
      </div>
    </header>
  );
}
