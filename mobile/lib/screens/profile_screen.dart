import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatelessWidget {
  final VoidCallback onLogout;
  const ProfileScreen({super.key, required this.onLogout});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Tài khoản')),
        body: FutureBuilder<Map<String, dynamic>>(
          future: ApiService().me(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(child: Text('Không tải được tài khoản: ${snapshot.error}'));
            }
            final user = snapshot.data ?? {};
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${user['full_name'] ?? user['name'] ?? ''}',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text('Email: ${user['email'] ?? ''}'),
                  Text('Vai trò: ${user['role'] ?? ''}'),
                  const Spacer(),
                  FilledButton.tonal(onPressed: onLogout, child: const Text('Đăng xuất')),
                ],
              ),
            );
          },
        ),
      );
}
