import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../curriculum/presentation/nsct_catalog_screen.dart';
import '../../exams/application/exam_provider.dart';
import '../../exams/domain/exam.dart';

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
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(_index == 0 ? 'IqraVerse' : _titles[_index]),
      ),
      body: SafeArea(
        child: _index == 1 && exam == Exam.nsct
            ? const NsctCatalogScreen()
            : ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (_index == 0) ...[
              Align(
                alignment: Alignment.centerLeft,
                child: Chip(label: Text(exam?.label ?? 'No exam selected')),
              ),
              const SizedBox(height: 16),
              Text(
                'Your learning journey',
                style: theme.textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              const Text('Learn. Practice. Achieve.'),
              const SizedBox(height: 24),
              Card(
                color: theme.colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ready to practice?',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => setState(() => _index = 2),
                        child: const Text('Start practice'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              for (final entry in [
                (1, Icons.menu_book, 'Explore courses'),
                (3, Icons.timer_outlined, 'Explore mock tests'),
              ])
                Card(
                  child: ListTile(
                    leading: Icon(entry.$2),
                    title: Text(entry.$3),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => setState(() => _index = entry.$1),
                  ),
                ),
            ] else if (_index == 4) ...[
              const Text('Student profile — development preview'),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.school_outlined),
                title: const Text('Change examination'),
                subtitle: Text(exam?.label ?? 'Not selected'),
                trailing: const Icon(Icons.chevron_right),
                onTap: widget.onChangeExam,
              ),
            ] else ...[
              Text(
                exam?.label ?? 'Choose an examination',
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              const Text('This module is not connected yet.'),
            ],
          ],
        ),
      ),
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
