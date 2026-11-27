-- Append only to the NEW unapplied add_attempt_persistence migration.
CREATE UNIQUE INDEX "attempts_one_active_secure_mock_per_user"
ON "attempts" ("user_id") WHERE "mode" = 'mock' AND "status" = 'active';
ALTER TABLE "attempts" ADD CONSTRAINT "attempt_finalization_consistent"
CHECK (("status" = 'active' AND "submitted_at" IS NULL AND "completion_reason" IS NULL AND "earned_marks" IS NULL AND "result_snapshot" IS NULL)
OR ("status" <> 'active' AND "submitted_at" IS NOT NULL AND "completion_reason" IS NOT NULL AND "earned_marks" IS NOT NULL AND "result_snapshot" IS NOT NULL));
ALTER TABLE "attempts" ADD CONSTRAINT "attempt_marks_valid"
CHECK ("available_marks" > 0 AND ("earned_marks" IS NULL OR ("earned_marks" >= 0 AND "earned_marks" <= "available_marks")) AND "counted_violations" >= 0);
ALTER TABLE "attempts" ADD CONSTRAINT "mock_deadline_required" CHECK ("mode" <> 'mock' OR "deadline_at" IS NOT NULL);
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_item_position_marks_valid" CHECK ("position" >= 1 AND "marks" > 0);
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_item_position_valid" CHECK ("position" >= 1);
