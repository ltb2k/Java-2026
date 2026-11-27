import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Thông báo & Cảnh báo')),
        body: FutureBuilder<List<dynamic>>(
          future: ApiService().alerts(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(child: Text('Không tải được thông báo: ${snapshot.error}'));
            }
            final items = snapshot.data ?? [];
            if (items.isEmpty) return const Center(child: Text('Chưa có thông báo.'));
            return ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = Map<String, dynamic>.from(items[index] as Map);
                return ListTile(
                  leading: const Icon(Icons.notifications_active, color: Colors.amber),
                  title: Text('${item['title'] ?? ''}'),
                  subtitle: Text('${item['message'] ?? ''}'),
                );
              },
            );
          },
        ),
      );
}
