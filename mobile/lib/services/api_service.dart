import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const baseUrl = 'http://10.0.2.2:5000/api';
  Future<Map<String,dynamic>> login(String email,String password) async {
    final r=await http.post(Uri.parse('$baseUrl/auth/login'),
      headers:{'Content-Type':'application/json'},
      body:jsonEncode({'email':email,'password':password}));
    if(r.statusCode>=400) throw Exception(jsonDecode(r.body)['message']);
    return jsonDecode(r.body);
  }
}
