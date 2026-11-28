import 'package:material_ui/material_ui.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../analytics/application/practice_history.dart';
import '../../exams/domain/exam.dart';
import '../../exams/domain/exam_content.dart';
import '../domain/practice_question.dart';

class PracticeScreen extends StatefulWidget {
  const PracticeScreen({super.key, this.exam = Exam.nsct});

  final Exam exam;

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  late final _areas = Set<int>.from(
    List<int>.generate(examSubjects(widget.exam).length, (index) => index),
  );
  Difficulty? _difficulty;
  late int _count = examQuestions(widget.exam).length.clamp(1, 5).toInt();

  List<PracticeQuestion> get _matching => examQuestions(widget.exam).where((q) => _areas.contains(q.area) && (_difficulty == null || q.difficulty == _difficulty)).toList();

  @override
  Widget build(BuildContext context) {
    final available = _matching.length;
    final subjects = examSubjects(widget.exam);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Customize practice',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text('${widget.exam.label} sample bank · Untimed · Not official exam questions'),
        const SizedBox(height: 20),
        const Text('Competency areas'),
        Wrap(
          spacing: 8,
          children: [
            for (var i = 0; i < subjects.length; i++)
              FilterChip(
                label: Text(subjects[i]),
                selected: _areas.contains(i),
                onSelected: (selected) => setState(() {
                  if (selected) {
                    _areas.add(i);
                  } else {
                    _areas.remove(i);
                  }
                }),
              ),
          ],
        ),
        const SizedBox(height: 20),
        const Text('Difficulty'),
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Mixed'),
              selected: _difficulty == null,
              onSelected: (_) => setState(() => _difficulty = null),
            ),
            for (final level in Difficulty.values)
              ChoiceChip(
                label: Text(level.name),
                selected: _difficulty == level,
                onSelected: (_) => setState(() => _difficulty = level),
              ),
          ],
        ),
        const SizedBox(height: 20),
        Text('Requested questions: $_count'),
        Slider(
          value: _count.toDouble(),
          min: 1,
          max: 10,
          divisions: 9,
          label: '$_count',
          onChanged: (value) => setState(() => _count = value.round()),
        ),
        Text('$available matching sample questions available'),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: available < _count
              ? null
              : () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => PracticeSessionScreen(
                      exam: widget.exam,
                      questions: _matching.take(_count).toList(),
                    ),
                  ),
                ),
          child: const Text('Begin practice'),
        ),
        if (available < _count)
          const Text('Choose fewer questions or broaden your filters.'),
      ],
    );
  }
}

class PracticeSessionScreen extends ConsumerStatefulWidget {
  const PracticeSessionScreen({super.key, required this.questions, this.exam = Exam.nsct});

  final Exam exam;

  final List<PracticeQuestion> questions;

  @override
  ConsumerState<PracticeSessionScreen> createState() => _PracticeSessionScreenState();
}

class _PracticeSessionScreenState extends ConsumerState<PracticeSessionScreen> {
  final Map<int, int> _answers = {};
  int _index = 0;
  bool _finished = false;

  @override
  Widget build(BuildContext context) {
    final questions = widget.questions;
    if (questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice')),
        body: const Center(child: Text('No matching questions.')),
      );
    }
    if (_finished) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice results')),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                '${practiceScore(questions, _answers)} / ${questions.length}',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const Text('Sample practice score · Not an official result'),
              const SizedBox(height: 24),
              for (var i = 0; i < questions.length; i++)
                Card(
                  child: ListTile(
                    title: Text(questions[i].prompt),
                    subtitle: Text(questions[i].explanation),
                    leading: Icon(
                      _answers[i] == questions[i].correctIndex
                          ? Icons.check_circle_outline
                          : Icons.cancel_outlined,
                    ),
                  ),
                ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Back to practice'),
              ),
            ],
          ),
        ),
      );
    }
    final question = questions[_index];
    final answer = _answers[_index];
    return Scaffold(
      appBar: AppBar(title: const Text('Practice session')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Question ${_index + 1} of ${questions.length}'),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: (_index + 1) / questions.length),
            const SizedBox(height: 24),
            Text(
              question.prompt,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            for (var i = 0; i < question.options.length; i++)
              Card(
                child: ListTile(
                  title: Text(question.options[i]),
                  leading: Icon(
                    answer == i
                        ? Icons.radio_button_checked
                        : Icons.radio_button_unchecked,
                  ),
                  selected: answer == i,
                  onTap: answer != null
                      ? null
                      : () => setState(() => _answers[_index] = i),
                ),
              ),
            if (answer != null) ...[
              const SizedBox(height: 16),
              Text(answer == question.correctIndex ? 'Correct' : 'Incorrect'),
              Text('Correct answer: ${question.options[question.correctIndex]}'),
              Text(question.explanation),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: answer == null
                  ? null
                  : () => setState(() {
                      if (_index + 1 == questions.length) {
                        final areas = <int, (int, int)>{};
                        for (var i = 0; i < questions.length; i++) {
                          final q = questions[i];
                          final old = areas[q.area] ?? (0, 0);
                          areas[q.area] = (old.$1 + (_answers[i] == q.correctIndex ? 1 : 0), old.$2 + 1);
                        }
                        ref.read(historyProvider.notifier).add(PracticeRecord(widget.exam, practiceScore(questions, _answers), questions.length, Map.unmodifiable(areas), DateTime.now()));
                        _finished = true;
                      } else {
                        _index++;
                      }
                    }),
              child: Text(
                _index + 1 == questions.length ? 'See results' : 'Next question',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
