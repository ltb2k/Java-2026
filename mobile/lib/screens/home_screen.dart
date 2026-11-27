import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'tray_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiService();
  int _selectedIndex = 0;

  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _sensors;
  List<dynamic> _packages = [];
  List<dynamic> _trays = [];
  List<dynamic> _rentals = [];
  List<dynamic> _alerts = [];

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _api.me(),
        _api.packages(),
        _api.myTrays(),
        _api.rentals(),
        _api.latestSensors(),
        _api.alerts(),
      ]);
      if (!mounted) return;
      setState(() {
        _user = results[0] as Map<String, dynamic>;
        _packages = results[1] as List<dynamic>;
        _trays = results[2] as List<dynamic>;
        _rentals = results[3] as List<dynamic>;
        _sensors = results[4] as Map<String, dynamic>;
        _alerts = results[5] as List<dynamic>;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _rentPackage(Map<String, dynamic> pkg) async {
    try {
      final pkgId = (pkg['id'] as num).toInt();
      final res = await _api.createRental(packageId: pkgId, quantity: 1);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã gửi yêu cầu thuê #${res['id']} cho ${pkg['name']}!'),
          backgroundColor: Colors.green.shade700,
        ),
      );
      await _loadAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  Future<void> _logout() async {
    await _api.logout();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final titles = [
      'Gói thuê & Đăng ký',
      'Khay nấm của tôi',
      'Hợp đồng & Cảnh báo',
      'Tài khoản',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_selectedIndex]),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _loadAll,
            icon: const Icon(Icons.refresh),
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadAll, child: const Text('Thử lại')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAll,
                  child: _buildBody(),
                ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.storefront_outlined), label: 'Gói thuê'),
          NavigationDestination(icon: Icon(Icons.eco_outlined), label: 'Khay nấm'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Hợp đồng'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Tài khoản'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildPackagesTab();
      case 1:
        return _buildTraysTab();
      case 2:
        return _buildRentalsAndAlertsTab();
      case 3:
        return _buildProfileTab();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildPackagesTab() {
    if (_packages.isEmpty) {
      return const Center(child: Text('Chưa có gói thuê nào đang áp dụng.'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _packages.length,
      itemBuilder: (context, i) {
        final pkg = Map<String, dynamic>.from(_packages[i] as Map);
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${pkg['name'] ?? ''}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${pkg['price'] ?? 0} VNĐ • ${pkg['duration_days'] ?? 30} ngày',
                  style: const TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Text('${pkg['description'] ?? ''}'),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    onPressed: () => _rentPackage(pkg),
                    child: const Text('Đăng ký thuê'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTraysTab() {
    if (_trays.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Bạn chưa có khay nấm nào đang kích hoạt.'),
        ),
      );
    }
    final temp = _sensors?['temperature']?['value'];
    final hum = _sensors?['humidity']?['value'];
    final co2 = _sensors?['co2']?['value'];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _trays.length,
      itemBuilder: (context, i) {
        final tray = Map<String, dynamic>.from(_trays[i] as Map);
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text('${tray['code']} — ${tray['mushroom_variety'] ?? 'Nấm'}'),
            subtitle: Text(
              '${tray['room_name'] ?? ''} • Giai đoạn: ${tray['growth_stage'] ?? ''}\n'
              'Nhiệt độ: ${temp ?? '--'}°C | Độ ẩm: ${hum ?? '--'}% | CO₂: ${co2 ?? '--'} ppm',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TrayDetailScreen(tray: tray, sensors: _sensors),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildRentalsAndAlertsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Hợp đồng thuê', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (_rentals.isEmpty)
          const Text('Chưa có hợp đồng thuê nào.')
        else
          ..._rentals.map((r) {
            final item = Map<String, dynamic>.from(r as Map);
            return Card(
              child: ListTile(
                title: Text('#${item['id']} — ${item['package_name'] ?? ''}'),
                subtitle: Text('Trạng thái: ${item['status']} • SL: ${item['quantity']}'),
              ),
            );
          }),
        const SizedBox(height: 20),
        const Text('Cảnh báo môi trường', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (_alerts.isEmpty)
          const Text('Chưa có cảnh báo nào.')
        else
          ..._alerts.map((a) {
            final item = Map<String, dynamic>.from(a as Map);
            return Card(
              child: ListTile(
                leading: const Icon(Icons.notifications_active, color: Colors.amber),
                title: Text('${item['title'] ?? ''}'),
                subtitle: Text('${item['message'] ?? ''}'),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildProfileTab() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${_user?['full_name'] ?? _user?['name'] ?? 'Người dùng'}',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text('Email: ${_user?['email'] ?? ''}'),
          Text('Vai trò: ${_user?['role'] ?? ''}'),
          Text('Trạng thái: ${_user?['status'] ?? ''}'),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton.tonal(
              onPressed: _logout,
              child: const Text('Đăng xuất'),
            ),
          ),
        ],
      ),
    );
  }
}
