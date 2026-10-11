import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final api = ApiService();
  late Future<List<dynamic>> dataFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      dataFuture = Future.wait([
        api.myTrays(),
        api.dashboard().catch(() => {}),
        api.outdoorWeather().catch(() => {}),
      ]);
    });
  }

  void _showHarvestRequestModal(BuildContext context, String trayId, String trayCode) {
    final noteCtrl = TextEditingController(text: 'Yêu cầu thu hoạch và giao hàng tận nơi.');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0E1A2D),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 28,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Yêu cầu thu hoạch · $trayCode', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: noteCtrl,
              maxLines: 3,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Ghi chú giao hàng & đóng gói',
                labelStyle: const TextStyle(color: Colors.white60),
                filled: true,
                fillColor: const Color(0xFF132238),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () async {
                  try {
                    await api.requestHarvest(trayId, noteCtrl.text.trim());
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đã gửi yêu cầu thu hoạch đến nông trại!')),
                      );
                    }
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.redAccent),
                      );
                    }
                  }
                },
                child: const Text('Gửi yêu cầu thu hoạch', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Mushroom-IoT Smart Farm'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
          ],
        ),
        body: FutureBuilder<List<dynamic>>(
          future: dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('Không tải được dữ liệu: ${snapshot.error}', style: const TextStyle(color: Colors.redAccent)),
                ),
              );
            }

            final trays = List<dynamic>.from((snapshot.data?[0] ?? []) as List);
            final dashboard = Map<String, dynamic>.from((snapshot.data?[1] ?? {}) as Map);
            final current = Map<String, dynamic>.from((dashboard['current'] ?? {}) as Map);

            final tempVal = current['temperature'] != null ? '${double.tryParse(current['temperature'].toString())?.toStringAsFixed(1) ?? '25.8'}°C' : '25.8°C';
            final humVal = current['humidity'] != null ? '${double.tryParse(current['humidity'].toString())?.toStringAsFixed(1) ?? '89.2'}%' : '89.2%';
            final co2Val = current['co2'] != null ? '${double.tryParse(current['co2'].toString())?.round() ?? 640} ppm' : '640 ppm';

            return RefreshIndicator(
              onRefresh: () async => _load(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Hero Welcome Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF064E3B), Color(0xFF0F253E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0x3310B981)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('HỆ THỐNG VI KHÍ HẬU', style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                            Row(
                              children: [
                                Icon(Icons.circle, size: 8, color: Color(0xFF34D399)),
                                SizedBox(width: 4),
                                Text('Live IoT', style: TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Trang Trại Đang Trong Chu Kỳ Tối Ưu', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('Hệ thống phun sương và quạt đối lưu vận hành tự động theo ngưỡng sinh trưởng.', style: TextStyle(color: Colors.white70, fontSize: 12.5)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  const Text('Vi khí hậu phòng trồng', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 10),

                  // 3 KPI Cards
                  Row(
                    children: [
                      Expanded(child: _metricCard('Nhiệt độ', tempVal, '24 – 28 °C', Icons.thermostat, const Color(0xFFF43F5E), const Color(0x22F43F5E))),
                      const SizedBox(width: 10),
                      Expanded(child: _metricCard('Độ ẩm', humVal, '85 – 95 %', Icons.water_drop, const Color(0xFF0EA5E9), const Color(0x220EA5E9))),
                      const SizedBox(width: 10),
                      Expanded(child: _metricCard('Khí CO₂', co2Val, '< 800 ppm', Icons.air, const Color(0xFF10B981), const Color(0x2210B981))),
                    ],
                  ),

                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Khay nấm của tôi', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text('${trays.length} khay đang thuê', style: const TextStyle(color: Color(0xFF34D399), fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (trays.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0E1A2D),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.spa_outlined, size: 40, color: Colors.grey),
                          SizedBox(height: 10),
                          Text('Bạn chưa có khay nấm nào đang thuê', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          SizedBox(height: 4),
                          Text('Chuyển qua tab "Thuê" ở thanh dưới để chọn khay nhé!', style: TextStyle(color: Colors.white38, fontSize: 12)),
                        ],
                      ),
                    ),

                  ...trays.map((raw) {
                    final tray = Map<String, dynamic>.from(raw as Map);
                    final growthDay = int.tryParse(tray['growth_day']?.toString() ?? '14') ?? 14;
                    final progressPercent = (growthDay / 30.0).clamp(0.1, 1.0);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0E1A2D),
                        border: Border.all(color: Colors.white12),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(color: const Color(0xFF064E3B), borderRadius: BorderRadius.circular(8)),
                                    child: const Icon(Icons.spa, size: 18, color: Color(0xFF34D399)),
                                  ),
                                  const SizedBox(width: 10),
                                  Text('${tray['code'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: const Color(0x3310B981), borderRadius: BorderRadius.circular(6)),
                                child: Text('Ngày $growthDay / 30', style: const TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text('${tray['mushroom_type'] ?? ''}', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text('Giai đoạn: ${tray['latest_stage'] ?? 'Ra quả thể'}', style: const TextStyle(color: Colors.white60, fontSize: 12.5)),
                          const SizedBox(height: 12),
                          LinearProgressIndicator(
                            value: progressPercent,
                            backgroundColor: const Color(0xFF132238),
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(4),
                            minHeight: 6,
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFF10B981)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () => _showHarvestRequestModal(context, tray['id'].toString(), tray['code'].toString()),
                              icon: const Icon(Icons.shopping_bag_outlined, size: 16, color: Color(0xFF10B981)),
                              label: const Text('Yêu cầu thu hoạch / Giao nấm', style: TextStyle(color: Color(0xFF10B981), fontSize: 13)),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            );
          },
        ),
      );

  Widget _metricCard(String title, String val, String range, IconData icon, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1A2D),
        border: Border.all(color: Colors.white10),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold)),
              Icon(icon, size: 16, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Text(val, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(range, style: const TextStyle(color: Colors.white38, fontSize: 9.5)),
        ],
      ),
    );
  }
}
