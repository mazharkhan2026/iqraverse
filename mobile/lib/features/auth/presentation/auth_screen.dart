import 'package:material_ui/material_ui.dart';

import '../domain/auth_validation.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.register});

  final bool register;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Account service is not connected in this preview.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final register = widget.register;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(
                      Icons.auto_stories_rounded,
                      size: 56,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      register ? 'Create student account' : 'Welcome back',
                      style: theme.textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      register
                          ? 'Begin your learning journey.'
                          : 'Sign in to your IqraVerse account.',
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Development preview. Do not enter real credentials.',
                    ),
                    const SizedBox(height: 24),
                    if (register) ...[
                      TextFormField(
                        decoration: const InputDecoration(
                          labelText: 'Display name',
                          border: OutlineInputBorder(),
                        ),
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        validator: AuthValidation.displayName,
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autocorrect: false,
                      validator: AuthValidation.email,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      obscureText: _obscurePassword,
                      autocorrect: false,
                      enableSuggestions: false,
                      textInputAction: TextInputAction.done,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          tooltip: _obscurePassword
                              ? 'Show password'
                              : 'Hide password',
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: AuthValidation.password,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _submit,
                      child: Text(register ? 'Create account' : 'Sign in'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
