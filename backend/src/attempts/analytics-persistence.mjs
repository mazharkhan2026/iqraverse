import { fail, uuid, withOwner, resultDto } from './practice-persistence.mjs';
import { topicPerformance } from './analytics-core.mjs';
const modes = ['practice','mock','course'];
function scope(variantId, query, history = false) {
  if (!query || typeof query !== 'object' || Array.isArray(query) || !uuid(variantId) || (query.syllabusVersionId !== undefined && !uuid(query.syllabusVersionId))) fail('VALIDATION_ERROR','Invalid variant or syllabus ID');
  const mode = query.mode === undefined ? 'all' : query.mode;
  if ((history && query.mode === 'all') || ![...modes,'all'].includes(mode)) fail('VALIDATION_ERROR','Invalid mode');
  return {variantId:variantId.toLowerCase(), syllabusVersionId:query.syllabusVersionId?.toLowerCase(), mode};
}
async function resolveEdition(tx, q) {
  // Same published-only authorization policy as Step 11 catalog; archived access requires review.
  const edition = await tx.syllabusVersion.findFirst({where:{variantId:q.variantId,status:'published',...(q.syllabusVersionId?{id:q.syllabusVersionId}:{}),variant:{isActive:true,exam:{isActive:true}}},select:{id:true}});
  if (!edition) fail('NOT_FOUND','Published syllabus not found');
  return edition.id;
}
const finalStatuses = ['submitted','expired'];
export function listHistory(prisma, auth, query = {}) {
  const q = scope(query?.variantId,query,true);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if ((query.limit !== undefined && (!['string','number'].includes(typeof query.limit) || !/^[1-9][0-9]*$/.test(String(query.limit)))) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (query.cursor !== undefined && !uuid(query.cursor))) fail('VALIDATION_ERROR','Invalid cursor or limit');
  return withOwner(prisma,auth,async(tx,userId,familyId)=>{
    const syllabusVersionId = await resolveEdition(tx,q);
    const where = {userId,variantId:q.variantId,syllabusVersionId,mode:{in:q.mode==='all'?['practice','mock']:[q.mode]},status:{in:finalStatuses},submittedAt:{not:null},earnedMarks:{not:null},
      // Preserve Step 11's stricter result policy until lost-session recovery is reviewed.
      OR:[{mode:{not:'mock'}},{sessionFamilyId:familyId}]};
    let after = {};
    if(query.cursor !== undefined){
      const cursor = await tx.attempt.findFirst({where:{...where,id:query.cursor.toLowerCase()},select:{id:true,submittedAt:true}});
      if(!cursor) fail('VALIDATION_ERROR','Invalid history cursor');
      after={AND:[{OR:[{submittedAt:{lt:cursor.submittedAt}},{submittedAt:cursor.submittedAt,id:{lt:cursor.id}}]}]};
    }
    const rows=await tx.attempt.findMany({where:{...where,...after},orderBy:[{submittedAt:'desc'},{id:'desc'}],take:limit+1,include:{assessment:{select:{blueprintId:true}}}});
    // A finalized record must have a valid snapshot; resultDto fails closed if not.
    return {items:rows.slice(0,limit).map(resultDto),nextCursor:rows.length>limit?rows[limit-1].id:null};
  });
}
export function getProgress(prisma,auth,variantId,query={}) {
  const q=scope(variantId,query);
  return withOwner(prisma,auth,async(tx,userId)=>{
    const syllabusVersionId=await resolveEdition(tx,q);
    const topics=await tx.topic.findMany({where:{chapter:{subject:{syllabusVersionId}}},select:{id:true,name:true},orderBy:[{chapter:{subject:{sortOrder:'asc'}}},{chapter:{sortOrder:'asc'}},{sortOrder:'asc'},{id:'asc'}]});
    // Parameterized SQL; distinct selection is performed by Postgres, not the client.
    // A newer unanswered attempt never supersedes an earlier eligible graded answer.
    const rows=await tx.$queryRaw`
      SELECT DISTINCT ON (i.topic_id,i.question_id)
        i.topic_id AS "topicId", i.question_id AS "questionId", ans.is_correct AS "isCorrect"
      FROM attempt_items i
      JOIN attempts a ON a.id=i.attempt_id
      JOIN attempt_answers ans ON ans.item_id=i.id
      JOIN question_versions qv ON qv.id=i.question_version_id AND qv.question_id=i.question_id
      JOIN sources src ON src.id=qv.source_id
      JOIN questions q ON q.id=i.question_id AND q.topic_id=i.topic_id
      JOIN topics t ON t.id=i.topic_id
      JOIN chapters c ON c.id=t.chapter_id
      JOIN subjects s ON s.id=c.subject_id
      WHERE a.user_id=${userId}::uuid AND a.variant_id=${q.variantId}::uuid
        AND a.syllabus_version_id=${syllabusVersionId}::uuid AND s.syllabus_version_id=a.syllabus_version_id
        AND a.status::text IN ('submitted','expired') AND a.submitted_at IS NOT NULL AND a.earned_marks IS NOT NULL
        AND ans.is_correct IS NOT NULL AND ans.earned_marks IS NOT NULL
        AND qv.status::text='approved' AND src.rights_status::text='authorized'
        AND src.reviewed_at IS NOT NULL AND src.reviewed_by_id IS NOT NULL AND length(trim(src.rights_evidence))>0
        AND ((${q.mode}='all' AND a.mode::text IN ('practice','mock')) OR a.mode::text=${q.mode})
        AND (a.mode::text='course' OR q.scope::text='platform')
      ORDER BY i.topic_id,i.question_id,a.submitted_at DESC,ans.saved_at DESC,i.id DESC`;
    return {variantId:q.variantId,syllabusVersionId,mode:q.mode,topics:topicPerformance(topics,rows)};
  });
}
