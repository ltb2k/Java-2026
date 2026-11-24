import React, { useState } from 'react';
import RoomsAndTrays from './pages/rooms-trays/RoomsAndTrays';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/dashboard/Dashboard';
import RentalRequests from './pages/rental-requests/RentalRequests';
import Devices from './pages/devices/Devices';
import Thresholds from './pages/thresholds/Thresholds';
import GrowthTracking from './pages/growth/GrowthTracking';
import Harvest from './pages/harvest/Harvest';
import Users from './pages/users/Users';
import Packages from './pages/packages/Packages';
import AuthPage from './pages/auth/AuthPage';
import CustomerPortal from './pages/customer/CustomerPortal';

const INITIAL_ROOMS_DATA = [
  {
    id: 1,
    name: 'Phòng Nấm Linh Chi - Khu A',
    code: 'ROOM-A1',
    mushroom: 'Nấm Linh Chi',
    capacity: 24,
    status: 'NORMAL',
    alert: null,
    trays: [
      {
        id: 'T-A01',
        mushroom: 'Nấm Linh Chi',
        day: 22,
        status: 'Đang nuôi',
        renter: 'Khách thuê #102',
      },
      {
        id: 'T-A02',
        mushroom: 'Nấm Linh Chi',
        day: 45,
        status: 'Sẵn sàng thu hoạch',
        renter: 'Khách thuê #105',
      },
      {
        id: 'T-A03',
        mushroom: '-',
        day: 0,
        status: 'Trống',
        renter: '-',
      },
      {
        id: 'T-A04',
        mushroom: 'Nấm Linh Chi',
        day: 12,
        status: 'Đang nuôi',
        renter: 'Khách thuê #108',
      },
    ],
  },
  {
    id: 2,
    name: 'Phòng Nấm Bào Ngư - Khu B',
    code: 'ROOM-B1',
    mushroom: 'Nấm Bào Ngư',
    capacity: 30,
    status: 'WARNING',
    alert: 'Nhiệt độ phòng vượt ngưỡng cài đặt',
    trays: [
      {
        id: 'T-B01',
        mushroom: 'Nấm Bào Ngư',
        day: 15,
        status: 'Đang nuôi',
        renter: 'Khách thuê #110',
      },
      {
        id: 'T-B02',
        mushroom: 'Nấm Bào Ngư',
        day: 15,
        status: 'Đang nuôi',
        renter: 'Khách thuê #111',
      },
      {
        id: 'T-B03',
        mushroom: '-',
        day: 0,
        status: 'Trống',
        renter: '-',
      },
    ],
  },
];

const INITIAL_DEVICES_DATA = [
  {
    id: 'DEV-01',
    name: 'Cảm biến Nhiệt độ & Độ ẩm DHT22',
    type: 'sensor',
    roomId: 1,
    mac: 'AA:BB:CC:11:22:01',
    status: 'online',
    isOn: true,
    reading: '26.5°C | 84%',
    lastUpdate: 'Vừa xong',
  },
  {
    id: 'DEV-02',
    name: 'Hệ thống Phun sương tự động',
    type: 'actuator',
    roomId: 1,
    mac: 'AA:BB:CC:11:22:02',
    status: 'online',
    isOn: true,
    reading: 'Đang phun (70%)',
    lastUpdate: '1 phút trước',
  },
  {
    id: 'DEV-03',
    name: 'Quạt thông gió đối lưu',
    type: 'actuator',
    roomId: 2,
    mac: 'AA:BB:CC:11:22:03',
    status: 'online',
    isOn: false,
    reading: 'Đang tắt',
    lastUpdate: '3 phút trước',
  },
  {
    id: 'DEV-04',
    name: 'Cảm biến nồng độ CO2',
    type: 'sensor',
    roomId: 2,
    mac: 'AA:BB:CC:11:22:04',
    status: 'offline',
    isOn: false,
    reading: '-- ppm',
    lastUpdate: '2 giờ trước',
  },
];

