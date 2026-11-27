// IqraVerse v3.3 — additive schema draft. Run from backend with --apply.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve('prisma/schema.prisma');
const original = readFileSync(file, 'utf8');
const names = ['Source', 'Passage', 'Question', 'QuestionVersion', 'ModerationReview', 'ImportBatch', 'ImportStagingRecord'];
const exists = (name) => new RegExp(`^\\s*model\\s+${name}\\s*\\{`, 'm').test(original);
for (const name of ['User', 'Topic', 'SyllabusVersion']) {
  if (!exists(name)) throw new Error(`Missing prerequisite model ${name}; no changes made.`);
}
if (names.some(exists)) {
  throw new Error('Question-bank model(s) already exist. Inspect schema before continuing; no changes made.');
}
const additions = String.raw`
// Question bank and restricted import staging — v3.3

enum SourceRightsStatus {
  pending
  authorized
  denied
  revoked
}

enum QuestionScope {
  platform
  course
}

enum QuestionFormat {
  single_select
}

enum QuestionDifficulty {
  easy
  medium
  hard
}

enum QuestionReviewStatus {
  draft
  pending
  approved
  rejected
}

enum QuestionReviewDecision {
  approve
  reject
  request_changes
}

enum ImportBatchStatus {
  pending
  processing
  completed
  failed
}

enum ImportParserOutcome {
  valid
  malformed
  duplicate
}

enum ImportReviewStatus {
  pending
  quarantined
  rejected
  approved
}

model Source {
  id             String             @id @default(uuid()) @db.Uuid
  code           String
  version        Int                @default(1)
  title          String
  sourceUri      String?            @map("source_uri")
  checksum       String?
  rightsStatus   SourceRightsStatus @default(pending) @map("rights_status")
  rightsEvidence String?            @map("rights_evidence")
  reviewedById   String?            @map("reviewed_by_id") @db.Uuid
  reviewedAt     DateTime?          @map("reviewed_at") @db.Timestamptz(3)
  createdAt      DateTime           @default(now()) @map("created_at") @db.Timestamptz(3)

  reviewer User? @relation("QuestionSourceReviewer", fields: [reviewedById], references: [id], onDelete: Restrict)
  passages Passage[]
  questionVersions QuestionVersion[]
  importBatches ImportBatch[]

  @@unique([code, version])
  @@index([rightsStatus])
  @@map("sources")
}

model Passage {
  id        String   @id @default(uuid()) @db.Uuid
  sourceId  String   @map("source_id") @db.Uuid
  title     String?
  body      String
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  source Source @relation(fields: [sourceId], references: [id], onDelete: Restrict)
  questionVersions QuestionVersion[]

  @@index([sourceId])
  @@map("passages")
}

model Question {
  id        String        @id @default(uuid()) @db.Uuid
  topicId   String        @map("topic_id") @db.Uuid
  ownerId   String?       @map("owner_id") @db.Uuid
  scope     QuestionScope @default(platform)
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz(3)

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Restrict)
  owner User? @relation("QuestionOwner", fields: [ownerId], references: [id], onDelete: Restrict)
  versions QuestionVersion[]

  @@index([topicId, scope])
  @@index([ownerId])
  @@map("questions")
}

model QuestionVersion {
  id             String               @id @default(uuid()) @db.Uuid
  questionId     String               @map("question_id") @db.Uuid
  version        Int
  sourceId       String               @map("source_id") @db.Uuid
  sourceRecordId String?              @map("source_record_id")
  sourcePage     Int?                 @map("source_page")
  passageId      String?              @map("passage_id") @db.Uuid
  format         QuestionFormat       @default(single_select)
  difficulty     QuestionDifficulty
  prompt         String
  optionsJson    Json                 @map("options_json")
  answerKeyJson  Json                 @map("answer_key_json")
  explanation    String
  marks          Decimal              @default(1) @db.Decimal(8, 2)
  fingerprint    String?
  status         QuestionReviewStatus @default(draft)
  isCurrent      Boolean              @default(false) @map("is_current")
  shuffleOptions Boolean              @default(false) @map("shuffle_options")
  createdAt      DateTime             @default(now()) @map("created_at") @db.Timestamptz(3)

  question Question @relation(fields: [questionId], references: [id], onDelete: Restrict)
  source Source @relation(fields: [sourceId], references: [id], onDelete: Restrict)
  passage Passage? @relation(fields: [passageId], references: [id], onDelete: Restrict)
  reviews ModerationReview[]
  stagingRecords ImportStagingRecord[]

  @@unique([questionId, version])
  @@index([status, isCurrent, difficulty])
  @@index([sourceId, sourceRecordId])
  @@index([fingerprint])
  @@index([passageId])
  @@map("question_versions")
}

model ModerationReview {
  id                String                 @id @default(uuid()) @db.Uuid
  questionVersionId String                 @map("question_version_id") @db.Uuid
  reviewerId        String                 @map("reviewer_id") @db.Uuid
  decision          QuestionReviewDecision
  notes             String?
  createdAt         DateTime               @default(now()) @map("created_at") @db.Timestamptz(3)

  questionVersion QuestionVersion @relation(fields: [questionVersionId], references: [id], onDelete: Restrict)
  reviewer User @relation("QuestionReviewer", fields: [reviewerId], references: [id], onDelete: Restrict)

  @@index([questionVersionId, createdAt])
  @@index([reviewerId])
  @@map("moderation_reviews")
}

model ImportBatch {
  id            String            @id @default(uuid()) @db.Uuid
  sourceId      String            @map("source_id") @db.Uuid
  createdById   String            @map("created_by_id") @db.Uuid
  inputChecksum String           @map("input_checksum")
  parserVersion String           @map("parser_version")
  status        ImportBatchStatus @default(pending)
  expectedCount Int?              @map("expected_count")
  createdAt     DateTime          @default(now()) @map("created_at") @db.Timestamptz(3)
  completedAt   DateTime?         @map("completed_at") @db.Timestamptz(3)

  source Source @relation(fields: [sourceId], references: [id], onDelete: Restrict)
  createdBy User @relation("QuestionImportCreator", fields: [createdById], references: [id], onDelete: Restrict)
  records ImportStagingRecord[]

  @@unique([sourceId, inputChecksum, parserVersion])
  @@index([status])
  @@map("import_batches")
}

model ImportStagingRecord {
  id                String              @id @default(uuid()) @db.Uuid
  batchId           String              @map("batch_id") @db.Uuid
  sourceRecordId    String              @map("source_record_id")
  sourcePage        Int?                @map("source_page")
  sourceSection     String?             @map("source_section")
  sourceQuestionNo  String?             @map("source_question_no")
  parserOutcome     ImportParserOutcome @map("parser_outcome")
  reviewStatus      ImportReviewStatus  @default(quarantined) @map("review_status")
  payload           Json?
  issues            Json?
  fingerprint       String?
  topicId           String?             @map("topic_id") @db.Uuid
  difficulty        QuestionDifficulty?
  questionVersionId String?             @map("question_version_id") @db.Uuid
  createdAt         DateTime            @default(now()) @map("created_at") @db.Timestamptz(3)

  batch ImportBatch @relation(fields: [batchId], references: [id], onDelete: Restrict)
  topic Topic? @relation(fields: [topicId], references: [id], onDelete: Restrict)
  questionVersion QuestionVersion? @relation(fields: [questionVersionId], references: [id], onDelete: Restrict)

  @@unique([batchId, sourceRecordId])
  @@index([batchId, parserOutcome, reviewStatus])
  @@index([topicId, difficulty])
  @@index([fingerprint])
  @@index([questionVersionId])
  @@map("import_staging_records")
}
`;
const backrefs = {
  User: `  ownedQuestions Question[] @relation("QuestionOwner")\n  reviewedQuestionSources Source[] @relation("QuestionSourceReviewer")\n  questionModerationReviews ModerationReview[] @relation("QuestionReviewer")\n  questionImportBatches ImportBatch[] @relation("QuestionImportCreator")`,
  Topic: `  questions Question[]\n  questionImportRecords ImportStagingRecord[]`,
};
let result = original;
for (const [name, fields] of Object.entries(backrefs)) {
  const match = new RegExp(`(^[ \\t]*model\\s+${name}\\s*\\{[ \\t]*\\r?\\n)`, 'm');
  if (!match.test(result)) throw new Error(`Cannot locate model ${name}; no changes made.`);
  result = result.replace(match, `$1${fields}\n`);
}
for (const match of additions.matchAll(/^enum\s+(\w+)/gm)) {
  if (new RegExp(`^\\s*enum\\s+${match[1]}\\s*\\{`, 'm').test(original)) throw new Error(`Existing enum ${match[1]}; no changes made.`);
}
result = result.trimEnd() + '\n\n' + additions.trim() + '\n';
if (!process.argv.includes('--apply')) {
  console.log('Schema prerequisites found. Seven new models prepared; no files changed. Run again with --apply to write the draft.');
} else {
  writeFileSync(file, result, 'utf8');
  console.log('Seven question-bank models added to prisma/schema.prisma. Existing models retained. No database changes made.');
}
