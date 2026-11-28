enum Difficulty { easy, medium, hard }

class PracticeQuestion {
  const PracticeQuestion({
    required this.area,
    required this.difficulty,
    required this.prompt,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });

  final int area;
  final Difficulty difficulty;
  final String prompt;
  final List<String> options;
  final int correctIndex;
  final String explanation;
}

int practiceScore(
  List<PracticeQuestion> questions,
  Map<int, int> answers,
) {
  var score = 0;
  for (var i = 0; i < questions.length; i++) {
    if (answers[i] == questions[i].correctIndex) score++;
  }
  return score;
}
