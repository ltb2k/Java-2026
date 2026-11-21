import 'package:flutter/material.dart';
import '../models/mushroom_models.dart';
import 'login_screen.dart';
import 'tray_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<RentalPackage> _packages = [
    RentalPackage(
      id: 'PKG-01',
      name: 'Gói Nấm Bào Ngư Xám Tiêu Chuẩn',
      mushroomType: 'Nấm Bào Ngư Xám',
      durationDays: 30,
      price: 350000,
      description: 'Bao gồm 1 khay 10 phôi nấm, chăm sóc tự động IoT & thu hoạch 2-3 đợt.',
    ),
    RentalPackage(
      id: 'PKG-02',
      name: 'Gói Nấm Linh Chi Đỏ Cao Cấp',
      mushroomType: 'Nấm Linh Chi Đỏ',
      durationDays: 60,
      price: 750000,
      description: 'Kiểm soát vi khí hậu 24/7, theo dõi qua camera trực tiếp & đóng gói dược liệu.',
    ),
    RentalPackage(
      id: 'PKG-03',
      name: 'Gói Nấm Mối Đen Công Nghệ Cao',
      mushroomType: 'Nấm Mối Đen',
      durationDays: 45,
      price: 620000,
      description: 'Giám sát CO₂ và độ ẩm chính xác cao, cam kết sản lượng thu hoạch.',
    ),
  ];

  final List<CustomerTray> _myTrays = [
    CustomerTray(
      trayCode: 'TRAY-A102',
      mushroomType: 'Nấm Bào Ngư Xám',
      roomName: 'Phòng Nuôi Khu A - Tầng 1',
      growthStage: 'Đang ra quả thể (Sắp thu hoạch)',
      progressPercent: 80,
      expectedHarvestDate: '24/11/2026',
      temperature: 26.5,
      humidity: 88.0,
      co2Level: 650,
    ),
    CustomerTray(
      trayCode: 'TRAY-B205',
      mushroomType: 'Nấm Linh Chi Đỏ',
      roomName: 'Phòng Nuôi Khu B - Tầng 2',
      growthStage: 'Ươm tơ giai đoạn 2',
      progressPercent: 45,
      expectedHarvestDate: '15/12/2026',
      temperature: 27.2,
      humidity: 82.5,
      co2Level: 720,
    ),
  ];

final _rentalHistory = [
    {
      'orderId': 'ORD-20261025',
      'package': 'Gói Nấm Bào Ngư Xám (Khay TRAY-A102)',
      'date': '25/10/2026',
      'amount': '350.000 VNĐ',
      'status': 'Đang nuôi trồng',
    },
    {
      'orderId': 'ORD-20261015',
      'package': 'Gói Nấm Linh Chi Đỏ (Khay TRAY-B205)',
      'date': '15/10/2026',
      'amount': '750.000 VNĐ',
      'status': 'Đang nuôi trồng',
    },
    {
      'orderId': 'ORD-20260901',
      'package': 'Gói Nấm Bào Ngư Xám (Khay TRAY-A098)',
      'date': '01/09/2026',
      'amount': '350.000 VNĐ',
      'status': 'Đã thu hoạch xong',
    },
  ];

  void _showLinkTrayDialog() {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Liên kết mã khay mới'),
        content: TextField(
          controller: codeController,
          decoration: const InputDecoration(
            labelText: 'Nhập mã định danh khay (VD: TRAY-C301)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              if (codeController.text.trim().isNotEmpty) {
                setState(() {
                  _myTrays.add(
                    CustomerTray(
                      trayCode: codeController.text.trim().toUpperCase(),
                      mushroomType: 'Nấm Bào Ngư Xám',
                      roomName: 'Phòng Nuôi Khu C',
                      growthStage: 'Mới khởi tạo',
                      progressPercent: 10,
                      expectedHarvestDate: '20/12/2026',
                      temperature: 26.0,
                      humidity: 85.0,
                      co2Level: 600,
                    ),
                  );
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Liên kết khay thành công!')),
                );
              }
            },
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildPackagesTab(),
      _buildMyTraysTab(),
      _buildProfileTab(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Mushroom Farm'),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
        actions: [
          if (_selectedIndex == 1)
            IconButton(
              icon: const Icon(Icons.qr_code_scanner),
              tooltip: 'Liên kết mã khay',
              onPressed: _showLinkTrayDialog,
            ),
        ],
      ),
      body: pages[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.storefront), label: 'Gói thuê'),
          NavigationDestination(icon: Icon(Icons.grass), label: 'Khay của tôi'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Tài khoản'),
        ],
      ),
    );
  }

  Widget _buildPackagesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _packages.length,
      itemBuilder: (context, index) {
        final pkg = _packages[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        pkg.name,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Chip(
                      label: Text('${pkg.durationDays} ngày'),
                      backgroundColor: Colors.green[50],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(pkg.description, style: TextStyle(color: Colors.grey[700])),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${pkg.price.toStringAsFixed(0)} VNĐ',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2E7D32),
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2E7D32),
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        setState(() {
                          _rentalHistory.insert(0, {
                            'orderId': 'ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                            'package': pkg.name,
                            'date': 'Hôm nay',
                            'amount': '${pkg.price.toStringAsFixed(0)} VNĐ',
                            'status': 'Chờ xác nhận thanh toán',
                          });
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Đã đặt thuê & lưu vào lịch sử giao dịch: ${pkg.name}')),
                        );
                      },
                      child: const Text('Thuê ngay'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMyTraysTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _myTrays.length,
      itemBuilder: (context, index) {
        final tray = _myTrays[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: Colors.green[100],
              child: const Icon(Icons.eco, color: Color(0xFF2E7D32)),
            ),
            title: Text('${tray.trayCode} • ${tray.mushroomType}',
                style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                '${tray.growthStage}\nNhiệt độ: ${tray.temperature}°C | Độ ẩm: ${tray.humidity}%',
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => TrayDetailScreen(tray: tray)),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildProfileTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const ListTile(
          leading: CircleAvatar(radius: 26, child: Icon(Icons.person, size: 30)),
          title: Text('Khách hàng Demo', style: TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text('customer@mushroom.local'),
        ),
        const Divider(),
        const ListTile(
          leading: Icon(Icons.notifications_active, color: Colors.orange),
          title: Text('Thông báo cảnh báo môi trường'),
          subtitle: Text('Khay TRAY-A102: Độ ẩm đạt chuẩn 88%, sẵn sàng thu hoạch.'),
        ),
        const Divider(),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: Text(
            'Lịch sử thuê & Giao dịch',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        ..._rentalHistory.map(
          (item) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              leading: const Icon(Icons.receipt_long, color: Color(0xFF2E7D32)),
              title: Text(item['package']!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: Text('Mã đơn: ${item['orderId']} • Ngày: ${item['date']}\nTrạng thái: ${item['status']}'),
              trailing: Text(
                item['amount']!,
                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2E7D32)),
              ),
              isThreeLine: true,
            ),
          ),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Đăng xuất', style: TextStyle(color: Colors.red)),
          onTap: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const LoginScreen()),
            );
          },
        ),
      ],
    );
  }
}