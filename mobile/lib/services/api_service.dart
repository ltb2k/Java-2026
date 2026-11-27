import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Android Emulator: 10.0.2.2:5001/api
  // Physical device: pass --dart-define=API_URL=http://<LAN_IP>:5001/api
  static const baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5001/api',
  );

  static const _timeout = Duration(seconds: 15);

  Future<String?> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await _token();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<dynamic> _send(String method, String path,
      {Object? body, bool auth = true}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _headers(auth: auth);
    final encoded = body == null ? null : jsonEncode(body);
    late http.Response r;

    try {
      switch (method) {
        case 'POST':
          r = await http.post(uri, headers: headers, body: encoded).timeout(_timeout);
          break;
        case 'PUT':
          r = await http.put(uri, headers: headers, body: encoded).timeout(_timeout);
          break;
        case 'DELETE':
          r = await http.delete(uri, headers: headers).timeout(_timeout);
          break;
        default:
          r = await http.get(uri, headers: headers).timeout(_timeout);
      }
    } on TimeoutException {
      throw Exception('Kết nối tới máy chủ quá thời gian ($baseUrl).');
    } catch (_) {
      throw Exception('Không thể kết nối tới Backend ($baseUrl).');
    }

    final data = r.body.isEmpty ? null : jsonDecode(r.body);
    if (r.statusCode == 401 && auth) {
      await logout();
      throw Exception('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    if (r.statusCode >= 400) {
      final msg = data is Map && data['message'] != null
          ? data['message'].toString()
          : 'Lỗi máy chủ HTTP ${r.statusCode}';
      throw Exception(msg);
    }
    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _send(
      'POST',
      '/auth/login',
      body: {'email': email, 'password': password},
      auth: false,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['token'] as String);
    if (data['refreshToken'] != null) {
      await prefs.setString('refreshToken', data['refreshToken'] as String);
    }
    await prefs.setString('user', jsonEncode(data['user']));
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> register(String fullName, String email, String password) async {
    await _send(
      'POST',
      '/auth/register',
      body: {'full_name': fullName, 'email': email, 'password': password},
      auth: false,
    );
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

  Future<Map<String, dynamic>> me() async =>
      Map<String, dynamic>.from(await _send('GET', '/auth/me') as Map);

  Future<Map<String, dynamic>> updateMe(String fullName) async =>
      Map<String, dynamic>.from(
          await _send('PUT', '/auth/me', body: {'full_name': fullName}) as Map);

  Future<List<dynamic>> myTrays() async =>
      List<dynamic>.from(await _send('GET', '/trays') as List);

  Future<List<dynamic>> growthLogs(int trayId) async =>
      List<dynamic>.from(await _send('GET', '/trays/$trayId/growth-logs') as List);

  Future<List<dynamic>> packages() async =>
      List<dynamic>.from(await _send('GET', '/packages?status=ACTIVE') as List);

  Future<Map<String, dynamic>> createRental({
    required int packageId,
    int quantity = 1,
    String? notes,
  }) async =>
      Map<String, dynamic>.from(await _send(
        'POST',
        '/rentals',
        body: {'package_id': packageId, 'quantity': quantity, 'notes': notes},
      ) as Map);

  Future<Map<String, dynamic>> linkTray(String code) async =>
      Map<String, dynamic>.from(
          await _send('POST', '/rentals/link', body: {'code': code}) as Map);

  Future<List<dynamic>> rentals() async =>
      List<dynamic>.from(await _send('GET', '/rentals') as List);

  Future<Map<String, dynamic>> dashboard() async =>
      Map<String, dynamic>.from(await _send('GET', '/dashboard/summary') as Map);

  Future<Map<String, dynamic>> latestSensors({int? roomId}) async {
    final q = roomId != null ? '?room_id=$roomId' : '';
    return Map<String, dynamic>.from(
        await _send('GET', '/sensors/latest$q') as Map);
  }

  Future<List<dynamic>> sensorHistory({int? roomId, int limit = 30}) async {
    final q = roomId != null ? '?room_id=$roomId&limit=$limit' : '?limit=$limit';
    return List<dynamic>.from(await _send('GET', '/sensors/history$q') as List);
  }

  Future<List<dynamic>> alerts() async =>
      List<dynamic>.from(await _send('GET', '/alerts?limit=50') as List);

  Future<List<dynamic>> harvests() async =>
      List<dynamic>.from(await _send('GET', '/harvests') as List);
}
