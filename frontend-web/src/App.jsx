import React, { useState } from 'react';
import RoomsAndTrays from './pages/rooms-trays/RoomsAndTrays';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/dashboard/Dashboard';
import RentalRequests from './pages/rental-requests/RentalRequests';

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

  const handleToggleRole = () => {
    setRole((prevRole) =>
      prevRole === 'Operator' ? 'Admin' : 'Operator'
    );

    setActiveTab('dashboard');
  };

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
      {renderPage()}
    </AdminLayout>
  );
}