import 'package:flutter_test/flutter_test.dart';
import 'package:iqraverse/features/practice/data/sample_questions.dart';
import 'package:iqraverse/features/practice/domain/practice_question.dart';

void main() {
  test('sample bank covers all ten areas and valid answer indices', () {
    expect(sampleQuestions.map((q) => q.area).toSet().length, 10);
    for (final question in sampleQuestions) {
      expect(question.options.length, 4);
      expect(question.correctIndex, inInclusiveRange(0, 3));
    }
  });

  test('filters by area and difficulty without inventing questions', () {
    final questions = selectPracticeQuestions(
      areas: {2, 5},
      difficulty: Difficulty.medium,
      count: 10,
    );
    expect(questions.length, 2);
    expect(questions.every((q) => q.difficulty == Difficulty.medium), isTrue);
    expect(
      selectPracticeQuestions(areas: {}, difficulty: null, count: 5),
      isEmpty,
    );
  });

  test('scores correct, wrong and unanswered questions', () {
    final questions = sampleQuestions.take(3).toList();
    expect(practiceScore(questions, {}), 0);
    expect(practiceScore(questions, {0: 2, 1: 1}), 1);
    expect(practiceScore(questions, {0: 2, 1: 0, 2: 1}), 3);
  });
}