const INITIAL_THRESHOLDS_DATA = {
  1: {
    tempMin: 22,
    tempMax: 28,
    humidityMin: 80,
    humidityMax: 90,
    co2Min: 600,
    co2Max: 1200,
    substrateMin: 55,
    substrateMax: 70,
  },
  2: {
    tempMin: 18,
    tempMax: 24,
    humidityMin: 82,
    humidityMax: 92,
    co2Min: 500,
    co2Max: 1000,
    substrateMin: 58,
    substrateMax: 72,
  },
};

const INITIAL_ACCOUNTS = [
  {
    id: 'USR-01',
    fullName: 'Quản trị viên hệ thống',
    email: 'admin@mushroom.vn',
    phone: '0901000001',
    password: '123456',
    role: 'Admin',
    accountType: 'Nhân viên',
    status: 'Hoạt động',
  },
  {
    id: 'USR-02',
    fullName: 'Nhân viên vận hành trại',
    email: 'operator@mushroom.vn',
    phone: '0901000002',
    password: '123456',
    role: 'Operator',
    accountType: 'Nhân viên',
    status: 'Hoạt động',
  },
  {
    id: 'USR-03',
    fullName: 'Khách thuê #105',
    email: 'khach105@mushroom.vn',
    phone: '0901000105',
    password: '123456',
    role: 'Customer',
    accountType: 'Khách hàng',
    status: 'Hoạt động',
  },
  {
    id: 'USR-04',
    fullName: 'Tài khoản tạm khóa',
    email: 'locked@mushroom.vn',
    phone: '0901000999',
    password: '123456',
    role: 'Operator',
    accountType: 'Nhân viên',
    status: 'Không hoạt động',
  },
];

const INITIAL_SHARED_PACKAGES = [
  {
    id: 'PKG-01',
    name: 'Gói Trải Nghiệm Bào Ngư 30 Ngày',
    mushroomType: 'Nấm Bào Ngư',
    durationDays: 30,
    trayCount: 1,
    price: 350000,
    status: 'Đang áp dụng',
    description:
      'Phù hợp cho khách hàng trải nghiệm thuê 1 khay nấm bào ngư, theo dõi nhiệt độ/độ ẩm trực tuyến và nhận thành phẩm cuối kỳ.',
  },
  {
    id: 'PKG-02',
    name: 'Gói Linh Chi Tiêu Chuẩn 45 Ngày',
    mushroomType: 'Nấm Linh Chi',
    durationDays: 45,
    trayCount: 1,
    price: 650000,
    status: 'Đang áp dụng',
    description:
      'Chu kỳ nuôi trồng 45 ngày dành cho nấm Linh Chi với chế độ kiểm soát môi trường tự động và cập nhật sinh trưởng định kỳ.',
  },
  {
    id: 'PKG-03',
    name: 'Gói Gia Đình 3 Khay Linh Hoạt',
    mushroomType: 'Nấm Bào Ngư / Linh Chi',
    durationDays: 45,
    trayCount: 3,
    price: 1590000,
    status: 'Đang áp dụng',
    description:
      'Gói tiết kiệm cho hộ gia đình hoặc nhóm khách thuê đồng thời 3 khay, tùy chọn kết hợp loại nấm theo phòng nuôi.',
  },
];

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

