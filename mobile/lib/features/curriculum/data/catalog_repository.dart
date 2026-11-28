import 'package:dio/dio.dart';

class CatalogRepository {
  const CatalogRepository(this._client);

  final Dio _client;

  Future<List<Map<String, dynamic>>> variants({
    CancelToken? cancelToken,
  }) async {
    final response = await _client.get<List<dynamic>>(
      'exams/variants',
      cancelToken: cancelToken,
    );
    return _parseList(response.data);
  }

  Future<List<Map<String, dynamic>>> subjects(
    String variantId, {
    String? syllabusVersionId,
    CancelToken? cancelToken,
  }) async {
    final response = await _client.get<List<dynamic>>(
      'exams/variants/${Uri.encodeComponent(variantId)}/subjects',
      queryParameters: {
        'syllabusVersionId': ?syllabusVersionId,
      },
      cancelToken: cancelToken,
    );
    return _parseList(response.data);
  }

  List<Map<String, dynamic>> _parseList(List<dynamic>? data) {
    if (data == null || data.any((item) => item is! Map<String, dynamic>)) {
      throw const FormatException('Invalid catalog response.');
    }
    return data.cast<Map<String, dynamic>>().toList(growable: false);
  }
}
