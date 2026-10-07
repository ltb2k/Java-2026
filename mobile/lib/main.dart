import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() => runApp(const MushroomApp());

class MushroomApp extends StatelessWidget {
  const MushroomApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'Mushroom-IoT',
    theme: ThemeData.dark(useMaterial3: true).copyWith(
      colorScheme: ColorScheme.fromSeed(seedColor: Colors.green, brightness: Brightness.dark),
    ),
    home: const HomeScreen(),
  );
}
