import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../exams/domain/exam.dart';

class PracticeRecord {
  const PracticeRecord(this.exam, this.correct, this.total, this.areas, this.date);

  final Exam exam;
  final int correct;
  final int total;
  final Map<int, (int, int)> areas;
  final DateTime date;
}

final historyProvider = NotifierProvider<PracticeHistory, List<PracticeRecord>>(
  PracticeHistory.new,
);

class PracticeHistory extends Notifier<List<PracticeRecord>> {
  @override
  List<PracticeRecord> build() => const [];

  void add(PracticeRecord record) => state = [record, ...state];

  void clear() => state = const [];
}
