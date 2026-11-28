import 'package:flutter_test/flutter_test.dart';
import 'package:iqraverse/features/mock_tests/domain/mock_clock.dart';
import 'package:iqraverse/features/mock_tests/domain/screen_away_tracker.dart';

void main() {
  test('server countdown clamps at zero', () {
    final server = DateTime.utc(2026, 11, 28);
    final deadline = server.add(const Duration(seconds: 10));
    expect(
      remainingMockTime(
        serverTime: server,
        deadline: deadline,
        elapsed: const Duration(seconds: 3),
      ),
      const Duration(seconds: 7),
    );
    expect(
      remainingMockTime(
        serverTime: server,
        deadline: deadline,
        elapsed: const Duration(seconds: 11),
      ),
      Duration.zero,
    );
  });

  test('short excursion is ignored', () {
    final tracker = ScreenAwayTracker(
      grace: const Duration(seconds: 3),
      newEventId: () => 'event-1',
    );
    tracker.leave(Duration.zero);
    expect(tracker.resume(const Duration(seconds: 2)), isNull);
  });

  test('overlapping signals count once and resume rearms tracker', () {
    var counter = 0;
    final tracker = ScreenAwayTracker(
      grace: const Duration(seconds: 3),
      newEventId: () => 'event-${++counter}',
    );
    tracker.leave(Duration.zero);
    tracker.leave(const Duration(seconds: 2));
    expect(tracker.check(const Duration(seconds: 3)), 'event-1');
    expect(tracker.resume(const Duration(seconds: 5)), isNull);
    tracker.leave(const Duration(seconds: 6));
    expect(tracker.resume(const Duration(seconds: 10)), 'event-2');
  });
}