const PAGE_DESCRIPTIONS = {
  'rooms-trays': 'Quản lý phòng nuôi, khay nấm và trạng thái sử dụng.',
  rentals: 'Theo dõi và xử lý các yêu cầu thuê khay của khách hàng.',
  devices: 'Theo dõi trạng thái và điều khiển các thiết bị trong phòng nuôi.',
  thresholds: 'Thiết lập các ngưỡng nhiệt độ, độ ẩm và nồng độ CO₂.',
  growth: 'Theo dõi quá trình sinh trưởng và phát triển của nấm.',
  harvest: 'Cập nhật thông tin và theo dõi quá trình thu hoạch nấm.',
  users: 'Quản lý tài khoản và phân quyền người dùng trong hệ thống.',
  packages: 'Quản lý các gói thuê khay và thông tin dịch vụ.',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('Operator');
  const [rooms, setRooms] = useState(INITIAL_ROOMS_DATA);
  const [devices, setDevices] = useState(INITIAL_DEVICES_DATA);
  const [thresholds, setThresholds] = useState(INITIAL_THRESHOLDS_DATA);
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [sharedPackages] = useState(INITIAL_SHARED_PACKAGES);

  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  const handleToggleRole = () => {
    setRole((prevRole) =>
      prevRole === 'Operator' ? 'Admin' : 'Operator'
    );

    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthScreen(false);
    if (user.role === 'Admin' || user.role === 'Operator') {
      setRole(user.role);
      setActiveTab('dashboard');
      setAuthNotice(
        `Đã đăng nhập bằng tài khoản ${user.fullName} (${user.role}).`
      );
    }
  };

  const handleRegisterCustomer = (newCustomer) => {
    setAccounts((prev) => [newCustomer, ...prev]);
    setCurrentUser(newCustomer);
    setShowAuthScreen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRole('Operator');
    setActiveTab('dashboard');
    setAuthNotice('');
    setShowAuthScreen(true);
  };

  if (currentUser?.role === 'Customer') {
    return (
      <CustomerPortal
        currentUser={currentUser}
        packages={sharedPackages}
        onLogout={handleLogout}
      />
    );
  }

  if (showAuthScreen) {
    return (
      <AuthPage
        accounts={accounts}
        onLoginSuccess={handleLoginSuccess}
        onRegisterCustomer={handleRegisterCustomer}
        onBackToWorkspace={() => setShowAuthScreen(false)}
      />
    );
  }

  const renderPage = () => {
    if (activeTab === 'dashboard') {
      return <Dashboard />;
    }

    if (activeTab === 'rooms-trays') {
      return <RoomsAndTrays rooms={rooms} setRooms={setRooms} />;
    }

    if (activeTab === 'rentals') {
      return <RentalRequests rooms={rooms} setRooms={setRooms} />;
    }

    if (activeTab === 'devices') {
      return (
        <Devices
          rooms={rooms}
          devices={devices}
          setDevices={setDevices}
        />
      );
    }

    if (activeTab === 'thresholds') {
      return (
        <Thresholds
          rooms={rooms}
          devices={devices}
          thresholds={thresholds}
          setThresholds={setThresholds}
        />
      );
    }

    if (activeTab === 'growth') {
      return <GrowthTracking rooms={rooms} setRooms={setRooms} />;
    }

    if (activeTab === 'harvest') {
      return <Harvest rooms={rooms} setRooms={setRooms} />;
    }

    if (activeTab === 'users') {
      return <Users currentRole={role} />;
    }

    if (activeTab === 'packages') {
      return <Packages currentRole={role} />;
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          {PAGE_TITLES[activeTab] || 'Chức năng'}
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          {PAGE_DESCRIPTIONS[activeTab] ||
            'Chức năng đang được phát triển.'}
        </p>

        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Trang này hiện đang trong quá trình xây dựng.
            Nội dung sẽ được bổ sung trong các bước phát triển tiếp theo.
          </p>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={PAGE_TITLES[activeTab] || 'Tổng quan'}
      role={role}
      onToggleRole={handleToggleRole}
    >
      <div className="mb-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="text-xs text-gray-600">
          {authNotice ? (
            <span className="text-emerald-700 font-medium">{authNotice}</span>
          ) : (
            <span>
              Luồng xác thực: Nhân viên do Admin cấp quyền • Khách hàng tự đăng
              ký qua Email/SĐT + xác thực OTP.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentUser && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Đăng xuất
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAuthScreen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            Đăng nhập / Đăng ký OTP
          </button>
        </div>
      </div>

      {renderPage()}
    </AdminLayout>
  );
}