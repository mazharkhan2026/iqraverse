import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../application/exam_provider.dart';
import '../domain/exam.dart';

class ExamSelectionScreen extends ConsumerWidget {
  const ExamSelectionScreen({super.key, required this.onSelected});

  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose your examination')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Make your learning personal',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          const Text('You can change your examination later in Profile.'),
          const SizedBox(height: 24),
          for (final exam in Exam.values)
            Card(
              child: ListTile(
                title: Text(exam.label),
                subtitle: Text(exam.description),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  ref.read(activeExamProvider.notifier).select(exam);
                  onSelected();
                },
              ),
            ),
        ],
      ),
    );
  }
}
