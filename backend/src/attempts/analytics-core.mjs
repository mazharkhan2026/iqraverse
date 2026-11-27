// v3.3: count the latest eligible answered logical question once per topic.
export function topicPerformance(topics, rows) {
  const counts = new Map(topics.map(t => [t.id, {answered: 0, correct: 0}]));
  const seen = new Set();
  // Repository orders latest finalized answer first, with deterministic tie-breaking.
  for (const r of rows) {
    if (typeof r.isCorrect !== 'boolean' || !counts.has(r.topicId)) continue;
    const key = `${r.topicId}:${r.questionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const c = counts.get(r.topicId);
    c.answered++;
    if (r.isCorrect) c.correct++;
  }
  return topics.map(t => {
    const {answered, correct} = counts.get(t.id);
    const accuracy = answered ? correct * 100 / answered : null;
    // Compare integers, not rounded display percentages.
    const status = !answered ? 'unassessed' : answered < 3 ? 'insufficient' : correct * 5 < answered * 3 ? 'weak' : 'not_weak';
    return {topicId:t.id, topicName:t.name, distinctAnswered:answered, accuracy, status};
  });
}
