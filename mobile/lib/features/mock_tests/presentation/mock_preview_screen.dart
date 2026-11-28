import 'dart:async';

import 'package:material_ui/material_ui.dart';

import '../../exams/domain/exam.dart';
import '../../exams/domain/exam_content.dart';

class MockPreviewScreen extends StatefulWidget {
  const MockPreviewScreen({super.key, required this.exam});
  final Exam exam;

  @override
  State<MockPreviewScreen> createState() => _MockPreviewScreenState();
}

class _MockPreviewScreenState extends State<MockPreviewScreen> {
  final _clock = Stopwatch()..start();
  final _answers = <int, int>{};
  final _flagged = <int>{};
  late final _questions = examQuestions(widget.exam).take(3).toList();
  late final Timer _timer;
  int _index = 0;
  bool _submitted = false;

  int get _seconds => (180 - _clock.elapsed.inSeconds).clamp(0, 180).toInt();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _submitted) return;
      setState(() {
        if (_seconds == 0) _finish();
      });
    });
  }

  void _finish() {
    _submitted = true;
    _clock.stop();
    _timer.cancel();
  }

  Future<void> _confirm() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit rehearsal?'),
        content: Text('${_questions.length - _answers.length} unanswered. Your rehearsal will end.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Continue')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Submit')),
        ],
      ),
    );
    if (mounted && confirmed == true && !_submitted) setState(_finish);
  }

  @override
  void dispose() {
    _timer.cancel();
    _clock.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return Scaffold(
        appBar: AppBar(title: const Text('Rehearsal complete')),
        body: SafeArea(child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Icon(Icons.check_circle_outline, size: 72),
            const SizedBox(height: 20),
            Text('${_answers.length} of ${_questions.length} answered', style: Theme.of(context).textTheme.headlineSmall),
            const Text('Interface rehearsal only. No official score or secure result was created.'),
            const SizedBox(height: 24),
            FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Return to mock tests')),
          ],
        )),
      );
    }
    final question = _questions[_index];
    final minutes = (_seconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (_seconds % 60).toString().padLeft(2, '0');
    return Scaffold(
      appBar: AppBar(title: Text('$minutes:$seconds'), actions: [
        TextButton(onPressed: _confirm, child: const Text('Submit')),
      ]),
      body: SafeArea(child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Local timed interface rehearsal · Not secure or official'),
          const SizedBox(height: 12),
          LinearProgressIndicator(value: _seconds / 180),
          const SizedBox(height: 16),
          Text('${_answers.length}/${_questions.length} answered'),
          Wrap(spacing: 8, children: [
            for (var i = 0; i < _questions.length; i++)
              ChoiceChip(
                label: Text('${i + 1} ${_flagged.contains(i) ? "⚑" : _answers.containsKey(i) ? "✓" : "○"}'),
                selected: i == _index,
                onSelected: (_) => setState(() => _index = i),
              ),
          ]),
          const SizedBox(height: 24),
          Text(question.prompt, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          for (var i = 0; i < question.options.length; i++)
            Card(child: ListTile(
              leading: Icon(_answers[_index] == i ? Icons.radio_button_checked : Icons.radio_button_unchecked),
              title: Text(question.options[i]),
              onTap: () => setState(() => _answers[_index] = i),
            )),
          TextButton(onPressed: () => setState(() => _answers.remove(_index)), child: const Text('Clear answer')),
          OutlinedButton(onPressed: () => setState(() {
            if (!_flagged.add(_index)) _flagged.remove(_index);
          }), child: Text(_flagged.contains(_index) ? 'Remove flag' : 'Flag for review')),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: _index == 0 ? null : () => setState(() => _index--), child: const Text('Previous'))),
            const SizedBox(width: 8),
            Expanded(child: FilledButton(onPressed: _index + 1 == _questions.length ? _confirm : () => setState(() => _index++), child: Text(_index + 1 == _questions.length ? 'Submit' : 'Next'))),
          ]),
        ],
      )),
    );
  }
}
