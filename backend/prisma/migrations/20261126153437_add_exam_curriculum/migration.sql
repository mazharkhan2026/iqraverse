-- CreateEnum
CREATE TYPE "SyllabusStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_variants" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "exam_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_versions" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "edition" TEXT NOT NULL,
    "applicability_year" INTEGER,
    "source_uri" TEXT,
    "source_label" TEXT NOT NULL,
    "status" "SyllabusStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "syllabus_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "syllabus_version_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightage" DECIMAL(5,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exams_code_key" ON "exams"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_variants_exam_id_code_key" ON "exam_variants"("exam_id", "code");

-- CreateIndex
CREATE INDEX "syllabus_versions_variant_id_status_idx" ON "syllabus_versions"("variant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_versions_variant_id_edition_key" ON "syllabus_versions"("variant_id", "edition");

-- CreateIndex
CREATE INDEX "subjects_syllabus_version_id_sort_order_idx" ON "subjects"("syllabus_version_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_syllabus_version_id_code_key" ON "subjects"("syllabus_version_id", "code");

-- CreateIndex
CREATE INDEX "chapters_subject_id_sort_order_idx" ON "chapters"("subject_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_subject_id_code_key" ON "chapters"("subject_id", "code");

-- CreateIndex
CREATE INDEX "topics_chapter_id_sort_order_idx" ON "topics"("chapter_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapter_id_code_key" ON "topics"("chapter_id", "code");

-- AddForeignKey
ALTER TABLE "exam_variants" ADD CONSTRAINT "exam_variants_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_versions" ADD CONSTRAINT "syllabus_versions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "exam_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_syllabus_version_id_fkey" FOREIGN KEY ("syllabus_version_id") REFERENCES "syllabus_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
