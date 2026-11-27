-- CreateEnum
CREATE TYPE "AttemptMode" AS ENUM ('practice', 'mock', 'course');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('active', 'submitted', 'expired');

-- CreateEnum
CREATE TYPE "AttemptCompletionReason" AS ENUM ('user_submit', 'deadline', 'violation_limit');

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "syllabus_version_id" UUID NOT NULL,
    "mode" "AttemptMode" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_items" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_version_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "syllabus_version_id" UUID NOT NULL,
    "session_family_id" UUID NOT NULL,
    "mode" "AttemptMode" NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMPTZ(3),
    "submitted_at" TIMESTAMPTZ(3),
    "completion_reason" "AttemptCompletionReason",
    "available_marks" DECIMAL(8,2) NOT NULL,
    "earned_marks" DECIMAL(8,2),
    "result_snapshot" JSONB,
    "integrity_policy" JSONB NOT NULL,
    "counted_violations" INTEGER NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_items" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_version_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "presentation" JSONB NOT NULL,
    "correct_option_id" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "marks" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "attempt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "item_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "is_correct" BOOLEAN,
    "earned_marks" DECIMAL(8,2),
    "saved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "attempt_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessments_variant_id_syllabus_version_id_mode_idx" ON "assessments"("variant_id", "syllabus_version_id", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_items_assessment_id_position_key" ON "assessment_items"("assessment_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_items_assessment_id_question_id_key" ON "assessment_items"("assessment_id", "question_id");

-- CreateIndex
CREATE INDEX "attempts_user_id_variant_id_syllabus_version_id_mode_starte_idx" ON "attempts"("user_id", "variant_id", "syllabus_version_id", "mode", "started_at");

-- CreateIndex
CREATE INDEX "attempts_user_id_mode_status_idx" ON "attempts"("user_id", "mode", "status");

-- CreateIndex
CREATE INDEX "attempts_status_deadline_at_idx" ON "attempts"("status", "deadline_at");

-- CreateIndex
CREATE INDEX "attempt_items_topic_id_question_id_idx" ON "attempt_items"("topic_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_items_attempt_id_position_key" ON "attempt_items"("attempt_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_items_attempt_id_question_id_key" ON "attempt_items"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_user_id_operation_key_key" ON "idempotency_records"("user_id", "operation", "key");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "exam_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_syllabus_version_id_fkey" FOREIGN KEY ("syllabus_version_id") REFERENCES "syllabus_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "exam_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_syllabus_version_id_fkey" FOREIGN KEY ("syllabus_version_id") REFERENCES "syllabus_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_family_id_fkey" FOREIGN KEY ("session_family_id") REFERENCES "auth_session_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "attempt_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
