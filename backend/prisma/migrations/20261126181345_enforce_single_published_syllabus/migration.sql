-- This is an empty migration.
CREATE UNIQUE INDEX "syllabus_versions_one_published_per_variant"
ON "syllabus_versions" ("variant_id")
WHERE "status" = 'published';