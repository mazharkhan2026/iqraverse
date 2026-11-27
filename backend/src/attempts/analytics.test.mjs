import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {topicPerformance} from './analytics-core.mjs';
import {listHistory,getProgress} from './analytics-persistence.mjs';
const topics=[{id:'a',name:'A'},{id:'b',name:'B'}];
const row=(questionId,isCorrect,topicId='a')=>({questionId,isCorrect,topicId});
const metric=rows=>topicPerformance(topics,rows)[0];
test('no graded answer is unassessed, including skipped questions',()=>{assert.deepEqual(metric([row('1',null)]),{topicId:'a',topicName:'A',distinctAnswered:0,accuracy:null,status:'unassessed'});});
test('fewer than three distinct answers is insufficient',()=>{assert.equal(metric([row('1',false),row('2',false)]).status,'insufficient');});
test('below 60 percent with adequate sample is weak',()=>{const p=metric([row('1',true),row('2',false),row('3',false)]);assert.equal(p.status,'weak');assert.equal(p.accuracy,100/3);});
test('exact 60 percent is not weak',()=>{const p=metric([row('1',true),row('2',true),row('3',true),row('4',false),row('5',false)]);assert.equal(p.accuracy,60);assert.equal(p.status,'not_weak');});
test('retries use latest graded answer; skipped retries cannot override',()=>{const p=metric([row('1',null),row('1',false),row('1',true),row('2',true),row('3',false)]);assert.equal(p.distinctAnswered,3);assert.equal(p.accuracy,100/3);});
test('topics cannot contribute to each other',()=>{const p=topicPerformance(topics,[row('1',true),row('1',false,'b'),row('2',true,'unknown')]);assert.equal(p[0].accuracy,100);assert.equal(p[1].accuracy,0);});
const userId=randomUUID(),familyId=randomUUID(),variantId=randomUUID(),syllabusVersionId=randomUUID();
const auth={user:{id:userId},familyId};
const makeResult=()=>({id:randomUUID(),mode:'practice',status:'submitted',variantId,syllabusVersionId,submittedAt:new Date(),assessment:{blueprintId:null},integrityPolicy:{required:false},countedViolations:0,flagged:false,completionReason:'user_submit',resultSnapshot:{earnedMarks:1,availableMarks:1,objectiveAnswered:1,objectiveCorrect:1,pendingReview:0,review:[]}});
function db({active=false,edition=true,session=true,history=[],cursor=null}={}){
 const calls={};const tx={
  $queryRaw:async(strings,...params)=>{const sql=strings.join('?');if(sql.includes('FOR UPDATE'))return [{id:userId}];calls.raw={sql,params};return [row('1',true)];},
  authSessionFamily:{findFirst:async()=>session?{id:familyId}:null},
  syllabusVersion:{findFirst:async({where})=>{calls.edition=where;return edition?{id:syllabusVersionId}:null;}},
  topic:{findMany:async({where})=>{calls.topics=where;return topics;}},
  attempt:{findFirst:async({where})=>where.status==='active'?(active?{id:randomUUID()}:null):(calls.cursor=where,cursor),findMany:async(args)=>{calls.history=args;return history;}}
 };return {calls,$transaction:async fn=>fn(tx)};
}
test('progress is owner and edition scoped; all excludes course',async()=>{const d=db();const p=await getProgress(d,auth,variantId);assert.equal(p.mode,'all');assert.equal(p.syllabusVersionId,syllabusVersionId);assert.deepEqual(d.calls.raw.params,[userId,variantId,syllabusVersionId,'all','all']);assert.match(d.calls.raw.sql,/IN \('practice','mock'\)/);assert.match(d.calls.raw.sql,/DISTINCT ON/);assert.match(d.calls.raw.sql,/ans\.is_correct IS NOT NULL/);assert.match(d.calls.raw.sql,/src\.rights_status::text='authorized'/);assert.equal(d.calls.edition.status,'published');assert.equal(p.topics[0].accuracy,100);});
test('explicit mock/course scope is passed to query',async()=>{for(const mode of ['mock','course']){const d=db();assert.equal((await getProgress(d,auth,variantId,{mode,syllabusVersionId})).mode,mode);assert.equal(d.calls.edition.id,syllabusVersionId);assert.deepEqual(d.calls.raw.params.slice(-2),[mode,mode]);}});
test('progress and history blocked during active mock',async()=>{const d=db({active:true});await assert.rejects(getProgress(d,auth,variantId),{code:'ACTIVE_SECURE_MOCK'});await assert.rejects(listHistory(d,auth,{variantId}),{code:'ACTIVE_SECURE_MOCK'});assert.equal(d.calls.raw,undefined);assert.equal(d.calls.history,undefined);});
test('invalid scope, unauthorized edition and inactive session rejected',async()=>{await assert.rejects(async()=>getProgress(db(),auth,'bad'),{code:'VALIDATION_ERROR'});await assert.rejects(getProgress(db({edition:false}),auth,variantId),{code:'NOT_FOUND'});await assert.rejects(getProgress(db({session:false}),auth,variantId),{code:'UNAUTHENTICATED'});});
test('history page scoped and stable; only finalized results',async()=>{const rows=[makeResult(),makeResult(),makeResult()];const d=db({history:rows});const r=await listHistory(d,auth,{variantId,limit:'2'});assert.equal(r.items.length,2);assert.equal(r.nextCursor,rows[1].id);assert.equal(d.calls.history.take,3);assert.equal(d.calls.history.where.userId,userId);assert.equal(d.calls.history.where.syllabusVersionId,syllabusVersionId);assert.deepEqual(d.calls.history.where.mode.in,['practice','mock']);assert.deepEqual(d.calls.history.where.status.in,['submitted','expired']);assert.deepEqual(d.calls.history.where.OR,[{mode:{not:'mock'}},{sessionFamilyId:familyId}]);assert.deepEqual(d.calls.history.orderBy,[{submittedAt:'desc'},{id:'desc'}]);assert.equal(r.items[0].attemptId,rows[0].id);});
test('cursor must belong to scoped history and pagination uses keyset',async()=>{const r=makeResult(),d=db({history:[],cursor:r});const page=await listHistory(d,auth,{variantId,cursor:r.id,mode:'practice'});assert.equal(page.nextCursor,null);assert.equal(d.calls.cursor.userId,userId);assert.equal(d.calls.cursor.id,r.id);assert.deepEqual(d.calls.history.where.AND,[{OR:[{submittedAt:{lt:r.submittedAt}},{submittedAt:r.submittedAt,id:{lt:r.id}}]}]);await assert.rejects(listHistory(db(),auth,{variantId,cursor:r.id}),{code:'VALIDATION_ERROR'});});
test('history rejects bad query and never returns active result',async()=>{for(const q of [{limit:'101'},{limit:['1']},{mode:'all'},{cursor:'bad'}])await assert.rejects(async()=>listHistory(db(),auth,{variantId,...q}),{code:'VALIDATION_ERROR'});await assert.rejects(listHistory(db({history:[{...makeResult(),status:'active'}]}),auth,{variantId}),{code:'ATTEMPT_ACTIVE'});});
