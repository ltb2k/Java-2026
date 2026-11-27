import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('Smart Mushroom app renders login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const SmartMushroomApp());
    expect(find.text('Smart Mushroom Farm'), findsOneWidget);
  });
}