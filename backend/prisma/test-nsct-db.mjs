// Local PostgreSQL integration smoke test. All test writes are rolled back.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPractice, getPractice, savePractice, submitPractice, getPracticeResult } from '../src/attempts/practice-persistence.mjs';
import { startMock, reportEvent } from '../src/attempts/mock-persistence.mjs';
import { quotas, securePolicy } from '../src/attempts/mock-core.mjs';
import { listHistory, getProgress } from '../src/attempts/analytics-persistence.mjs';
const url=process.env.DATABASE_URL;
if(!url || process.env.NODE_ENV==='production') throw Error('Local development DATABASE_URL required');
const target=new URL(url);
if(!['localhost','127.0.0.1','[::1]'].includes(target.hostname)||target.pathname!=='/iqraverse_db') throw Error('Only local iqraverse_db is supported');
if(process.argv[2]!=='--local-rollback') throw Error('Run with --local-rollback on your private development database');
const db=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
const rollback=new Error('INTENTIONAL_TEST_ROLLBACK');
const runId=randomUUID();
const code='LOCAL_TEST_'+runId;
let passed=false;
try {
 await db.$transaction(async tx=>{
  const admin=await tx.user.findFirst({where:{status:'active',emailVerifiedAt:{not:null},roles:{some:{revokedAt:null,role:{name:'admin'}}}},select:{id:true}});
  assert.ok(admin,'Active verified local admin required');
  const exam=await tx.exam.findUnique({where:{code:'NSCT'}});assert.ok(exam,'Seed NSCT first');
  // The real exam and bank remain unchanged after rollback. The test uses a separate variant.
  await tx.exam.update({where:{id:exam.id},data:{isActive:true}});
  const user=await tx.user.create({data:{email:`smoke-${runId}@example.invalid`,passwordHash:'!local-smoke-disabled-password',emailVerifiedAt:new Date(),profile:{create:{displayName:'Rollback smoke test'}},roles:{create:{role:{connect:{name:'student'}}}}}});
  const family=await tx.authSessionFamily.create({data:{userId:user.id,expiresAt:new Date(Date.now()+3600000)}});
  const auth={user:{id:user.id},familyId:family.id};
  const variant=await tx.examVariant.create({data:{examId:exam.id,code,name:'Temporary rollback test only',isActive:true}});
  const syllabus=await tx.syllabusVersion.create({data:{variantId:variant.id,edition:code,sourceLabel:'Synthetic integration test only',status:'published'}});
  const source=await tx.source.create({data:{code,title:'Synthetic arithmetic test fixtures only',rightsStatus:'authorized',rightsEvidence:'Original deterministic arithmetic test data; temporary rollback test only.',reviewedById:admin.id,reviewedAt:new Date()}});
  const sections=[]; const topicBySubject={}; let n=0;
  for(const [subjectCode,quota] of Object.entries(quotas)){
   const subject=await tx.subject.create({data:{syllabusVersionId:syllabus.id,code:subjectCode,name:`Test ${subjectCode}`,weightage:quota,sortOrder:sections.length+1}});
   const chapter=await tx.chapter.create({data:{subjectId:subject.id,code:'TEST',name:'Synthetic test',sortOrder:1}});
   const topic=await tx.topic.create({data:{chapterId:chapter.id,code:'TEST',name:'Synthetic arithmetic only',sortOrder:1}});
   topicBySubject[subjectCode]=topic.id;
   sections.push({subjectId:subject.id,quota,formats:['single_select']});
   for(let i=0;i<quota;i++){
    const v=++n;const question=await tx.question.create({data:{topicId:topic.id,scope:'platform'}});
    const prompt=`Synthetic fixture ${v}: ${v} + 1 = ?`;
    const qv=await tx.questionVersion.create({data:{questionId:question.id,version:1,sourceId:source.id,sourceRecordId:`TEST-${v}`,difficulty:'easy',prompt,optionsJson:[{id:'A',label:String(v+1)},{id:'B',label:String(v+2)},{id:'C',label:String(v+3)},{id:'D',label:String(v+4)}],answerKeyJson:{optionId:'A'},explanation:`Adding one to ${v} gives ${v+1}.`,marks:1,status:'approved',isCurrent:true,shuffleOptions:false,fingerprint:createHash('sha256').update(runId+prompt).digest('hex')}});
    await tx.moderationReview.create({data:{questionVersionId:qv.id,reviewerId:admin.id,decision:'approve',notes:'Temporary deterministic arithmetic test fixture; not a human-reviewed production question.'}});
   }
  }
  assert.equal(n,100);
  const b=await tx.blueprint.create({data:{variantId:variant.id,syllabusVersionId:syllabus.id,name:'Temporary test mock',version:1,durationSeconds:7200,isFullLength:true,scoringPolicy:{correct:1,incorrect:0,unanswered:0},integrityPolicy:securePolicy,status:'published',evidence:'SYNTHETIC TEST ONLY; not official exam evidence',publishedAt:new Date(),sections:{create:sections}}});
  // Reuse the real persistence functions in one rollback-only transaction.
  // This adapter deliberately does not test independent transaction boundaries/concurrency.
  const prisma={$transaction:fn=>fn(tx)};
  const req={variantId:variant.id,topicIds:[topicBySubject.PROBLEM_SOLVING],difficulty:'easy',count:3};
  const a=await createPractice(prisma,auth,req,'practice-test');assert.equal(a.items.length,3);
  for(const item of a.items){assert.ok(!('correctOptionId' in item)&&!('answerKeyJson' in item)&&!('explanation' in item));}
  assert.equal((await createPractice(prisma,auth,req,'practice-test')).id,a.id);
  await assert.rejects(createPractice(prisma,auth,{...req,count:4},'practice-test'),{code:'IDEMPOTENCY_CONFLICT'});
  await assert.rejects(getPracticeResult(prisma,auth,a.id),{code:'ATTEMPT_ACTIVE'});
  for(const [i,item] of a.items.entries()) await savePractice(prisma,auth,a.id,item.id,{answer:i===0?'A':'B'});
  assert.equal((await getPractice(prisma,auth,a.id)).savedAnswers.length,3);
  const r=await submitPractice(prisma,auth,a.id);assert.equal(r.earnedMarks,1);assert.equal(r.availableMarks,3);
  assert.equal((await getPracticeResult(prisma,auth,a.id)).earnedMarks,1);
  assert.equal((await submitPractice(prisma,auth,a.id)).earnedMarks,1);
  await assert.rejects(savePractice(prisma,auth,a.id,a.items[0].id,{answer:'A'}),{code:'ATTEMPT_FINALIZED'});
  console.log('PASS practice creation, replay, answer protection, saves, grading and finalization');
  const progress=await getProgress(prisma,auth,variant.id,{mode:'practice'});
  const topic=progress.topics.find(t=>t.topicId===req.topicIds[0]);assert.equal(topic.distinctAnswered,3);assert.equal(topic.status,'weak');assert.equal(topic.accuracy,100/3);
  assert.equal((await listHistory(prisma,auth,{variantId:variant.id,mode:'practice'})).items.length,1);
  console.log('PASS history and weak-topic analytics');
  const m=await startMock(prisma,auth,{blueprintId:b.id},'mock-test');assert.equal(m.items.length,100);assert.equal(new Set(m.items.map(i=>i.id)).size,100);
  const stored=await tx.attemptItem.findMany({where:{attemptId:m.id},select:{questionId:true}});assert.equal(new Set(stored.map(i=>i.questionId)).size,100);
  for(const [subjectCode,quota] of Object.entries(quotas)) assert.equal(m.items.filter(i=>i.topicId===topicBySubject[subjectCode]).length,quota);
  assert.equal(new Date(m.deadlineAt)-new Date(m.startedAt),7200000);
  await assert.rejects(createPractice(prisma,auth,req,'blocked'),{code:'ACTIVE_SECURE_MOCK'});
  const event={eventId:randomUUID(),type:'screen_away'};
  assert.equal((await reportEvent(prisma,auth,m.id,event)).integrity.countedViolations,1);
  assert.equal((await reportEvent(prisma,auth,m.id,event)).integrity.countedViolations,1);
  await reportEvent(prisma,auth,m.id,{...event,eventId:randomUUID()});
  const final=await reportEvent(prisma,auth,m.id,{...event,eventId:randomUUID()});assert.equal(final.completionReason,'violation_limit');assert.equal(final.status,'submitted');
  assert.equal((await getPracticeResult(prisma,auth,m.id)).earnedMarks,0);
  console.log('PASS full 100-item mock, quotas, deadline, isolation and duplicate violation auto-submit');
  const expired=await startMock(prisma,auth,{blueprintId:b.id},'expiry-test');
  await tx.attempt.update({where:{id:expired.id},data:{deadlineAt:new Date(Date.now()-1000)}});
  assert.equal((await getPractice(prisma,auth,expired.id)).status,'expired');
  console.log('PASS deadline expiry');
  throw rollback;
 },{timeout:120000,maxWait:10000});
} catch(e){if(e!==rollback)throw e;assert.equal(await db.source.count({where:{code}}),0);assert.equal(await db.examVariant.count({where:{code}}),0);passed=true;}
finally {await db.$disconnect();}
if(passed) console.log('PASS integration smoke test; all temporary database writes rolled back.');
