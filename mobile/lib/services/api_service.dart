import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  Future<String?> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await _token();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> _send(String method, String path, {Object? body, bool auth = true}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _headers(auth: auth);
    final encoded = body == null ? null : jsonEncode(body);
    late http.Response r;
    switch (method) {
      case 'POST':
        r = await http.post(uri, headers: headers, body: encoded);
        break;
      case 'PATCH':
        r = await http.patch(uri, headers: headers, body: encoded);
        break;
      default:
        r = await http.get(uri, headers: headers);
    }
    final data = r.body.isEmpty ? {} : jsonDecode(r.body);
    if (r.statusCode >= 400) {
      throw Exception(data is Map && data['message'] != null ? data['message'] : 'HTTP ${r.statusCode}');
    }
    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _send('POST', '/auth/login', body: {'email': email, 'password': password}, auth: false);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['token']);
    await prefs.setString('user', jsonEncode(data['user']));
    return Map<String, dynamic>.from(data);
  }

  Future<void> register(String fullName, String email, String password, String phone) async {
    await _send('POST', '/auth/register',
        body: {'fullName': fullName, 'email': email, 'password': password, 'phone': phone}, auth: false);
  }

  Future<Map<String, dynamic>?> currentUser() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString('token') == null) return null;
    try {
      final user = await me();
      await prefs.setString('user', jsonEncode(user));
      return user;
    } catch (_) {
      await logout();
      return null;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<Map<String, dynamic>> me() async => Map<String, dynamic>.from(await _send('GET', '/auth/me'));
  Future<void> updateMe(Map<String, dynamic> body) async => _send('PATCH', '/auth/me', body: body);
  Future<List<dynamic>> myTrays() async => List<dynamic>.from(await _send('GET', '/trays?scope=mine'));
  Future<List<dynamic>> availableTrays() async => List<dynamic>.from(await _send('GET', '/trays?scope=available'));
  Future<List<dynamic>> packages() async => List<dynamic>.from(await _send('GET', '/packages'));
  Future<void> rent({required String trayId, required String packageId}) async =>
      _send('POST', '/rentals', body: {'trayId': trayId, 'packageId': packageId});
  Future<void> registerTray(String code, String packageId) async =>
      _send('POST', '/trays/register', body: {'code': code, 'packageId': packageId});
  Future<Map<String, dynamic>> dashboard() async => Map<String, dynamic>.from(await _send('GET', '/dashboard/summary'));
  Future<List<dynamic>> history() async => List<dynamic>.from(await _send('GET', '/sensors/history'));
  Future<List<dynamic>> cameras() async => List<dynamic>.from(await _send('GET', '/cameras'));
  Future<List<dynamic>> notifications() async => List<dynamic>.from(await _send('GET', '/notifications'));
  Future<void> readNotification(String id) async => _send('PATCH', '/notifications/$id/read');
  Future<List<dynamic>> rentals() async => List<dynamic>.from(await _send('GET', '/rentals'));
  Future<List<dynamic>> transactions() async => List<dynamic>.from(await _send('GET', '/transactions'));
  Future<List<dynamic>> harvests() async => List<dynamic>.from(await _send('GET', '/harvests'));
  Future<void> requestHarvest(String trayId, String note) async =>
      _send('POST', '/harvests/request', body: {'trayId': trayId, 'note': note});
  Future<List<dynamic>> progress(String trayId) async =>
      List<dynamic>.from(await _send('GET', '/progress?trayId=$trayId'));
}
