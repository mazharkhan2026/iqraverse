import 'package:material_ui/material_ui.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({
    super.key,
    required this.onContinue,
    required this.onLogin,
    required this.onRegister,
  });

  final VoidCallback onContinue;
  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(
                    Icons.auto_stories_rounded,
                    size: 88,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'IqraVerse',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.displaySmall,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Your learning universe',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Learn at your pace, practice with purpose, and prepare for your next examination.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),
                  FilledButton(
                    onPressed: onRegister,
                    child: const Text('Create student account'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: onLogin,
                    child: const Text('Sign in'),
                  ),
                  TextButton(
                    onPressed: onContinue,
                    child: const Text('Explore preview'),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Development preview — no account required.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
