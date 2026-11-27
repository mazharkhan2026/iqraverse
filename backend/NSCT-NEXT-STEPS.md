# IqraVerse NSCT backend — steps 7–9 development package

Base: feature/backend-foundation, commit 7579a534c9578dc0ff164c610adca3ad28394acb. Proposed against the v3.3 blueprint and API contract. No schema/migration changes. This is a review package, not a deployed feature. GitHub connector rejected the upload with HTTP 403.

## Install
Extract into `iqraverse/backend` so `prisma/import-nsct.mjs`, `prisma/admin-nsct.mjs`, `prisma/fixtures/nsct-original-v1.json`, and `src/attempts/practice-core*.mjs` exist. Do not overwrite divergent files; inspect first. The importer and fixture are unchanged from the earlier ZIP. Use Node 22+; the package tests ran with Node 22.16.0, not your local Node 24.22.1.

```powershell
node prisma/import-nsct.mjs --self-test
node prisma/import-nsct.mjs --check
node prisma/admin-nsct.mjs --self-test
node --test src/attempts/practice-core.test.mjs
```

Tests pass without database. Database execution is untested. For integration, Docker must be running, all five migrations applied, Prisma Client generated, roles seeded and NSCT draft syllabus seeded. Review code with team before use.

## Admin and staging (trusted local DB operator only)
`node prisma/import-nsct.mjs --list-admins` lists active verified admins. If none, nominate a verified active existing user with team approval and run `node prisma/admin-nsct.mjs bootstrap <email> --confirm-first-admin` once; no verification bypass or public admin endpoint. If no verified account exists, finish reviewed email verification flow first. The bootstrap uses role-grant metadata but dedicated audit events are still pending. Do not use this local script in production; the email identifies the actor, it does not authenticate them. The trusted operator controls DB credentials.

`node prisma/import-nsct.mjs --apply --admin <email>` stages the 10 AI-generated development fixtures. The importer does not publish. `node prisma/admin-nsct.mjs list <email>` shows original fixture source and records. Keep outputs private (answer keys). Review actual source, rights and correctness before any approvals. With actual written permission/evidence, run `node prisma/admin-nsct.mjs authorize-source <email> <source-uuid> <exact-sha256> <rights-evidence-file>`. Then read each record and run `node prisma/admin-nsct.mjs review <email> <staging-uuid> approve|reject <review-notes-file>` after real human review. Do not use placeholder approvals. The script authorizes only the original fixture source, not external datasets. Evidence/notes are stored in the DB; do not commit private evidence or datasets. No syllabus publication is performed. Database permissions, audit trail, immutable approved versions and rights revocation workflow must be completed before production exposure.

## Practice core
`practice-core.mjs` is a standalone, NSCT four-option +1/0/0 prototype. Validates v3.3 BuildQuiz input; selects eligible approved/current, authorized/reviewed platform questions within a caller-provided published variant/edition; excludes duplicates and fails on shortages; creates server-side snapshot and public DTO without keys; grades correct/wrong/skipped. The caller must obtain trustworthy scope and candidates from DB, enforce ownership, idempotency and active mock restrictions, save snapshots, serialize answer/finalize and gate results. No endpoints or attempt persistence yet. Do not expose core snapshots directly. IELTS 3-option items are not supported by this NSCT prototype. Full NSCT mock needs 100 eligible questions across quotas and approved duration/count evidence; 10 fixtures cannot satisfy it.

## Git
From backend after review and local tests:
```powershell
git add prisma/import-nsct.mjs prisma/admin-nsct.mjs prisma/fixtures/nsct-original-v1.json src/attempts/practice-core.mjs src/attempts/practice-core.test.mjs NSCT-NEXT-STEPS.md
git diff --cached --name-only
git commit -m "feat: add NSCT staging, review and practice core"
git push origin feature/backend-foundation
```
Never include secrets or the third-party bank. Review PR before merging main.
