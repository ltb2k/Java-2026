import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TrayDetailScreen extends StatefulWidget {
  final Map<String, dynamic> tray;
  final Map<String, dynamic>? sensors;

  const TrayDetailScreen({super.key, required this.tray, this.sensors});

  @override
  State<TrayDetailScreen> createState() => _TrayDetailScreenState();
}

class _TrayDetailScreenState extends State<TrayDetailScreen> {
  final _api = ApiService();
  late Future<List<dynamic>> _logsFuture;

  @override
  void initState() {
    super.initState();
    final trayId = (widget.tray['id'] as num).toInt();
    _logsFuture = _api.growthLogs(trayId);
  }

  @override
  Widget build(BuildContext context) {
    final tray = widget.tray;
    final temp = widget.sensors?['temperature']?['value'];
    final hum = widget.sensors?['humidity']?['value'];
    final co2 = widget.sensors?['co2']?['value'];

    return Scaffold(
      appBar: AppBar(
        title: Text('Khay ${tray['code'] ?? ''}'),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Thông số môi trường từ Backend IoT',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildSensorCard('Nhiệt độ', '${temp ?? '--'}°C', Icons.thermostat, Colors.orange),
                const SizedBox(width: 10),
                _buildSensorCard('Độ ẩm', '${hum ?? '--'}%', Icons.water_drop, Colors.blue),
                const SizedBox(width: 10),
                _buildSensorCard('CO₂', '${co2 ?? '--'} ppm', Icons.air, Colors.teal),
              ],
            ),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Loại nấm: ${tray['mushroom_variety'] ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text('Phòng: ${tray['room_name'] ?? ''}'),
                    Text('Giai đoạn: ${tray['growth_stage'] ?? ''}'),
                    Text('Ngày tuổi: ${tray['growth_day'] ?? 0} / ${tray['growth_total_days'] ?? 30} ngày'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Nhật ký sinh trưởng',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            FutureBuilder<List<dynamic>>(
              future: _logsFuture,
              builder: (context, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) {
                  return Text('Không tải được nhật ký: ${snap.error}');
                }
                final logs = snap.data ?? [];
                if (logs.isEmpty) {
                  return const Text('Chưa có nhật ký chuyển giai đoạn.');
                }
                return Column(
                  children: logs.map((l) {
                    final item = Map<String, dynamic>.from(l as Map);
                    return Card(
                      child: ListTile(
                        title: Text('${item['previous_stage'] ?? '—'} → ${item['new_stage'] ?? ''}'),
                        subtitle: Text('${item['notes'] ?? ''}'),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorCard(String title, String val, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Icon(icon, color: color),
              const SizedBox(height: 6),
              Text(val, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
