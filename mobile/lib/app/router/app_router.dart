import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/auth_screen.dart';
import '../../features/exams/application/exam_provider.dart';
import '../../features/exams/presentation/exam_selection_screen.dart';
import '../../features/home/presentation/student_shell.dart';
import '../../features/splash/presentation/welcome_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      if (state.matchedLocation == '/home' &&
          ref.read(activeExamProvider) == null) {
        return '/exams';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => WelcomeScreen(
          onContinue: () => context.go('/exams'),
          onLogin: () => context.push('/login'),
          onRegister: () => context.push('/register'),
        ),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const AuthScreen(register: false),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const AuthScreen(register: true),
      ),
      GoRoute(
        path: '/exams',
        builder: (context, state) => ExamSelectionScreen(
          onSelected: () => context.go('/home'),
        ),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => StudentShell(
          onChangeExam: () => context.go('/exams'),
        ),
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});
