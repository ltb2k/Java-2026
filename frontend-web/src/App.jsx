import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/dashboard/Dashboard';
import RoomsAndTrays from './pages/rooms-trays/RoomsAndTrays';
import RentalRequests from './pages/rental-requests/RentalRequests';
import Devices from './pages/devices/Devices';
import Thresholds from './pages/thresholds/Thresholds';
import GrowthTracking from './pages/growth/GrowthTracking';
import Harvest from './pages/harvest/Harvest';
import Users from './pages/users/Users';
import Packages from './pages/packages/Packages';
import AuthPage from './pages/auth/AuthPage';
import CustomerPortal from './pages/customer/CustomerPortal';
import api, {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setOnUnauthorized,
} from './services/api';

const PAGE_TITLES = {
  dashboard: 'Giám sát IoT',
  'rooms-trays': 'Phòng & Khay',
  rentals: 'Yêu cầu thuê',
  devices: 'Quản lý thiết bị',
  thresholds: 'Cấu hình ngưỡng',
  growth: 'Theo dõi sinh trưởng',
  harvest: 'Quản lý thu hoạch',
  users: 'Quản lý tài khoản',
  packages: 'Quản lý gói thuê',
};

const normalizeUiRole = (backendRole) => {
  const upper = String(backendRole || '').toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'CUSTOMER') return 'Customer';
  return 'Operator';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authNotice, setAuthNotice] = useState('');

  const [rooms, setRooms] = useState([]);
  const [trays, setTrays] = useState([]);
  const [devices, setDevices] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const handleLogout = useCallback((notice = '') => {
    clearAuthSession();
    setCurrentUser(null);
    setRooms([]);
    setTrays([]);
    setDevices([]);
    setThresholds([]);
    setAlerts([]);
    setActiveTab('dashboard');
    setAuthNotice(notice);
  }, []);

  useEffect(() => {
    setOnUnauthorized((msg) => {
      handleLogout(msg || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    });
  }, [handleLogout]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }
    api.auth
      .me()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {
        clearAuthSession();
        setCurrentUser(null);
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!currentUser || String(currentUser.role).toUpperCase() === 'CUSTOMER') {
      return;
    }
    setDataLoading(true);
    setDataError('');
    try {
      const [roomList, trayList, deviceList, thresholdList, alertList] =
        await Promise.all([
          api.rooms.list(),
          api.trays.list(),
          api.devices.list(),
          api.alerts.listThresholds(),
          api.alerts.list({ limit: 50 }),
        ]);

      const traysByRoom = new Map();
      (trayList || []).forEach((t) => {
        const list = traysByRoom.get(t.room_id) || [];
        list.push(t);
        traysByRoom.set(t.room_id, list);
      });

      const mergedRooms = (roomList || []).map((r) => ({
        ...r,
        trays: traysByRoom.get(r.id) || [],
      }));

      setRooms(mergedRooms);
      setTrays(trayList || []);
      setDevices(deviceList || []);
      setThresholds(thresholdList || []);
      setAlerts(alertList || []);
    } catch (err) {
      setDataError(err.message || 'Không thể tải dữ liệu từ hệ thống.');
    } finally {
      setDataLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && String(currentUser.role).toUpperCase() !== 'CUSTOMER') {
      loadWorkspaceData();
    }
  }, [currentUser, loadWorkspaceData]);

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthPage
        initialNotice={authNotice}
        onLoginSuccess={(user) => {
          setAuthNotice('');
          setCurrentUser(user);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  const uiRole = normalizeUiRole(currentUser.role);

  if (uiRole === 'Customer') {
    return (
      <CustomerPortal
        currentUser={currentUser}
        onLogout={() => handleLogout('Bạn đã đăng xuất khỏi hệ thống.')}
      />
    );
  }

  const safeTab =
    uiRole !== 'Admin' && (activeTab === 'users' || activeTab === 'packages')
      ? 'dashboard'
      : activeTab;

  const renderPage = () => {
    if (safeTab === 'dashboard') {
      return (
        <Dashboard
          rooms={rooms}
          devices={devices}
          alerts={alerts}
          onRefresh={loadWorkspaceData}
        />
      );
    }
    if (safeTab === 'rooms-trays') {
      return <RoomsAndTrays rooms={rooms} onRefresh={loadWorkspaceData} />;
    }
    if (safeTab === 'rentals') {
      return <RentalRequests rooms={rooms} trays={trays} onRefresh={loadWorkspaceData} />;
    }
    if (safeTab === 'devices') {
      return <Devices rooms={rooms} devices={devices} onRefresh={loadWorkspaceData} />;
    }
    if (safeTab === 'thresholds') {
      return (
        <Thresholds
          thresholds={thresholds}
          alerts={alerts}
          onRefresh={loadWorkspaceData}
        />
      );
    }
    if (safeTab === 'growth') {
      return <GrowthTracking rooms={rooms} trays={trays} onRefresh={loadWorkspaceData} />;
    }
    if (safeTab === 'harvest') {
      return <Harvest rooms={rooms} trays={trays} onRefresh={loadWorkspaceData} />;
    }
    if (safeTab === 'users') {
      return <Users currentRole={uiRole} />;
    }
    if (safeTab === 'packages') {
      return <Packages currentRole={uiRole} />;
    }
    return null;
  };

  return (
    <AdminLayout
      activeTab={safeTab}
      setActiveTab={setActiveTab}
      title={PAGE_TITLES[safeTab] || 'Tổng quan'}
      role={uiRole}
    >
      <div className="mb-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            Đăng nhập: <strong>{currentUser.full_name || currentUser.name}</strong> ({currentUser.email}) • Quyền:{' '}
            <strong className="text-emerald-700">{uiRole}</strong>
          </span>
          {dataLoading && (
            <span className="text-blue-600 font-medium">• Đang đồng bộ dữ liệu...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadWorkspaceData}
            disabled={dataLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
          >
            Làm mới dữ liệu
          </button>
          <button
            type="button"
            onClick={() => handleLogout('Bạn đã đăng xuất khỏi hệ thống.')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {dataError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span>{dataError}</span>
          <button
            type="button"
            onClick={loadWorkspaceData}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {renderPage()}
    </AdminLayout>
  );
}
