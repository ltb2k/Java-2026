import 'package:flutter/material.dart';
import '../services/api_service.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Thuê khay')),
        body: FutureBuilder<List<dynamic>>(
          future: ApiService().availableTrays(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError) return Center(child: Text('Không tải được danh sách khay: ${snapshot.error}'));
            final trays = snapshot.data ?? [];
            if (trays.isEmpty) return const Center(child: Text('Hiện chưa có khay trống.'));
            return ListView.builder(
              itemCount: trays.length,
              itemBuilder: (context, index) {
                final tray = Map<String, dynamic>.from(trays[index] as Map);
                return ListTile(title: Text('${tray['code'] ?? ''}'), subtitle: Text('${tray['mushroom_type'] ?? ''}'));
              },
            );
          },
        ),
      );
