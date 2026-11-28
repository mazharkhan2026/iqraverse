/// Pure excursion tracker. Caller supplies monotonic elapsed time and a
/// UUID generator. Queue returned IDs until acknowledged by the server.
/// Network connectivity is deliberately not an input.
class ScreenAwayTracker {
  ScreenAwayTracker({required this.grace, required this.newEventId});

  final Duration grace;
  final String Function() newEventId;
  Duration? _awaySince;
  bool _reported = false;

  void leave(Duration now) {
    _awaySince ??= now;
  }

  String? check(Duration now) {
    final since = _awaySince;
    if (since == null || _reported || now - since < grace) return null;
    _reported = true;
    return newEventId();
  }

  String? resume(Duration now) {
    final event = check(now);
    _awaySince = null;
    _reported = false;
    return event;
  }
}
