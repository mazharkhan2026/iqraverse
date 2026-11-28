import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../analytics/application/practice_history.dart';
import '../../analytics/presentation/analytics_screen.dart';
import '../../courses/presentation/courses_screen.dart';
import '../../exams/application/exam_provider.dart';
import '../../mock_tests/presentation/mock_screen.dart';
import '../../practice/presentation/practice_screen.dart';
import '../../profile/presentation/profile_screen.dart';

class StudentShell extends ConsumerStatefulWidget {
  const StudentShell({super.key, required this.onChangeExam});
  final VoidCallback onChangeExam;

  @override
  ConsumerState<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends ConsumerState<StudentShell> {
  int _index = 0;
  static const _titles = ['Home', 'Courses', 'Practice', 'Mock Tests', 'Profile'];

  @override
  Widget build(BuildContext context) {
    final exam = ref.watch(activeExamProvider);
    if (exam == null) return const Scaffold(body: Center(child: Text('Choose an examination')));
    final theme = Theme.of(context);
    final records = ref.watch(historyProvider).where((r) => r.exam == exam).toList();
    final total = records.fold<int>(0, (sum, r) => sum + r.total);
    final hits = records.fold<int>(0, (sum, r) => sum + r.correct);
    final pages = [
      ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Align(alignment: Alignment.centerLeft, child: Chip(label: Text(exam.label))),
          const SizedBox(height: 12),
          Text('Your learning journey', style: theme.textTheme.headlineMedium),
          const Text('Learn. Practice. Achieve.'),
          const SizedBox(height: 20),
          Card(child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Your practice progress', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              Text(total == 0 ? 'Start your first session' : '${(hits * 100 / total).round()}% accuracy'),
              LinearProgressIndicator(value: total == 0 ? 0 : hits / total),
              const SizedBox(height: 8),
              Text('${records.length} sessions · $total questions'),
              TextButton(onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => AnalyticsScreen(exam: exam))), child: const Text('View performance')),
            ]),
          )),
          const SizedBox(height: 12),
          FilledButton(onPressed: () => setState(() => _index = 2), child: const Text('Start practice')),
          for (final entry in [(1, Icons.menu_book, 'Explore courses'), (3, Icons.timer_outlined, 'Explore mock tests')])
            Card(child: ListTile(leading: Icon(entry.$2), title: Text(entry.$3), trailing: const Icon(Icons.chevron_right), onTap: () => setState(() => _index = entry.$1))),
          const SizedBox(height: 12),
          const Text('Development preview · local learning data only'),
        ],
      ),
      CoursesScreen(exam: exam),
      PracticeScreen(key: ValueKey(exam), exam: exam),
      MockScreen(exam: exam),
      ProfileScreen(exam: exam, onChangeExam: widget.onChangeExam, onExit: () {
        ref.read(historyProvider.notifier).clear();
        context.go('/');
      }),
    ];
    return Scaffold(
      appBar: AppBar(title: Text(_index == 0 ? 'IqraVerse' : _titles[_index])),
      body: SafeArea(child: IndexedStack(index: _index, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.menu_book), label: 'Courses'),
          NavigationDestination(icon: Icon(Icons.quiz_outlined), label: 'Practice'),
          NavigationDestination(icon: Icon(Icons.timer_outlined), label: 'Mock Tests'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
