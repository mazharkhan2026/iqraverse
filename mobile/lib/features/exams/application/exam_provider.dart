import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/exam.dart';

final activeExamProvider = NotifierProvider<ActiveExam, Exam?>(
  ActiveExam.new,
);

class ActiveExam extends Notifier<Exam?> {
  @override
  Exam? build() => null;

  void select(Exam exam) => state = exam;
}
