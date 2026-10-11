import 'package:flutter/material.dart';
import 'browse_screen.dart';
import 'home_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class ShellScreen extends StatefulWidget {
  final VoidCallback onLogout;
  const ShellScreen({super.key, required this.onLogout});
  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int index = 0;
  @override
  Widget build(BuildContext context) {
    final pages = [
      const HomeScreen(),
      const BrowseScreen(),
      const NotificationsScreen(),
      ProfileScreen(onLogout: widget.onLogout),
    ];
    return Scaffold(
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.spa_outlined), label: 'Khay'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), label: 'Thuê'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), label: 'Thông báo'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Tài khoản'),
        ],
      ),
    );
  }
}
