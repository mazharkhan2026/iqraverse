// Offline trusted database operator only. No HTTP endpoint or automatic verification.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const adminFilter={status:'active',emailVerifiedAt:{not:null},roles:{some:{revokedAt:null,role:{name:'admin'}}}};
const email=x=>x.trim().toLowerCase();
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const nonempty=(x,max=12000)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
const norm=x=>x.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase();
function checkPayload(p){
  if(!p||!nonempty(p.prompt)||!nonempty(p.explanation)||p.marks!==1||!Array.isArray(p.optionsJson)||p.optionsJson.length!==4) throw Error('Invalid NSCT payload');
  if(p.optionsJson.some((o,i)=>!o||o.id!=='ABCD'[i]||!nonempty(o.label,3000))||new Set(p.optionsJson.map(o=>norm(o.label))).size!==4||!p.answerKeyJson||Object.keys(p.answerKeyJson).length!==1||!p.optionsJson.some(o=>o.id===p.answerKeyJson.optionId)) throw Error('Invalid NSCT options or key');
  return createHash('sha256').update(JSON.stringify([norm(p.prompt),p.optionsJson.map(o=>norm(o.label)).sort()])).digest('hex');
}
function rightsOk(s){return s?.rightsStatus==='authorized'&&nonempty(s.rightsEvidence)&&s.reviewedById&&s.reviewedAt;}
function test(){const p={prompt:'What is 1+1?',explanation:'Addition',marks:1,optionsJson:['1','2','3','4'].map((label,i)=>({id:'ABCD'[i],label})),answerKeyJson:{optionId:'B'}};assert.equal(checkPayload(p).length,64);assert.throws(()=>checkPayload({...p,answerKeyJson:{optionId:'Z'}}));assert.throws(()=>checkPayload({...p,marks:2}));assert.throws(()=>checkPayload({...p,optionsJson:p.optionsJson.map(o=>({...o,label:'same'}))}));assert.ok(!rightsOk({rightsStatus:'pending'}));console.log('Admin validation self-tests passed.');}
const usage=`Trusted local operator commands (no automatic approval):
  bootstrap <verified-existing-email> --confirm-first-admin
  list <admin-email>
  authorize-source <admin-email> <source-uuid> <exact-sha256> <rights-evidence-file>
  review <admin-email> <staging-uuid> approve|reject <review-notes-file>
  --self-test`;
