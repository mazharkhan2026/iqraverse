import 'package:flutter_test/flutter_test.dart';
import 'package:iqraverse/features/curriculum/domain/nsct_catalog.dart';

void main() {
  test('NSCT preview contains ten unique areas and 100 mock questions', () {
    expect(nsctCompetencies.length, 10);
    expect(nsctCompetencies.map((area) => area.name).toSet().length, 10);
    expect(
      nsctCompetencies.fold<int>(0, (sum, area) => sum + area.mockQuota),
      100,
    );
  });
}
