// Offline NSCT JSON staging importer. No HTTP route and no publication.
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const fixturePath = fileURLToPath(new URL('./fixtures/nsct-original-v1.json', import.meta.url));
const parserVersion = 'nsct-json-v1';
const hash = x => createHash('sha256').update(x).digest('hex');
const normalized = x => x.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
const isText = (x, max) => typeof x === 'string' && x.trim().length > 0 && x.length <= max;
const maxRows = 500;
const topicPattern = /^(NETWORKS_CLOUD|PROGRAMMING|DSA|OS|SE|WEB|AI_DATA|CYBER|DATABASES|PROBLEM_SOLVING)-\d{2}$/;
function validate(row) {
  const issues = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return ['Expected question object'];
  if (!isText(row.recordId, 120)) issues.push('Missing stable record ID');
  if (!isText(row.topicCode, 80) || !topicPattern.test(row.topicCode)) issues.push('Invalid topic code');
  if (!['easy','medium','hard'].includes(row.difficulty)) issues.push('Invalid difficulty');
  if (!isText(row.prompt, 12000)) issues.push('Invalid prompt');
  const validOptions = Array.isArray(row.options) && row.options.length === 4 && row.options.every(x => isText(x, 3000));
  if (!validOptions) issues.push('Exactly four nonempty options required');
  else if (new Set(row.options.map(normalized)).size !== 4) issues.push('Repeated options');
  if (!Number.isInteger(row.correctIndex) || row.correctIndex < 0 || row.correctIndex > 3) issues.push('Invalid answer index');
  if (!isText(row.explanation, 12000)) issues.push('Missing explanation');
  if (row.page != null && (!Number.isInteger(row.page) || row.page < 1)) issues.push('Invalid page');
  for (const field of ['section','questionNo']) if (row[field] != null && !isText(row[field], 120)) issues.push(`Invalid ${field}`);
  return issues;
}
function fingerprint(row) { return hash(JSON.stringify([normalized(row.prompt), row.options.map(normalized).sort()])); }
function prepare(rows) {
  const seenIds = new Set(), seenFingerprints = new Set();
  return rows.map((row, i) => {
    const issues = validate(row);
    const id = isText(row?.recordId, 120) ? row.recordId.trim() : null;
    // Internal reserved IDs keep malformed/repeated records individually traceable.
    const repeatId = id && seenIds.has(id);
    if (id) seenIds.add(id);
    if (!id || id.startsWith('~row:')) issues.push('Missing or reserved record ID');
    if (repeatId) issues.push('Repeated source record ID');
    const fp = issues.length === 0 ? fingerprint(row) : null;
    const duplicate = Boolean(repeatId || (fp && seenFingerprints.has(fp)));
    if (fp) seenFingerprints.add(fp);
    if (duplicate && !repeatId) issues.push('Exact normalized question duplicate');
    return {row, sourceRecordId: !id || repeatId || id.startsWith('~row:') ? `~row:${i+1}` : id, issues, fingerprint: fp,
      outcome: duplicate ? 'duplicate' : issues.length ? 'malformed' : 'valid'};
  });
}
function load(path) {
  if (statSync(path).size > 10 * 1024 * 1024) throw Error('Input exceeds 10 MiB');
  const raw = readFileSync(path);
  const rows = JSON.parse(raw.toString('utf8'));
  if (!Array.isArray(rows) || !rows.length || rows.length > maxRows) throw Error('Expected a JSON array of 1–500 records');
  return {raw, rows};
}
const totals = rows => Object.fromEntries(['valid','malformed','duplicate'].map(key=>[key,rows.filter(x=>x.outcome===key).length]));
function selfTest() {
  const r = load(fixturePath).rows[0];
  assert.deepEqual(validate(r), []);
  assert.ok(validate({...r,correctIndex:4}).length);
  assert.ok(validate({...r,options:['x','x','y','z']}).length);
  const records = prepare([r,{...r,recordId:'new',options:[...r.options].reverse()},{...r},null]);
  assert.deepEqual(records.map(x=>x.outcome),['valid','duplicate','duplicate','malformed']);
  assert.equal(new Set(records.map(x=>x.sourceRecordId)).size,4);
  console.log('Importer self-tests passed.');
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) { selfTest(); return; }
  const allowed = new Set(['--check','--apply','--admin','--file','--source-code','--source-version','--list-admins']);
  const vals = {};
  for (let i=0;i<args.length;i++) {
    const key=args[i]; if (!allowed.has(key) || key in vals) throw Error('Unknown or repeated argument: '+key);
    if (['--check','--apply','--list-admins'].includes(key)) vals[key]=true;
    else { const v=args[++i]; if (!v || v.startsWith('--')) throw Error('Missing value: '+key); vals[key]=v; }
  }
  if (vals['--check'] && vals['--apply']) throw Error('Choose check OR apply');
  const fixture = !vals['--file'];
  const {raw,rows}=load(vals['--file'] || fixturePath);
  const prepared=prepare(rows);
  if (!vals['--apply'] && !vals['--list-admins']) {console.log('Input validation (no database changes):',totals(prepared)); return;}
  await import('dotenv/config');
  const {PrismaClient,Prisma}=await import('@prisma/client');
  const {PrismaPg}=await import('@prisma/adapter-pg');
  if (!process.env.DATABASE_URL) throw Error('Missing DATABASE_URL');
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  const adminFilter={status:'active',emailVerifiedAt:{not:null},roles:{some:{revokedAt:null,role:{name:'admin'}}}};
  try {
    if (vals['--list-admins']) {const users=await prisma.user.findMany({where:adminFilter,select:{email:true}});console.log(users.map(u=>u.email));return;}
    if (!vals['--admin']) throw Error('Use --admin with an existing verified active admin email');
    if (!fixture && (!vals['--source-code'] || !/^\d+$/.test(vals['--source-version']||'') || !Number.isSafeInteger(Number(vals['--source-version'])) || Number(vals['--source-version'])<1)) throw Error('External imports require an existing reviewed source code and version');
    const checksum=hash(raw);
    const result=await prisma.$transaction(async tx=>{
      // Serialize this offline importer (all runs using this script). Serializable transaction adds race detection.
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(37123001)`;
      const admin=await tx.user.findFirst({where:{...adminFilter,email:vals['--admin'].trim().toLowerCase()},select:{id:true}});
      if (!admin) throw Error('No matching verified active admin; no changes made');
      const sourceCode=fixture?'NSCT_ORIGINAL_FIXTURE':vals['--source-code'];
      const version=fixture?1:Number(vals['--source-version']);
      let source=await tx.source.findUnique({where:{code_version:{code:sourceCode,version}}});
      if (fixture && !source) source=await tx.source.create({data:{code:sourceCode,version,title:'AI-generated original NSCT development fixtures (unreviewed)',checksum,rightsStatus:'pending'}});
      if (!source || source.checksum!==checksum) throw Error('Source checksum does not match the reviewed source version');
      if (fixture ? !['pending','authorized'].includes(source.rightsStatus) : source.rightsStatus!=='authorized'||!source.rightsEvidence||!source.reviewedById||!source.reviewedAt) throw Error('Source rights not eligible for import');
      const existing=await tx.importBatch.findUnique({where:{sourceId_inputChecksum_parserVersion:{sourceId:source.id,inputChecksum:checksum,parserVersion}}});
      if (existing) return {alreadyImported:true,batchId:existing.id,status:existing.status};
      const topics=await tx.topic.findMany({where:{chapter:{code:'TOPICS',subject:{syllabusVersion:{edition:'annexure-a-v1',status:{in:['draft','published']},variant:{code:'IT_GRADUATES',exam:{code:'NSCT'}}}}}},select:{id:true,code:true}});
      if (topics.length!==149||new Set(topics.map(t=>t.code)).size!==149) throw Error('Expected exactly 149 uniquely coded seeded NSCT topics');
      const topicIds=new Map(topics.map(t=>[t.code,t.id]));
      const fingerprints=prepared.map(p=>p.fingerprint).filter(Boolean);
      const prior=await tx.importStagingRecord.findMany({where:{fingerprint:{in:fingerprints}},select:{fingerprint:true}});
      const priorVersions=await tx.questionVersion.findMany({where:{fingerprint:{in:fingerprints}},select:{fingerprint:true}});
      const seen=new Set([...prior,...priorVersions].map(x=>x.fingerprint));
      const batch=await tx.importBatch.create({data:{sourceId:source.id,createdById:admin.id,inputChecksum:checksum,parserVersion,status:'processing',expectedCount:rows.length}});
      const data=prepared.map(p=>{
        const r=p.row, topicId=topicIds.get(r?.topicCode);
        if (p.outcome==='valid'&&!topicId) {p.issues.push('Topic not found in NSCT edition');p.outcome='malformed';}
        if (p.outcome==='valid'&&seen.has(p.fingerprint)) {p.issues.push('Exact duplicate in existing bank/staging');p.outcome='duplicate';}
        if (p.fingerprint) seen.add(p.fingerprint);
        const payload=p.outcome==='valid'?{prompt:r.prompt,optionsJson:r.options.map((label,i)=>({id:'ABCD'[i],label})),answerKeyJson:{optionId:'ABCD'[r.correctIndex]},explanation:r.explanation,marks:1}:null;
        return {batchId:batch.id,sourceRecordId:p.sourceRecordId,sourcePage:Number.isInteger(r?.page)&&r.page>0?r.page:null,sourceSection:isText(r?.section,120)?r.section:null,sourceQuestionNo:isText(r?.questionNo,120)?r.questionNo:null,parserOutcome:p.outcome,reviewStatus:p.outcome==='valid'&&source.rightsStatus==='authorized'?'pending':'quarantined',payload:payload??Prisma.DbNull,issues:p.issues,fingerprint:p.fingerprint,topicId:topicId??null,difficulty:['easy','medium','hard'].includes(r?.difficulty)?r.difficulty:null};
      });
      await tx.importStagingRecord.createMany({data});
      await tx.importBatch.update({where:{id:batch.id},data:{status:'completed',completedAt:new Date()}});
      return {batchId:batch.id,processed:rows.length,...totals(prepared),pending:data.filter(x=>x.reviewStatus==='pending').length,quarantined:data.filter(x=>x.reviewStatus==='quarantined').length,published:0};
    },{isolationLevel:'Serializable',timeout:60000});
    console.log(result);
  } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