async function main(){
  const [cmd,...args]=process.argv.slice(2);if(cmd==='--self-test'){test();return;}if(!cmd||cmd==='--help'){console.log(usage);return;}
  const lengths={bootstrap:2,list:1,'authorize-source':4,review:4};if(!Object.hasOwn(lengths,cmd)||args.length!==lengths[cmd])throw Error(usage);
  if(cmd==='bootstrap'&&args[1]!=='--confirm-first-admin')throw Error('Explicit first-admin confirmation required');
  if(cmd==='review'&&(!uuid(args[1])||!['approve','reject'].includes(args[2])))throw Error('Invalid record ID or decision');
  if(cmd==='authorize-source'&&(!uuid(args[1])||!/^([a-f0-9]{64})$/.test(args[2])))throw Error('Invalid source ID or checksum');
  const note=['review','authorize-source'].includes(cmd)?readFileSync(args[3],'utf8').trim():null;
  if(note!==null&&!nonempty(note,8000))throw Error('Evidence/notes must contain 1–8000 characters');
  await import('dotenv/config');const {PrismaClient}=await import('@prisma/client');const {PrismaPg}=await import('@prisma/adapter-pg');
  if(!process.env.DATABASE_URL)throw Error('Missing DATABASE_URL');
  if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname)||process.env.NODE_ENV==='production')throw Error('Local non-production database only');
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try{const result=await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(37123001)`;
    if(cmd==='bootstrap'){
      const role=await tx.role.findUnique({where:{name:'admin'}});if(!role)throw Error('Run role seed first');
      if(await tx.userRole.count({where:{roleId:role.id}}))throw Error('Admin grant history exists; bootstrap disabled');
      const user=await tx.user.findFirst({where:{email:email(args[0]),status:'active',emailVerifiedAt:{not:null}}});if(!user)throw Error('Existing active verified account required; no verification bypass');
      await tx.userRole.create({data:{userId:user.id,roleId:role.id}});return {firstAdminGranted:user.id};
    }
    const admin=await tx.user.findFirst({where:{...adminFilter,email:email(args[0])},select:{id:true}});if(!admin)throw Error('Verified active administrator required');
    if(cmd==='list')return {sources:await tx.source.findMany({where:{code:'NSCT_ORIGINAL_FIXTURE'},select:{id:true,code:true,version:true,checksum:true,rightsStatus:true}}),records:await tx.importStagingRecord.findMany({where:{batch:{source:{code:'NSCT_ORIGINAL_FIXTURE'}}},select:{id:true,sourceRecordId:true,parserOutcome:true,reviewStatus:true,payload:true},orderBy:{sourceRecordId:'asc'},take:100})};
    if(cmd==='authorize-source'){
      const s=await tx.source.findUnique({where:{id:args[1]}});if(!s||s.code!=='NSCT_ORIGINAL_FIXTURE'||s.checksum!==args[2]||s.rightsStatus!=='pending')throw Error('Expected matching pending original fixture source; external rights workflow not implemented');
      await tx.source.update({where:{id:s.id},data:{rightsStatus:'authorized',rightsEvidence:note,reviewedById:admin.id,reviewedAt:new Date()}});
      await tx.importStagingRecord.updateMany({where:{batch:{sourceId:s.id},parserOutcome:'valid',reviewStatus:'quarantined'},data:{reviewStatus:'pending'}});return {sourceAuthorized:s.id};
    }
    const r=await tx.importStagingRecord.findUnique({where:{id:args[1]},include:{batch:{include:{source:true}}}});
    if(!r||r.batch.source.code!=='NSCT_ORIGINAL_FIXTURE'||r.reviewStatus!=='pending'||r.parserOutcome!=='valid'||r.questionVersionId||!rightsOk(r.batch.source)||r.batch.status!=='completed')throw Error('Record is not eligible for review');
    const topic=r.topicId?await tx.topic.findUnique({where:{id:r.topicId},include:{chapter:{include:{subject:true}}}}):null;
    const s=topic?await tx.syllabusVersion.findUnique({where:{id:topic.chapter.subject.syllabusVersionId},include:{variant:{include:{exam:true}}}}):null;if(!s||s.variant.exam.code!=='NSCT'||s.variant.code!=='IT_GRADUATES'||s.edition!=='annexure-a-v1'||!['draft','published'].includes(s.status)||!['easy','medium','hard'].includes(r.difficulty))throw Error('Invalid NSCT topic or difficulty');
    const fp=checkPayload(r.payload);if(fp!==r.fingerprint)throw Error('Payload fingerprint mismatch');
    if(await tx.questionVersion.findFirst({where:{OR:[{fingerprint:fp},{sourceId:r.batch.sourceId,sourceRecordId:r.sourceRecordId}]}}))throw Error('Existing question version; duplicate review blocked');
    // Even rejected content has an explicit review record; it is never current or eligible.
    const approved=args[2]==='approve';const question=await tx.question.create({data:{topicId:r.topicId,scope:'platform'}});
    const v=await tx.questionVersion.create({data:{questionId:question.id,version:1,sourceId:r.batch.sourceId,sourceRecordId:r.sourceRecordId,sourcePage:r.sourcePage,difficulty:r.difficulty,prompt:r.payload.prompt,optionsJson:r.payload.optionsJson,answerKeyJson:r.payload.answerKeyJson,explanation:r.payload.explanation,marks:1,fingerprint:fp,status:approved?'approved':'rejected',isCurrent:approved,shuffleOptions:false}});
    await tx.moderationReview.create({data:{questionVersionId:v.id,reviewerId:admin.id,decision:args[2],notes:note}});
    await tx.importStagingRecord.update({where:{id:r.id},data:{questionVersionId:v.id,reviewStatus:approved?'approved':'rejected'}});return {recordId:r.id,decision:args[2],versionId:v.id,syllabusStatus:s.status};
  },{isolationLevel:'Serializable',timeout:30000});console.log(JSON.stringify(result,null,2));}finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
