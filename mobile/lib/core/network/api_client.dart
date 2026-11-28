import 'package:dio/dio.dart';

/// Creates the shared REST client. Configure a real API base URL explicitly;
/// no production host or credentials are embedded in the application.
Dio createApiClient(String baseUrl) {
  final uri = Uri.tryParse(baseUrl);
  if (uri == null ||
      uri.host.isEmpty ||
      !['http', 'https'].contains(uri.scheme) ||
      uri.userInfo.isNotEmpty ||
      uri.hasQuery ||
      uri.hasFragment ||
      !uri.path.endsWith('/api/v1/')) {
    throw ArgumentError('Expected an API base URL ending in /api/v1/.');
  }
  return Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
    ),
  );
}
