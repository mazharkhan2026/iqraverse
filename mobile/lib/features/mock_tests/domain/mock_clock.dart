/// Estimates the display countdown from a server snapshot and monotonic
/// elapsed time. It is not a source of authority for expiration or scoring.
Duration remainingMockTime({
  required DateTime serverTime,
  required DateTime deadline,
  required Duration elapsed,
}) {
  final remaining = deadline.difference(serverTime) - elapsed;
  return remaining.isNegative ? Duration.zero : remaining;
}
