import 'package:flutter_test/flutter_test.dart';
import 'package:iqraverse/features/auth/domain/auth_validation.dart';

void main() {
  test('display name must not be blank', () {
    expect(AuthValidation.displayName('  '), isNotNull);
    expect(AuthValidation.displayName('Student'), isNull);
  });

  test('email validation accepts trimmed valid addresses', () {
    expect(AuthValidation.email('student@example.com '), isNull);
    expect(AuthValidation.email('student@'), isNotNull);
    expect(AuthValidation.email(null), isNotNull);
  });

  test('password requires at least eight characters', () {
    expect(AuthValidation.password('1234567'), isNotNull);
    expect(AuthValidation.password('12345678'), isNull);
  });
}
