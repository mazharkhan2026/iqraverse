import { createHash } from 'node:crypto';
import { validateBuildQuiz, selectPractice, publicItem, gradePractice } from './practice-core.mjs';
const policy={required:false,version:'practice-v1',violationLimit:3,graceSeconds:0};
const include={items:{orderBy:{position:'asc'},include:{answer:true}}};
function fail(code,message){throw Object.assign(new Error(message),{code});}
function uuid(x){return typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);}
function snapshot(i){return {...i.presentation,id:i.id,questionId:i.questionId,questionVersionId:i.questionVersionId,topicId:i.topicId,marks:Number(i.marks),correctOptionId:i.correctOptionId,explanation:i.explanation};}
function integrity(a){return {policy:a.integrityPolicy,countedViolations:a.countedViolations,flagged:a.flagged};}
export function attemptDto(a,now=new Date()){
 return {id:a.id,mode:a.mode,status:a.status,variantId:a.variantId,syllabusVersionId:a.syllabusVersionId,blueprintId:null,startedAt:a.startedAt,deadlineAt:a.deadlineAt,items:a.items.map(i=>publicItem(snapshot(i))),savedAnswers:a.items.filter(i=>i.answer).map(i=>({itemId:i.id,answer:i.answer.answer})),serverTime:now,integrity:integrity(a),completionReason:a.completionReason};
}
export function finalizeSnapshot(a){
 const answers=new Map(a.items.filter(i=>i.answer).map(i=>[i.id,i.answer.answer]));
 return gradePractice(a.items.map(snapshot),answers);
}
function resultDto(a){if(a.status==='active'||!a.resultSnapshot||!a.submittedAt)fail('ATTEMPT_ACTIVE','Result not available');return {...a.resultSnapshot,attemptId:a.id,variantId:a.variantId,syllabusVersionId:a.syllabusVersionId,blueprintId:null,mode:a.mode,submittedAt:a.submittedAt,integrity:integrity(a),completionReason:a.completionReason};}
function digest(req){return createHash('sha256').update(JSON.stringify({...req,topicIds:[...req.topicIds].sort()})).digest('hex');}
// All practice operations serialize on owner row. Future mock creation/finalization MUST use same lock order.
async function withOwner(prisma,auth,fn){
 const userId=auth?.user?.id, familyId=auth?.familyId;
 if(!uuid(userId)||!uuid(familyId))fail('UNAUTHENTICATED','Access token required');
 return prisma.$transaction(async tx=>{
  const rows=await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
  if(!rows.length)fail('UNAUTHENTICATED','Account unavailable');
  const family=await tx.authSessionFamily.findFirst({where:{id:familyId,userId,revokedAt:null,expiresAt:{gt:new Date()},user:{status:'active',emailVerifiedAt:{not:null},roles:{some:{revokedAt:null}}}},select:{id:true}});
  if(!family)fail('UNAUTHENTICATED','Session unavailable');
  // Fail closed for mock conflicts, including expired-but-unfinalized mocks; mock engine handles expiry later.
  if(await tx.attempt.findFirst({where:{userId,mode:'mock',status:'active'},select:{id:true}}))fail('ACTIVE_SECURE_MOCK','Finish secure mock first');
  return fn(tx,userId,familyId);
 },{timeout:15000});
}
async function owned(tx,userId,id){if(!uuid(id))fail('VALIDATION_ERROR','Invalid attempt ID');const a=await tx.attempt.findFirst({where:{id,userId,mode:'practice'},include});if(!a)fail('NOT_FOUND','Attempt not found');return a;}
export function createPractice(prisma,auth,body,key){
 const req=validateBuildQuiz(body);
 if(typeof key!=='string'||!key.trim()||key.length>128)fail('VALIDATION_ERROR','Idempotency-Key required (max 128 characters)');
 const requestHash=digest(req);
 return withOwner(prisma,auth,async(tx,userId,familyId)=>{
  const replay=await tx.idempotencyRecord.findUnique({where:{userId_operation_key:{userId,operation:'custom',key}}});
  if(replay){if(replay.requestHash!==requestHash)fail('IDEMPOTENCY_CONFLICT','Key already used with different request');return attemptDto(await owned(tx,userId,replay.attemptId));}
  const syllabus=await tx.syllabusVersion.findFirst({where:{variantId:req.variantId,status:'published',variant:{isActive:true,exam:{isActive:true,code:'NSCT'}}},select:{id:true}});
  if(!syllabus)fail('NOT_FOUND','Published NSCT syllabus not found');
  const scopeFilter={chapter:{subject:{syllabusVersionId:syllabus.id}}};
  const topics=await tx.topic.findMany({where:{id:{in:req.topicIds},...scopeFilter},select:{id:true}});
  if(topics.length!==req.topicIds.length)fail('VALIDATION_ERROR','Topic outside published syllabus');
  const rows=await tx.questionVersion.findMany({where:{status:'approved',isCurrent:true,format:'single_select',source:{rightsStatus:'authorized',reviewedAt:{not:null},reviewedById:{not:null},rightsEvidence:{not:null}},question:{scope:'platform',topicId:{in:req.topicIds},topic:scopeFilter},...(req.difficulty==='mixed'?{}:{difficulty:req.difficulty})},include:{question:true,source:{select:{rightsStatus:true,reviewedAt:true,reviewedById:true,rightsEvidence:true}}}});
  const candidates=rows.map(r=>({...r,topicId:r.question.topicId,scope:r.question.scope,variantId:req.variantId,syllabusVersionId:syllabus.id,rightsStatus:r.source.rightsStatus,rightsReviewed:Boolean(r.source.reviewedAt&&r.source.reviewedById&&r.source.rightsEvidence?.trim())}));
  const items=selectPractice(req,candidates,{variantId:req.variantId,syllabusVersionId:syllabus.id,published:true,topicIds:topics.map(t=>t.id)});
  const assessment=await tx.assessment.create({data:{variantId:req.variantId,syllabusVersionId:syllabus.id,mode:'practice',items:{create:items.map((i,index)=>({questionId:i.questionId,questionVersionId:i.questionVersionId,position:index+1}))}}});
  const a=await tx.attempt.create({data:{userId,sessionFamilyId:familyId,assessmentId:assessment.id,variantId:req.variantId,syllabusVersionId:syllabus.id,mode:'practice',availableMarks:items.length,integrityPolicy:policy,items:{create:items.map((i,index)=>({id:i.id,questionId:i.questionId,questionVersionId:i.questionVersionId,topicId:i.topicId,position:index+1,presentation:publicItem(i),marks:i.marks,correctOptionId:i.correctOptionId,explanation:i.explanation}))}},include});
  await tx.idempotencyRecord.create({data:{userId,operation:'custom',key,requestHash,attemptId:a.id}});
  return attemptDto(a);
 });
}
export function getPractice(prisma,auth,id){return withOwner(prisma,auth,async(tx,userId)=>attemptDto(await owned(tx,userId,id)));}
export function savePractice(prisma,auth,id,itemId,body){
 if(!uuid(itemId)||!body||typeof body.answer!=='string')fail('VALIDATION_ERROR','Invalid answer');
 return withOwner(prisma,auth,async(tx,userId)=>{
  const a=await owned(tx,userId,id);if(a.status!=='active')fail('ATTEMPT_FINALIZED','Attempt finalized');
  const item=a.items.find(i=>i.id===itemId);if(!item||!item.presentation.options.some(o=>o.id===body.answer))fail('VALIDATION_ERROR','Option must belong to attempt item');
  await tx.attemptAnswer.upsert({where:{itemId},create:{itemId,answer:body.answer},update:{answer:body.answer,savedAt:new Date()}});return {message:'Answer saved'};
 });
}
export function submitPractice(prisma,auth,id){return withOwner(prisma,auth,async(tx,userId)=>{
 const a=await owned(tx,userId,id);if(a.status!=='active')return resultDto(a);
 const result=finalizeSnapshot(a);
 for(const r of result.review)if(r.submittedAnswer!==null)await tx.attemptAnswer.update({where:{itemId:r.itemId},data:{isCorrect:r.gradingStatus==='correct',earnedMarks:r.earnedMarks}});
 const finalized=await tx.attempt.update({where:{id:a.id},data:{status:'submitted',submittedAt:new Date(),completionReason:'user_submit',earnedMarks:result.earnedMarks,resultSnapshot:result}});
 return resultDto(finalized);
});}
export function getPracticeResult(prisma,auth,id){return withOwner(prisma,auth,async(tx,userId)=>resultDto(await owned(tx,userId,id)));}
