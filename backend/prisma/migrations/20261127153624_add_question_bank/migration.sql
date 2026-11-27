-- CreateEnum
CREATE TYPE "SourceRightsStatus" AS ENUM ('pending', 'authorized', 'denied', 'revoked');

-- CreateEnum
CREATE TYPE "QuestionScope" AS ENUM ('platform', 'course');

-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('single_select');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "QuestionReviewStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "QuestionReviewDecision" AS ENUM ('approve', 'reject', 'request_changes');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ImportParserOutcome" AS ENUM ('valid', 'malformed', 'duplicate');

-- CreateEnum
CREATE TYPE "ImportReviewStatus" AS ENUM ('pending', 'quarantined', 'rejected', 'approved');

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "source_uri" TEXT,
    "checksum" TEXT,
    "rights_status" "SourceRightsStatus" NOT NULL DEFAULT 'pending',
    "rights_evidence" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passages" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "owner_id" UUID,
    "scope" "QuestionScope" NOT NULL DEFAULT 'platform',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "source_id" UUID NOT NULL,
    "source_record_id" TEXT,
    "source_page" INTEGER,
    "passage_id" UUID,
    "format" "QuestionFormat" NOT NULL DEFAULT 'single_select',
    "difficulty" "QuestionDifficulty" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options_json" JSONB NOT NULL,
    "answer_key_json" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "marks" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "fingerprint" TEXT,
    "status" "QuestionReviewStatus" NOT NULL DEFAULT 'draft',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_reviews" (
    "id" UUID NOT NULL,
    "question_version_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "decision" "QuestionReviewDecision" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "input_checksum" TEXT NOT NULL,
    "parser_version" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'pending',
    "expected_count" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_staging_records" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "source_page" INTEGER,
    "source_section" TEXT,
    "source_question_no" TEXT,
    "parser_outcome" "ImportParserOutcome" NOT NULL,
    "review_status" "ImportReviewStatus" NOT NULL DEFAULT 'quarantined',
    "payload" JSONB,
    "issues" JSONB,
    "fingerprint" TEXT,
    "topic_id" UUID,
    "difficulty" "QuestionDifficulty",
    "question_version_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_staging_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sources_rights_status_idx" ON "sources"("rights_status");

-- CreateIndex
CREATE UNIQUE INDEX "sources_code_version_key" ON "sources"("code", "version");

-- CreateIndex
CREATE INDEX "passages_source_id_idx" ON "passages"("source_id");

-- CreateIndex
CREATE INDEX "questions_topic_id_scope_idx" ON "questions"("topic_id", "scope");

-- CreateIndex
CREATE INDEX "questions_owner_id_idx" ON "questions"("owner_id");

-- CreateIndex
CREATE INDEX "question_versions_status_is_current_difficulty_idx" ON "question_versions"("status", "is_current", "difficulty");

-- CreateIndex
CREATE INDEX "question_versions_source_id_source_record_id_idx" ON "question_versions"("source_id", "source_record_id");

-- CreateIndex
CREATE INDEX "question_versions_fingerprint_idx" ON "question_versions"("fingerprint");

-- CreateIndex
CREATE INDEX "question_versions_passage_id_idx" ON "question_versions"("passage_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_versions_question_id_version_key" ON "question_versions"("question_id", "version");

-- CreateIndex
CREATE INDEX "moderation_reviews_question_version_id_created_at_idx" ON "moderation_reviews"("question_version_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_reviews_reviewer_id_idx" ON "moderation_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "import_batches_status_idx" ON "import_batches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "import_batches_source_id_input_checksum_parser_version_key" ON "import_batches"("source_id", "input_checksum", "parser_version");

-- CreateIndex
CREATE INDEX "import_staging_records_batch_id_parser_outcome_review_statu_idx" ON "import_staging_records"("batch_id", "parser_outcome", "review_status");

-- CreateIndex
CREATE INDEX "import_staging_records_topic_id_difficulty_idx" ON "import_staging_records"("topic_id", "difficulty");

-- CreateIndex
CREATE INDEX "import_staging_records_fingerprint_idx" ON "import_staging_records"("fingerprint");

-- CreateIndex
CREATE INDEX "import_staging_records_question_version_id_idx" ON "import_staging_records"("question_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_staging_records_batch_id_source_record_id_key" ON "import_staging_records"("batch_id", "source_record_id");

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passages" ADD CONSTRAINT "passages_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reviews" ADD CONSTRAINT "moderation_reviews_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reviews" ADD CONSTRAINT "moderation_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging_records" ADD CONSTRAINT "import_staging_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging_records" ADD CONSTRAINT "import_staging_records_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging_records" ADD CONSTRAINT "import_staging_records_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Only one current version per question
CREATE UNIQUE INDEX "question_versions_one_current"
ON "question_versions" ("question_id")
WHERE "is_current" = true;

-- Current versions must be approved
ALTER TABLE "question_versions"
ADD CONSTRAINT "current_version_must_be_approved"
CHECK (NOT "is_current" OR "status" = 'approved');