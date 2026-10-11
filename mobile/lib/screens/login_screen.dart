import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoggedIn;
  const LoginScreen({super.key, required this.onLoggedIn});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final api = ApiService();
  final fullName = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final phone = TextEditingController();
  bool register = false;
  bool loading = false;
  String? error;
  String? notice;

  Future<void> submit() async {
    setState(() { loading = true; error = null; notice = null; });
    try {
      if (register) {
        await api.register(fullName.text.trim(), email.text.trim(), password.text, phone.text.trim());
        setState(() { register = false; notice = 'Đăng ký thành công. Hãy đăng nhập.'; });
      } else {
        await api.login(email.text.trim(), password.text);
        widget.onLoggedIn();
      }
    } catch (e) {
      setState(() => error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 48),
              const Icon(Icons.spa, size: 64, color: Colors.tealAccent),
              const SizedBox(height: 12),
              const Text('MUSHROOM SMART FARM', textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(register ? 'Tạo tài khoản khách hàng' : 'Đăng nhập thuê khay & giám sát',
                  textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
              if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: const TextStyle(color: Colors.redAccent))),
              if (notice != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(notice!, style: const TextStyle(color: Colors.greenAccent))),
              const SizedBox(height: 20),
              if (register) TextField(controller: fullName, decoration: const InputDecoration(labelText: 'Họ và tên')),
              TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
              if (register) TextField(controller: phone, decoration: const InputDecoration(labelText: 'Số điện thoại')),
              TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Mật khẩu')),
              const SizedBox(height: 16),
              FilledButton(onPressed: loading ? null : submit, child: Text(loading ? 'Đang xử lý...' : register ? 'Đăng ký' : 'Đăng nhập')),
              TextButton(
                onPressed: () => setState(() { register = !register; error = null; }),
                child: Text(register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
