import 'package:dio/dio.dart';

/// Requires an authenticated, session-bound Dio client. The server owns
/// deadlines, saved answers, violation counts, scoring and finalization.
class MockRepository {
  const MockRepository(this._client);

  final Dio _client;

  Future<Map<String, dynamic>> start(
    String blueprintId,
    String idempotencyKey,
  ) async {
    final response = await _client.post<Map<String, dynamic>>(
      'attempts/mock',
      data: {'blueprintId': blueprintId},
      options: Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return _body(response);
  }

  Future<Map<String, dynamic>> resume(String attemptId) async {
    return _body(
      await _client.get<Map<String, dynamic>>(_path(attemptId)),
    );
  }

  Future<void> saveAnswer(
    String attemptId,
    String itemId,
    String optionId,
  ) async {
    await _client.put<dynamic>(
      '${_path(attemptId)}/answers/${Uri.encodeComponent(itemId)}',
      data: {'answer': optionId},
    );
  }

  Future<Map<String, dynamic>> reportScreenAway(
    String attemptId,
    String eventId,
  ) async {
    return _body(
      await _client.post<Map<String, dynamic>>(
        '${_path(attemptId)}/integrity-events',
        data: {'eventId': eventId, 'type': 'screen_away'},
      ),
    );
  }

  Future<void> submit(String attemptId) async {
    await _client.post<dynamic>('${_path(attemptId)}/submit');
  }

  Future<Map<String, dynamic>> result(String attemptId) async {
    return _body(
      await _client.get<Map<String, dynamic>>('${_path(attemptId)}/result'),
    );
  }

  String _path(String id) => 'attempts/${Uri.encodeComponent(id)}';

  Map<String, dynamic> _body(Response<Map<String, dynamic>> response) {
    return response.data ?? (throw const FormatException('Missing response.'));
  }
}
