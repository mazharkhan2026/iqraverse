// Pure server-only preparation for v3.3 practice. No HTTP endpoints or persistence yet.
import {randomInt,randomUUID} from 'node:crypto';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
function fail(code,message){throw Object.assign(Error(message),{code});}
export function validateBuildQuiz(body){
  if(!body||!uuid(body.variantId)||!Array.isArray(body.topicIds)||!body.topicIds.length||!body.topicIds.every(uuid)||new Set(body.topicIds.map(x=>x.toLowerCase())).size!==body.topicIds.length||!['easy','medium','hard','mixed'].includes(body.difficulty)||!Number.isInteger(body.count)||body.count<1||body.count>100||('formats' in body&&(!Array.isArray(body.formats)||body.formats.length!==1||body.formats[0]!=='single_select')))fail('VALIDATION_ERROR','Invalid custom quiz request');
  return {variantId:body.variantId.toLowerCase(),topicIds:body.topicIds.map(x=>x.toLowerCase()),difficulty:body.difficulty,count:body.count,formats:['single_select']};
}
// Caller must enforce authenticated ownership and active secure mock block in a transaction.
// Rows are from trusted DB queries, never client input. Caller verifies current published edition.
export function selectPractice(req,rows,scope){
  req=validateBuildQuiz(req);
  if(!scope||scope.variantId!==req.variantId||!uuid(scope.syllabusVersionId)||scope.published!==true||!Array.isArray(scope.topicIds)||!req.topicIds.every(id=>scope.topicIds.includes(id)))fail('VALIDATION_ERROR','Topics must belong to active published syllabus');
  const pool=[];const seen=new Set();
  for(const r of rows){
    if(r.variantId!==scope.variantId||r.syllabusVersionId!==scope.syllabusVersionId||!req.topicIds.includes(r.topicId)||r.scope!=='platform'||r.format!=='single_select'||r.status!=='approved'||r.isCurrent!==true||r.rightsStatus!=='authorized'||r.rightsReviewed!==true||!(req.difficulty==='mixed'||r.difficulty===req.difficulty)||seen.has(r.questionId))continue;
    if(!uuid(r.questionId)||!uuid(r.id)||!['easy','medium','hard'].includes(r.difficulty)||!Array.isArray(r.optionsJson)||r.optionsJson.length!==4||r.optionsJson.some(o=>typeof o?.id!=='string'||!o.id||typeof o.label!=='string'||!o.label.trim())||new Set(r.optionsJson.map(o=>o.id)).size!==4||!r.optionsJson.some(o=>o.id===r.answerKeyJson?.optionId)||typeof r.prompt!=='string'||!r.prompt.trim()||typeof r.explanation!=='string'||!r.explanation.trim()||Number(r.marks)!==1)continue;
    seen.add(r.questionId);pool.push(r);
  }
  if(pool.length<req.count)fail('INSUFFICIENT_QUESTION_BANK','Not enough eligible questions');
  for(let i=pool.length-1;i>0;i--){const j=randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,req.count).map(r=>({id:randomUUID(),questionId:r.questionId,questionVersionId:r.id,topicId:r.topicId,format:'single_select',prompt:r.prompt,options:r.optionsJson.map(o=>({id:o.id,label:o.label})),marks:1,correctOptionId:r.answerKeyJson.optionId,explanation:r.explanation}));
}
export function publicItem(item){return {id:item.id,topicId:item.topicId,format:item.format,prompt:item.prompt,options:item.options.map(o=>({id:o.id,label:o.label})),marks:item.marks};}
// Only call after finalization under a DB lock; answers are saved server-side.
export function gradePractice(items,answers){
  if(!Array.isArray(items)||new Set(items.map(i=>i.id)).size!==items.length||!(answers instanceof Map))fail('VALIDATION_ERROR','Invalid attempt snapshot');
  const ids=new Set(items.map(i=>i.id));for(const key of answers.keys())if(!ids.has(key))fail('VALIDATION_ERROR','Unknown attempt item');
  let objectiveAnswered=0,objectiveCorrect=0;
  const review=items.map(i=>{if(i.marks!==1||!i.options.some(o=>o.id===i.correctOptionId))fail('INVALID_SNAPSHOT','Invalid stored answer key');const a=answers.has(i.id)?answers.get(i.id):null;if(a!==null&&(typeof a!=='string'||!i.options.some(o=>o.id===a)))fail('VALIDATION_ERROR','Answer must be an option ID');const correct=a===i.correctOptionId;if(a!==null)objectiveAnswered++;if(correct)objectiveCorrect++;return {itemId:i.id,submittedAnswer:a,correctAnswer:i.correctOptionId,explanation:i.explanation,gradingStatus:a===null?'unanswered':correct?'correct':'incorrect',earnedMarks:correct?1:0};});
  return {earnedMarks:objectiveCorrect,availableMarks:items.length,objectiveAnswered,objectiveCorrect,pendingReview:0,review};
}
