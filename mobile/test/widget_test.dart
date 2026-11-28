import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:iqraverse/app/app.dart';

void main() {
  testWidgets('Student can choose and switch examination', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: IqraVerseApp()),
    );
    await tester.pumpAndSettle();
    expect(find.text('IqraVerse'), findsOneWidget);
    await tester.tap(find.text('Explore preview'));
    await tester.pumpAndSettle();
    expect(find.text('NSCT'), findsOneWidget);
    expect(find.text('MDCAT'), findsOneWidget);
    expect(find.text('NAT-IE'), findsOneWidget);
    expect(find.text('IELTS'), findsOneWidget);
    await tester.tap(find.text('NSCT'));
    await tester.pumpAndSettle();
    expect(find.text('Your learning journey'), findsOneWidget);
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Change examination'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('MDCAT'));
    await tester.pumpAndSettle();
    expect(find.text('MDCAT'), findsOneWidget);
    expect(find.text('NSCT'), findsNothing);
  });
}
