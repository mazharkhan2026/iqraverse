import 'package:material_ui/material_ui.dart';

import '../domain/nsct_catalog.dart';

class NsctCatalogScreen extends StatelessWidget {
  const NsctCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('NSCT curriculum', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text(
          '10 competency areas · proposed mock allocation. '
          'Preview catalog from team blueprint v3.3.',
        ),
        const SizedBox(height: 16),
        for (final competency in nsctCompetencies)
          Card(
            child: ListTile(
              leading: const Icon(Icons.menu_book),
              title: Text(competency.name),
              subtitle: Text('Mock target: ${competency.mockQuota} questions'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (context) => _CompetencyDetail(
                    competency: competency,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _CompetencyDetail extends StatelessWidget {
  const _CompetencyDetail({required this.competency});

  final Competency competency;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Competency')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              competency.name,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text('Proposed mock allocation: ${competency.mockQuota} questions'),
            const SizedBox(height: 24),
            const Text('Chapters, topics and approved learning resources'),
            const SizedBox(height: 8),
            const Text(
              'The published syllabus is not connected in this preview. '
              'No course enrollment is required for independent curriculum.',
            ),
          ],
        ),
      ),
    );
  }
}
