import 'package:flutter/material.dart';
import '../services/api_service.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  final api = ApiService();
  late Future<List<dynamic>> traysFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      traysFuture = api.availableTrays();
    });
  }

  void _showRentModal(BuildContext context, Map<String, dynamic> tray) async {
    List<dynamic> packages = [];
    try {
      packages = await api.packages();
    } catch (_) {}

    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0E1A2D),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        String? selectedPkgId = packages.isNotEmpty ? packages.first['id'] as String? : null;
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final selectedPkg = packages.firstWhere(
              (p) => p['id'] == selectedPkgId,
              orElse: () => null,
            );

            return Padding(
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
                      Text(
                        'Thuê khay ${tray['code'] ?? ''}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close, color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Giống nấm: ${tray['mushroom_type'] ?? ''}',
                    style: const TextStyle(fontSize: 14, color: Color(0xFF34D399), fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 18),
                  const Text('Chọn gói dịch vụ nuôi trồng:', style: TextStyle(fontSize: 13, color: Colors.white70)),
                  const SizedBox(height: 8),
                  if (packages.isEmpty)
                    const Text('Chưa có gói thuê khả dụng.', style: TextStyle(color: Colors.redAccent))
                  else
                    ...packages.map((pkg) {
                      final isSelected = pkg['id'] == selectedPkgId;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF132A44) : const Color(0xFF091424),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF10B981) : Colors.white12,
                            width: isSelected ? 1.5 : 1,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: RadioListTile<String>(
                          value: pkg['id'] as String,
                          groupValue: selectedPkgId,
                          activeColor: const Color(0xFF10B981),
                          onChanged: (val) => setModalState(() => selectedPkgId = val),
                          title: Text(
                            '${pkg['name']} (${pkg['duration_days']} ngày)',
                            style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
                          ),
                          subtitle: Text(
                            '${NumberFormat.currency(pkg['price'])} · Chăm sóc tự động',
                            style: const TextStyle(color: Colors.white60, fontSize: 12),
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: selectedPkgId == null
                          ? null
                          : () async {
                              try {
                                await api.rent(trayId: tray['id'], packageId: selectedPkgId!);
                                if (ctx.mounted) Navigator.pop(ctx);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Đã thuê khay ${tray['code']} thành công!')),
                                  );
                                  _load();
                                }
                              } catch (e) {
                                if (ctx.mounted) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.redAccent),
                                  );
                                }
                              }
                            },
                      child: const Text('Xác nhận thuê khay', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Thuê khay nấm trực tuyến'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
          ],
        ),
        body: FutureBuilder<List<dynamic>>(
          future: traysFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('Không tải được danh sách: ${snapshot.error}', style: const TextStyle(color: Colors.redAccent)),
                ),
              );
            }
            final trays = snapshot.data ?? [];
            if (trays.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('Hiện chưa có khay trống nào.', style: TextStyle(color: Colors.white70)),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: trays.length,
              itemBuilder: (context, index) {
                final tray = Map<String, dynamic>.from(trays[index] as Map);
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0E1A2D),
                    border: Border.all(color: Colors.white12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF064E3B),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.spa, color: Color(0xFF34D399)),
                    ),
                    title: Text(
                      '${tray['code'] ?? ''}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                    ),
                    subtitle: Text(
                      '${tray['mushroom_type'] ?? ''} · Phòng ${tray['room_name'] ?? '01'}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                    trailing: FilledButton.tonal(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF065F46),
                        foregroundColor: const Color(0xFF34D399),
                      ),
                      onPressed: () => _showRentModal(context, tray),
                      child: const Text('Thuê ngay'),
                    ),
                  ),
                );
              },
            );
          },
        ),
      );
}

class NumberFormat {
  static String currency(dynamic value) {
    final num = int.tryParse(value?.toString() ?? '0') ?? 0;
    return '${num.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')} ₫';
  }
}
