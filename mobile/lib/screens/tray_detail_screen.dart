import 'package:flutter/material.dart';
import '../models/mushroom_models.dart';

class TrayDetailScreen extends StatelessWidget {
  final CustomerTray tray;

  const TrayDetailScreen({super.key, required this.tray});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Khay ${tray.trayCode}'),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 190,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.videocam, color: Colors.white70, size: 42),
                        SizedBox(height: 8),
                        Text(
                          'Camera trực tiếp tại Phòng nuôi',
                          style: TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        '● LIVE',
                        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Thông số môi trường (IoT Real-time)',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildSensorCard('Nhiệt độ', '${tray.temperature}°C', Icons.thermostat, Colors.orange),
                const SizedBox(width: 10),
                _buildSensorCard('Độ ẩm', '${tray.humidity}%', Icons.water_drop, Colors.blue),
                const SizedBox(width: 10),
                _buildSensorCard('CO₂', '${tray.co2Level} ppm', Icons.air, Colors.teal),
              ],
            ),
            const SizedBox(height: 20),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Loại nấm: ${tray.mushroomType}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text('Vị trí: ${tray.roomName}'),
                    Text('Giai đoạn hiện tại: ${tray.growthStage}'),
                    Text('Dự kiến thu hoạch: ${tray.expectedHarvestDate}'),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: tray.progressPercent / 100,
                      minHeight: 10,
                      borderRadius: BorderRadius.circular(8),
                      color: const Color(0xFF2E7D32),
                    ),
                    const SizedBox(height: 6),
                    Text('Tiến độ sinh trưởng: ${tray.progressPercent}%'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Đã gửi yêu cầu thu hoạch cho khay ${tray.trayCode}!')),
                  );
                },
                icon: const Icon(Icons.shopping_bag_outlined),
                label: const Text('GỬI YÊU CẦU THU HOẠCH / GIAO HÀNG'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            ],
          ),
        ),
      ),
    );
  }
}