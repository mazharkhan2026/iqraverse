import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../../core/theme/theme_provider.dart';
import '../../analytics/presentation/analytics_screen.dart';
import '../../exams/domain/exam.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, required this.exam, required this.onChangeExam, required this.onExit});
  final Exam exam;
  final VoidCallback onChangeExam;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const CircleAvatar(radius: 36, child: Icon(Icons.person_outline, size: 36)),
        const SizedBox(height: 12),
        Text('Student preview', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
        const Text('Not signed in', textAlign: TextAlign.center),
        const SizedBox(height: 24),
        ListTile(
          leading: const Icon(Icons.school_outlined),
          title: const Text('Change examination'),
          subtitle: Text(exam.label),
          trailing: const Icon(Icons.chevron_right),
          onTap: onChangeExam,
        ),
        ListTile(
          leading: const Icon(Icons.insights),
          title: const Text('Performance and history'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
            builder: (_) => AnalyticsScreen(exam: exam),
          )),
        ),
        const Divider(),
        const Text('Appearance'),
        Wrap(
          spacing: 8,
          children: [
            for (final option in ThemeMode.values)
              ChoiceChip(
                label: Text(option.name),
                selected: mode == option,
                onSelected: (_) => ref.read(themeModeProvider.notifier).select(option),
              ),
          ],
        ),
        const SizedBox(height: 8),
        const Text('Theme preference applies for this app session.'),
        const Divider(),
        const ListTile(
          leading: Icon(Icons.manage_accounts_outlined),
          title: Text('Account settings'),
          subtitle: Text('Requires a connected student account'),
        ),
        const ListTile(
          leading: Icon(Icons.info_outline),
          title: Text('About IqraVerse'),
          subtitle: Text('Student learning application · Development preview'),
        ),
        OutlinedButton(onPressed: onExit, child: const Text('Exit preview')),
      ],
    );
  }
}
