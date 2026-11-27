import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const path=resolve('prisma/schema.prisma');
const schema=readFileSync(path,'utf8');
const additions=String.raw`
// Practice persistence — proposed v3.3; mock blueprint/event models follow.
enum AttemptMode {
  practice
  mock
  course
}
enum AttemptStatus {
  active
  submitted
  expired
}
enum AttemptCompletionReason {
  user_submit
  deadline
  violation_limit
}
model Assessment {
  id String @id @default(uuid()) @db.Uuid
  variantId String @map("variant_id") @db.Uuid
  syllabusVersionId String @map("syllabus_version_id") @db.Uuid
  mode AttemptMode
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  variant ExamVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)
  syllabus SyllabusVersion @relation(fields: [syllabusVersionId], references: [id], onDelete: Restrict)
  items AssessmentItem[]
  attempts Attempt[]
  @@index([variantId, syllabusVersionId, mode])
  @@map("assessments")
}
model AssessmentItem {
  id String @id @default(uuid()) @db.Uuid
  assessmentId String @map("assessment_id") @db.Uuid
  questionId String @map("question_id") @db.Uuid
  questionVersionId String @map("question_version_id") @db.Uuid
  position Int
  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Restrict)
  question Question @relation(fields: [questionId], references: [id], onDelete: Restrict)
  questionVersion QuestionVersion @relation(fields: [questionVersionId], references: [id], onDelete: Restrict)
  @@unique([assessmentId, position])
  @@unique([assessmentId, questionId])
  @@map("assessment_items")
}
model Attempt {
  id String @id @default(uuid()) @db.Uuid
  userId String @map("user_id") @db.Uuid
  assessmentId String @map("assessment_id") @db.Uuid
  variantId String @map("variant_id") @db.Uuid
  syllabusVersionId String @map("syllabus_version_id") @db.Uuid
  sessionFamilyId String @map("session_family_id") @db.Uuid
  mode AttemptMode
  status AttemptStatus @default(active)
  startedAt DateTime @default(now()) @map("started_at") @db.Timestamptz(3)
  deadlineAt DateTime? @map("deadline_at") @db.Timestamptz(3)
  submittedAt DateTime? @map("submitted_at") @db.Timestamptz(3)
  completionReason AttemptCompletionReason? @map("completion_reason")
  availableMarks Decimal @map("available_marks") @db.Decimal(8,2)
  earnedMarks Decimal? @map("earned_marks") @db.Decimal(8,2)
  resultSnapshot Json? @map("result_snapshot")
  integrityPolicy Json @map("integrity_policy")
  countedViolations Int @default(0) @map("counted_violations")
  flagged Boolean @default(false)
  user User @relation(fields: [userId], references: [id], onDelete: Restrict)
  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Restrict)
  variant ExamVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)
  syllabus SyllabusVersion @relation(fields: [syllabusVersionId], references: [id], onDelete: Restrict)
  sessionFamily AuthSessionFamily @relation(fields: [sessionFamilyId], references: [id], onDelete: Restrict)
  items AttemptItem[]
  idempotencyRecords IdempotencyRecord[]
  @@index([userId, variantId, syllabusVersionId, mode, startedAt])
  @@index([userId, mode, status])
  @@index([status, deadlineAt])
  @@map("attempts")
}
model AttemptItem {
  id String @id @default(uuid()) @db.Uuid
  attemptId String @map("attempt_id") @db.Uuid
  questionId String @map("question_id") @db.Uuid
  questionVersionId String @map("question_version_id") @db.Uuid
  topicId String @map("topic_id") @db.Uuid
  position Int
  presentation Json
  correctOptionId String @map("correct_option_id")
  explanation String
  marks Decimal @db.Decimal(8,2)
  attempt Attempt @relation(fields: [attemptId], references: [id], onDelete: Restrict)
  question Question @relation(fields: [questionId], references: [id], onDelete: Restrict)
  questionVersion QuestionVersion @relation(fields: [questionVersionId], references: [id], onDelete: Restrict)
  topic Topic @relation(fields: [topicId], references: [id], onDelete: Restrict)
  answer AttemptAnswer?
  @@unique([attemptId, position])
  @@unique([attemptId, questionId])
  @@index([topicId, questionId])
  @@map("attempt_items")
}
model AttemptAnswer {
  itemId String @id @map("item_id") @db.Uuid
  answer String
  isCorrect Boolean? @map("is_correct")
  earnedMarks Decimal? @map("earned_marks") @db.Decimal(8,2)
  savedAt DateTime @default(now()) @map("saved_at") @db.Timestamptz(3)
  item AttemptItem @relation(fields: [itemId], references: [id], onDelete: Restrict)
  @@map("attempt_answers")
}
model IdempotencyRecord {
  id String @id @default(uuid()) @db.Uuid
  userId String @map("user_id") @db.Uuid
  operation String
  key String
  requestHash String @map("request_hash")
  attemptId String @map("attempt_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  user User @relation(fields: [userId], references: [id], onDelete: Restrict)
  attempt Attempt @relation(fields: [attemptId], references: [id], onDelete: Restrict)
  @@unique([userId, operation, key])
  @@map("idempotency_records")
}
`;
const reverse={User:'practiceAttempts Attempt[]\n  attemptRequests IdempotencyRecord[]',AuthSessionFamily:'attempts Attempt[]',ExamVariant:'assessments Assessment[]\n  attempts Attempt[]',SyllabusVersion:'assessments Assessment[]\n  attempts Attempt[]',Question:'assessmentItems AssessmentItem[]\n  attemptItems AttemptItem[]',QuestionVersion:'assessmentItems AssessmentItem[]\n  attemptItems AttemptItem[]',Topic:'attemptItems AttemptItem[]'};
const existing=[...additions.matchAll(/^model (\w+)/gm)].map(m=>m[1]);
if(existing.some(n=>new RegExp('^model '+n+'\\s*\\{','m').test(schema)))throw Error('Attempt models already exist; inspect schema, no changes made.');
let next=schema;
for(const [name,fields] of Object.entries(reverse)){
 const re=new RegExp('^model '+name+'\\s*\\{','m');
 if(!re.test(next))throw Error('Missing model '+name);
 next=next.replace(re,m=>m+'\n  '+fields);
}
next=next.trimEnd()+'\n'+additions;
if(process.argv.includes('--apply')){writeFileSync(path,next);console.log('Added six proposed attempt models. Run prisma format and validate.');}else console.log('Schema prerequisites found. No changes made. Use --apply after review.');
