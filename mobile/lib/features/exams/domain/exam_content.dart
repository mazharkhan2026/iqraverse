import '../../curriculum/domain/nsct_catalog.dart';
import '../../practice/data/sample_questions.dart';
import '../../practice/domain/practice_question.dart';
import 'exam.dart';

List<String> examSubjects(Exam exam) => switch (exam) {
  Exam.nsct => nsctCompetencies.map((area) => area.name).toList(),
  Exam.mdcat => ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'],
  Exam.nat => ['English', 'Analytical', 'Quantitative', 'Physics', 'Chemistry', 'Mathematics'],
  Exam.ielts => ['Academic Reading'],
};

List<PracticeQuestion> examQuestions(Exam exam) => switch (exam) {
  Exam.nsct => sampleQuestions,
  Exam.mdcat => const [
    PracticeQuestion(area: 0, difficulty: Difficulty.easy, prompt: 'Which organelle produces most ATP in aerobic human cells?', options: ['Nucleus', 'Mitochondrion', 'Golgi apparatus', 'Lysosome'], correctIndex: 1, explanation: 'Mitochondria generate most ATP through oxidative phosphorylation.'),
    PracticeQuestion(area: 1, difficulty: Difficulty.easy, prompt: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correctIndex: 1, explanation: 'Carbon has six protons.'),
    PracticeQuestion(area: 2, difficulty: Difficulty.medium, prompt: 'A 2 kg object accelerates at 3 m/s². What is its net force?', options: ['1 N', '5 N', '6 N', '9 N'], correctIndex: 2, explanation: 'Newton’s second law gives F = ma = 6 N.'),
    PracticeQuestion(area: 3, difficulty: Difficulty.easy, prompt: 'Choose the correct sentence.', options: ['She study daily.', 'She studies daily.', 'She studying daily.', 'She studyed daily.'], correctIndex: 1, explanation: 'Third-person singular takes studies.'),
    PracticeQuestion(area: 4, difficulty: Difficulty.medium, prompt: 'All roses are plants. Which statement must be true?', options: ['All plants are roses', 'No roses are plants', 'Some roses are trees', 'Every rose is a plant'], correctIndex: 3, explanation: 'The last statement restates the given premise.'),
  ],
  Exam.nat => const [
    PracticeQuestion(area: 0, difficulty: Difficulty.easy, prompt: 'Which word is closest in meaning to concise?', options: ['Brief', 'Heavy', 'Late', 'Complex'], correctIndex: 0, explanation: 'Concise means brief and clear.'),
    PracticeQuestion(area: 1, difficulty: Difficulty.medium, prompt: 'Ali arrives before Sara, and Sara before Noor. Who arrives last?', options: ['Ali', 'Sara', 'Noor', 'Cannot determine'], correctIndex: 2, explanation: 'The order is Ali, Sara, Noor.'),
    PracticeQuestion(area: 2, difficulty: Difficulty.easy, prompt: 'What is 25% of 80?', options: ['10', '20', '25', '40'], correctIndex: 1, explanation: 'One quarter of 80 is 20.'),
    PracticeQuestion(area: 3, difficulty: Difficulty.easy, prompt: 'What is the SI unit of power?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 2, explanation: 'Power is measured in watts.'),
    PracticeQuestion(area: 4, difficulty: Difficulty.medium, prompt: 'Which solution has a pH below seven?', options: ['Acidic', 'Neutral', 'Basic', 'Always pure water'], correctIndex: 0, explanation: 'At ordinary reference conditions, acidic solutions have pH below seven.'),
    PracticeQuestion(area: 5, difficulty: Difficulty.medium, prompt: 'Solve 2x + 4 = 12.', options: ['2', '3', '4', '8'], correctIndex: 2, explanation: 'Subtract four and divide by two.'),
  ],
  Exam.ielts => const [
    PracticeQuestion(area: 0, difficulty: Difficulty.easy, prompt: 'Passage: A university library introduced a quiet study room in March. It opens on weekdays and seats twenty students.\n\nWhen did the room open?', options: ['January', 'March', 'June', 'December'], correctIndex: 1, explanation: 'The passage explicitly states March.'),
    PracticeQuestion(area: 0, difficulty: Difficulty.medium, prompt: 'Passage: A university library introduced a quiet study room in March. It opens on weekdays and seats twenty students.\n\nThe room is open on Sundays.', options: ['True', 'False', 'Not Given'], correctIndex: 1, explanation: 'The passage specifies weekdays, not Sundays.'),
    PracticeQuestion(area: 0, difficulty: Difficulty.medium, prompt: 'Passage: A university library introduced a quiet study room in March. It opens on weekdays and seats twenty students.\n\nStudents must reserve a seat online.', options: ['True', 'False', 'Not Given'], correctIndex: 2, explanation: 'The passage gives no reservation information.'),
  ],
};
