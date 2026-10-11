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
        title: 'Mushroom-IoT SaaS',
        theme: ThemeData.dark(useMaterial3: true).copyWith(
          scaffoldBackgroundColor: const Color(0xFF060B13),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF0E1A2D),
            elevation: 0,
            titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: const Color(0xFF0E1A2D),
            indicatorColor: const Color(0x3310B981),
            iconTheme: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return const IconThemeData(color: Color(0xFF34D399));
              }
              return const IconThemeData(color: Colors.white60);
            }),
          ),
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF10B981), brightness: Brightness.dark),
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
