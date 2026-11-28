import 'package:material_ui/material_ui.dart';

import '../../curriculum/presentation/nsct_catalog_screen.dart';
import '../../exams/domain/exam.dart';
import '../../exams/domain/exam_content.dart';

class CoursesScreen extends StatelessWidget {
  const CoursesScreen({super.key, required this.exam});
  final Exam exam;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('${exam.label} learning', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text('Independent study and instructor courses are separate.'),
        const SizedBox(height: 16),
        Card(child: ListTile(
          leading: const Icon(Icons.menu_book),
          title: const Text('Independent curriculum'),
          subtitle: const Text('Browse subjects and learning resources'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
            builder: (_) => Scaffold(
              appBar: AppBar(title: Text('${exam.label} curriculum')),
              body: SafeArea(child: exam == Exam.nsct
                ? const NsctCatalogScreen()
                : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    const Text('Preview subject catalog · published syllabus pending'),
                    for (final subject in examSubjects(exam))
                      Card(child: ListTile(
                        title: Text(subject),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                          builder: (_) => Scaffold(
                            appBar: AppBar(title: Text(subject)),
                            body: const Padding(
                              padding: EdgeInsets.all(24),
                              child: Text('Published chapters, topics, lessons and permitted resources will appear here after catalog integration.'),
                            ),
                          ),
                        )),
                      )),
                  ],
                )),
            ),
          )),
        )),
        const SizedBox(height: 24),
        Text('Explore courses', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        const Text('Free enrollment · Admin-approved instructor content'),
        for (final category in ['Complete exam preparation', 'Subject courses', 'Notes and resources', 'Assessment packages'])
          Card(child: ListTile(
            leading: const Icon(Icons.school_outlined),
            title: Text(category),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
              builder: (_) => Scaffold(
                appBar: AppBar(title: Text(category)),
                body: const Center(child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No published courses available in this preview. Enrollment requires the course service.'),
                )),
              ),
            )),
          )),
        const SizedBox(height: 16),
        Text('My learning', style: theme.textTheme.titleLarge),
        const ListTile(
          leading: Icon(Icons.bookmark_border),
          title: Text('No enrolled courses'),
          subtitle: Text('Sign in and enroll in a published course to track lessons.'),
        ),
      ],
    );
  }
}
