import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../exams/domain/exam.dart';
import '../../exams/domain/exam_content.dart';
import '../application/practice_history.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key, required this.exam});

  final Exam exam;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final records = ref.watch(historyProvider).where((r) => r.exam == exam).toList();
    final total = records.fold<int>(0, (sum, r) => sum + r.total);
    final correct = records.fold<int>(0, (sum, r) => sum + r.correct);
    final subjects = examSubjects(exam);
    return Scaffold(
      appBar: AppBar(title: Text('${exam.label} performance')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text('Local practice only · resets when the app closes'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Accuracy', style: Theme.of(context).textTheme.titleLarge),
                    Text(total == 0 ? 'No attempts yet' : '${(100 * correct / total).round()}%'),
                    LinearProgressIndicator(value: total == 0 ? 0 : correct / total),
                    Text('${records.length} sessions · $total questions'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Competency accuracy', style: Theme.of(context).textTheme.titleLarge),
            for (var i = 0; i < subjects.length; i++)
              Builder(builder: (context) {
                var attempts = 0;
                var hits = 0;
                for (final record in records) {
                  final area = record.areas[i];
                  if (area != null) {
                    hits += area.$1;
                    attempts += area.$2;
                  }
                }
                return ListTile(
                  title: Text(subjects[i]),
                  subtitle: attempts == 0 ? const Text('Not practiced') : LinearProgressIndicator(value: hits / attempts),
                  trailing: Text(attempts == 0 ? '—' : '$hits/$attempts'),
                );
              }),
            const SizedBox(height: 16),
            Text('Practice history', style: Theme.of(context).textTheme.titleLarge),
            if (records.isEmpty) const Text('Complete a practice session to see your history.'),
            for (final record in records)
              ListTile(
                leading: const Icon(Icons.history),
                title: Text('${record.correct} / ${record.total} correct'),
                subtitle: Text(record.date.toLocal().toString().split('.').first),
              ),
            const SizedBox(height: 20),
            const Text('Mock and course results will appear separately after server integration.'),
          ],
        ),
      ),
    );
  }
}
