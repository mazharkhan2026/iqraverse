import 'package:material_ui/material_ui.dart';

import '../../exams/domain/exam.dart';
import 'mock_preview_screen.dart';

class MockScreen extends StatelessWidget {
  const MockScreen({super.key, required this.exam});

  final Exam exam;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final description = switch (exam) {
      Exam.nsct => 'Full mock target: 100 questions · 120 minutes',
      Exam.mdcat => 'Full mock target: 180 questions · 180 minutes',
      Exam.nat => 'Shortened NAT-IE starter test',
      Exam.ielts => 'Academic Reading starter test · No band score',
    };
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Icon(Icons.shield_outlined, size: 64, color: theme.colorScheme.primary),
        const SizedBox(height: 16),
        Text(
          '${exam.label} mock tests',
          style: theme.textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(description),
        const SizedBox(height: 8),
        const Text('Preview targets; published server blueprint required.'),
        const SizedBox(height: 24),
        Text('Before you begin', style: theme.textTheme.titleLarge),
        const ListTile(
          leading: Icon(Icons.timer_outlined),
          title: Text('The server controls the deadline'),
          subtitle: Text('The clock does not pause if you disconnect.'),
        ),
        const ListTile(
          leading: Icon(Icons.warning_amber_outlined),
          title: Text('Screen-away policy'),
          subtitle: Text(
            'Proposed: 3-second grace, two warnings, '
            'finalization on the third counted excursion.',
          ),
        ),
        const ListTile(
          leading: Icon(Icons.save_outlined),
          title: Text('Saved answers only'),
          subtitle: Text('The server finalizes and scores the attempt.'),
        ),
        const Text(
          'Client signals are advisory, not proof of cheating. '
          'Accessibility accommodations require a reviewed policy. '
          'This is not official proctoring.',
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => MockPreviewScreen(exam: exam))),
          child: const Text('Try timed interface rehearsal'),
        ),
        const SizedBox(height: 12),
        const FilledButton(
          onPressed: null,
          child: Text('Start secure mock'),
        ),
        const SizedBox(height: 8),
        const Text(
          'Unavailable until authentication, published policy and '
          'approved server question bank are connected.',
        ),
      ],
    );
  }
}
