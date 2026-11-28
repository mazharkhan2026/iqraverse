import '../domain/practice_question.dart';

// Original demonstration questions, not a published or official question bank.
// Area indices follow nsctCompetencies. Never use these for secure mock tests.
const sampleQuestions = [
  PracticeQuestion(
    area: 0,
    difficulty: Difficulty.easy,
    prompt: 'What comes next: 3, 6, 12, 24?',
    options: ['30', '36', '48', '72'],
    correctIndex: 2,
    explanation: 'Each number is twice the previous number.',
  ),
  PracticeQuestion(
    area: 1,
    difficulty: Difficulty.easy,
    prompt: 'Which construct repeats a block of code?',
    options: ['Loop', 'Comment', 'Literal', 'Import'],
    correctIndex: 0,
    explanation: 'A loop repeats instructions while its conditions permit.',
  ),
  PracticeQuestion(
    area: 2,
    difficulty: Difficulty.medium,
    prompt: 'Which structure follows first-in, first-out ordering?',
    options: ['Stack', 'Queue', 'Set', 'Tree'],
    correctIndex: 1,
    explanation: 'A queue removes the element that was inserted earliest.',
  ),
  PracticeQuestion(
    area: 3,
    difficulty: Difficulty.easy,
    prompt: 'What is the purpose of a regression test?',
    options: [
      'Delete old source files',
      'Replace documentation',
      'Increase file size',
      'Detect broken existing behavior',
    ],
    correctIndex: 3,
    explanation: 'Regression tests detect existing behavior broken by changes.',
  ),
  PracticeQuestion(
    area: 4,
    difficulty: Difficulty.easy,
    prompt: 'Which HTTP method is normally used to retrieve a resource?',
    options: ['DELETE', 'GET', 'PATCH', 'POST'],
    correctIndex: 1,
    explanation: 'GET requests retrieve a representation of a resource.',
  ),
  PracticeQuestion(
    area: 5,
    difficulty: Difficulty.medium,
    prompt: 'Which SQL clause filters rows before grouping?',
    options: ['ORDER BY', 'HAVING', 'WHERE', 'GROUP BY'],
    correctIndex: 2,
    explanation: 'WHERE filters input rows before aggregation and grouping.',
  ),
  PracticeQuestion(
    area: 6,
    difficulty: Difficulty.easy,
    prompt: 'Which protocol resolves domain names to IP addresses?',
    options: ['DNS', 'SMTP', 'SSH', 'FTP'],
    correctIndex: 0,
    explanation: 'DNS provides name resolution, including address records.',
  ),
  PracticeQuestion(
    area: 7,
    difficulty: Difficulty.medium,
    prompt: 'What is a held-out test set used for?',
    options: [
      'Training every model weight',
      'Removing all missing data',
      'Choosing labels manually',
      'Estimating performance on unseen data',
    ],
    correctIndex: 3,
    explanation: 'Held-out examples estimate generalization after training.',
  ),
  PracticeQuestion(
    area: 8,
    difficulty: Difficulty.hard,
    prompt: 'Which condition is necessary for a classic deadlock?',
    options: [
      'Unlimited resources',
      'Circular wait',
      'Single instruction execution',
      'Forced resource preemption',
    ],
    correctIndex: 1,
    explanation: 'Circular wait is one of the four Coffman conditions.',
  ),
  PracticeQuestion(
    area: 9,
    difficulty: Difficulty.medium,
    prompt: 'What does multi-factor authentication require?',
    options: [
      'Two different passwords',
      'A public password',
      'Evidence from distinct factor categories',
      'An unencrypted connection',
    ],
    correctIndex: 2,
    explanation: 'Distinct factors include knowledge, possession and inherence.',
  ),
];

List<PracticeQuestion> selectPracticeQuestions({
  required Set<int> areas,
  required Difficulty? difficulty,
  required int count,
}) {
  if (count < 1) return const [];
  return sampleQuestions
      .where(
        (question) =>
            areas.contains(question.area) &&
            (difficulty == null || question.difficulty == difficulty),
      )
      .take(count)
      .toList(growable: false);
}
