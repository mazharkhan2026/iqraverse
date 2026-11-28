import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:iqraverse/features/analytics/application/practice_history.dart';
import 'package:iqraverse/features/exams/domain/exam.dart';
import 'package:iqraverse/features/exams/domain/exam_content.dart';

void main() {
  test('all exam fixtures have valid subject and answer indices', () {
    for (final exam in Exam.values) {
      final subjects = examSubjects(exam);
      final questions = examQuestions(exam);
      expect(questions, isNotEmpty);
      for (final question in questions) {
        expect(question.area, inInclusiveRange(0, subjects.length - 1));
        expect(question.correctIndex, inInclusiveRange(0, question.options.length - 1));
      }
    }
  });

  test('local history retains exam identity and clears on exit', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final history = container.read(historyProvider.notifier);
    history.add(PracticeRecord(Exam.nsct, 1, 2, {0: (1, 2)}, DateTime.utc(2026)));
    history.add(PracticeRecord(Exam.mdcat, 3, 3, {0: (3, 3)}, DateTime.utc(2026)));
    expect(container.read(historyProvider).where((r) => r.exam == Exam.nsct).single.correct, 1);
    history.clear();
    expect(container.read(historyProvider), isEmpty);
  });
}
