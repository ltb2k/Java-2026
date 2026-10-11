import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';
import 'services/api_service.dart';

void main() => runApp(const MushroomApp());

class MushroomApp extends StatelessWidget {
  const MushroomApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Mushroom-IoT',
        theme: ThemeData.dark(useMaterial3: true).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal, brightness: Brightness.dark),
        ),
        home: const AuthGate(),
      );
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final api = ApiService();
  bool loading = true;
  bool signedIn = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    final user = await api.currentUser();
    setState(() {
      signedIn = user != null;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!signedIn) {
      return LoginScreen(onLoggedIn: () => setState(() => signedIn = true));
    }
    return ShellScreen(onLogout: () async {
      await api.logout();
      setState(() => signedIn = false);
    });
  }
}
