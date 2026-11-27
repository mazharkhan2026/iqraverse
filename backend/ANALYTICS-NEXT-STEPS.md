# Step 12 — Results history and topic analytics (v3.3)

## Install
Prerequisites: Step 11 files and seventh migration applied; Prisma Client generated, AttemptsModule registered in AppModule. Commit or back up current code. Extract the ZIP into backend. It adds analytics-core.mjs, analytics-persistence.mjs, analytics.controller.js and analytics.test.mjs, and replaces src/attempts/attempts.module.js (review if locally modified). No database migration, new package, or AppModule edit is needed. No data is seeded, approved or published.

Run from backend:

```
node --test src/attempts/analytics.test.mjs src/attempts/mock-engine.test.mjs src/attempts/practice-persistence.test.mjs
npm.cmd run start:dev
```

13 new tests and 12 prior tests passed in the supplied-code environment (Node 22.16.0, simulated DB). Actual PostgreSQL SQL, Prisma client, NestJS/Babel and Swagger startup are not exercised here. Test with your local Node version and DB.

## API
- GET /api/v1/attempts?variantId=<uuid>&mode=practice&limit=20 ; optional syllabusVersionId and cursor (returned nextCursor). Omitted mode = independent practice/mock only; explicit course mode returns course records only, if they exist. Returns {items: Result[], nextCursor: UUID|null}. Only finalized owner results. Mock history restricted to bound session family in keeping with Step 11's stricter result policy; review with team to support historical cross-session retrieval (contract specifies finalized owner).
- GET /api/v1/progress/<variantId>?mode=all ; optional syllabusVersionId, mode practice/mock/course/all. Default all = independent practice and mock only. Returns {variantId, syllabusVersionId, mode, topics:[{topicId,topicName,distinctAnswered,accuracy,status}]}.
- Both routes use existing bearer guard and owner-row lock and fail with 409 during an active secure mock (including other sessions on same account). Both restrict edition access to active variant/exam and published edition pending archived-edition authorization. Progress selects latest finalized eligible graded answer per topic/logical question using PostgreSQL DISTINCT ON with deterministic order submitted_at, saved_at, item UUID. Skipped/ungraded items excluded. Reviewed authorized sources and approved versions only; historical versions need not be current. Accuracy is not rounded; weak threshold uses integer comparison. No raw question content or answer keys in progress. History includes finalized Result review per contract. Source revocation handling in historical review remains a shared outstanding policy. UI can explain weak trigger from distinctAnswered/status/accuracy; links to eligible reviewed lessons require the later course/resource catalog, not implemented here.

## Real integration test checklist
Use a development database, an active verified account, published authorized NSCT syllabus, and approved original questions. Do not bypass verification or approval. Use the approved auth transport or a trusted internal test harness to obtain a legitimate token. Test no answers, 1–2 answers, 3 answers below 60%, exactly 60% at 5 answers, same logical question repeated with changed correctness, skipped retry, revoked source exclusion, scope isolation by user/variant/edition/mode, expired and submitted attempts, pagination with identical submission times, foreign cursor, active secure mock blocking in same and different session, and history response shape. Inspect actual SQL query performance on representative data before adding indexes. Full auth transport, reviewed content, blueprint evidence, expiry scheduling, immutable snapshots, audited lost-session recovery, source revocation in result review, and course/other exam flows remain release gates. No GitHub push performed; previous permission error remains unresolved.

After local tests:
```
git add src/attempts/analytics-core.mjs src/attempts/analytics-persistence.mjs src/attempts/analytics.controller.js src/attempts/analytics.test.mjs src/attempts/attempts.module.js ANALYTICS-NEXT-STEPS.md
git --no-pager diff --cached --name-only
git commit -m "feat: finalized attempt history and topic analytics"
git push origin feature/backend-foundation
```
