abstract final class AuthValidation {
  static String? displayName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Enter your name.';
    }
    return null;
  }

  static String? email(String? value) {
    final email = value?.trim() ?? '';
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      return 'Enter a valid email address.';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.length < 8) {
      return 'Use at least 8 characters.';
    }
    return null;
  }
}
