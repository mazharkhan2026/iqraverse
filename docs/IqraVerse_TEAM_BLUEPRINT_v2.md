# IqraVerse — Master Plan v2.0
24 November 2026 | 30% baseline | supersedes v1 and earlier MVP prompt where conflicting.

## Product
Self-preparation first: students independently prepare for MDCAT, NAT and IELTS; instructor courses are optional. Prototype v0.3 is the accepted initial UX baseline, not production code. Improvements go through shared review. No claim of official exam affiliation or production readiness.

## Ownership
Mazhar Khan: leader, Next.js web (student/instructor/admin), API contract review, integration. Anwar Zeb: Flutter student app, cross-platform tests. Azmat Ali: NestJS backend, PostgreSQL, auth, scoring, question bank, moderation, storage. All contribute verified questions and tests; Mazhar and Anwar assist backend tests to reduce Azmat's bottleneck. No unilateral shared contract changes.

## Milestones
30%: real signup/login/logout/profile/password recovery; student/instructor/admin roles; independent exam workspaces; custom quizzes from reviewed bank; randomized exam-pattern mocks; objective scoring and answer explanations from reviewed content; separate exam/variant/skill and practice/mock histories; weak-topic recommendations; optional instructor course enrollment and lessons/progress; teacher content/assessment management; admin user/category/source/question/course moderation and basic statistics. Use representative authorized content for all three exams, shortened mocks explicitly labeled until bank supports full patterns. IELTS objective reading/language practice and writing response capture; no fabricated band, no automatic writing/speaking grading. Listening/speaking full simulations deferred. No LLM dependency.
60%: Python/FastAPI, Ollama, local LLM, ChromaDB and local embeddings; RAG over approved sources; actual AI question generation with validation, explanations, adaptive practice, academic tutor; evaluate IELTS writing/speaking feedback feasibility and accuracy.
100%: advanced AI and assessment coverage, marketplace, sandbox payments/earnings, tutor booking, gamification, notifications and production hardening. These are planned milestones, not university-certified completion percentages.

## Stack
Approved proposal: Next.js 16.x/React 19.x, Flutter stable 3.x, Node LTS/NestJS 11.x, PostgreSQL 18.x or compatible, JWT/OAuth2, object storage, Docker, GitHub, Postman. Later AI stack as above, FCM and payment sandbox. Proposed implementation defaults for review: TypeScript, Prisma migrations, NestJS-managed JWT authentication with Argon2id and rotating refresh sessions, local PostgreSQL Docker for development, S3-compatible private object storage (provider pending), shared cloud staging later. Pin compatible versions after setup checks; no Supabase dependency assumed. Do not replace NestJS with FastAPI.

## Repository and coordination
One private GitHub monorepo: web/, mobile/, backend/, database/ (seed/reference SQL, not duplicate migration authority), docs/, tests/, .env.example, README, docker-compose.yml. Prisma migrations owned by backend. Feature branches, reviewed PRs into main, CI checks. GitHub is canonical; upload current approved docs to project sources. Never commit secrets. Shared API version /api/v1. Each member reports task, branch/PR, tests, blockers, contract changes, next action. ChatGPT flags incompatible, unsafe or fake functionality but cannot monitor chats or code automatically.

## Schedule (estimate, 3–4 hours each/day)
Day 1 setup and contract review; days 2–4 authentication vertical slice; days 5–9 independent preparation and scoring; days 10–13 course/instructor/admin; days 14–17 analytics and integration; days 18–21 testing, fixes, demo; allow buffer up to 25+ days. Prioritize end-to-end self-preparation over polish. Full exam banks and reliable AI grading may require substantial additional time.

## Done means
Real API and persisted data, backend permissions, input checks, answer keys protected, timer server enforced, no duplicate submissions, test evidence, reviewed PR, accessible/loading/error/empty states. Same user sees own records on web/mobile. No combined cross-exam score. No unverified capacity claims. Demo: register, create independent quiz, take mock, view separate analytics, switch devices; instructor creates optional course, admin approves, student enrolls. Document limitations.

## Release gate
Leader review of v2 and companion blueprint; GitHub invitation and clone; tools installed; shared OpenAPI reviewed; local health endpoint and client setup; then vertical slices. No production deployment or working app created by these documents. Architecture defaults proposed below are reversible until reviewed; changes affecting proposal require supervisor review.
# IqraVerse — Product Workflow v2.0
Supersedes v1.0. Self-preparation is independent of courses.

## Student
Register as student → login → dashboard → choose exam workspace (MDCAT, NAT variant, IELTS Academic initially) → Build My Quiz OR Exam Simulation → attempt → results → review → targeted practice. Courses are optional. Student-only mobile; web supports all roles. Same account and persisted records across clients.

Build My Quiz: choose exam variant, subject/skill, topics, difficulty, count and supported formats; backend selects eligible approved questions, avoids repeats where possible, reports insufficient inventory rather than silently changing count. Practice can show feedback after submission. Mock: choose published exam blueprint, backend samples section quotas and formats, fixes question order and timer, saves answers, submits on request/expiry. Distinct papers prioritized; no guarantee when bank exhausted. Full-length only if inventory and verified pattern support it. Store blueprint version and question snapshots. Never call shortened demos official exams.

Formats: MDCAT/NAT MCQ; IELTS reading single/multiple select, matching, fill-in, true/false/not given with passage; writing text captured as awaiting review, excluded from objective score. Listening/speaking and AI scoring deferred. Normalize objective text by trim/case rules per question, accepted alternatives, word-limit checks where required; matching and multiple select use exact set/map policy for MVP. Keep explicit scoring policy per blueprint. No combined band or cross-exam score. IELTS reading raw marks, estimated band only with verified conversion for appropriate full-length form; practice accuracy clearly labeled. No official score claims.

Results: exam variant → skill/subject → practice/mock filter → attempt history, raw marks, accuracy, review, weak topics. Weak rule: below 60% accuracy on at least 3 distinct answered objective questions within that exam/variant/topic; use latest graded answer per question version for mastery, no data = unassessed. Keep historical scores unchanged. Recommendations link to approved questions or available resources. Unanswered items count as zero for mock marks, excluded from mastery accuracy. Written items pending review not zero-scored.

## Instructor
Administrator-assigned role → own course draft → lessons and own questions/assessments → submit → admin review → publish approved revision → view necessary course-enrolled learner data only. No access to independent student preparation records. Free enrollment at milestone; no payments.

## Admin
Manage accounts/roles, exam variants, categories, blueprint versions, source rights, question review, courses and audit history. Only authorized/original sources. Draft → submitted → approved/published or rejected; unpublish without destroying historical attempts. Material updates create revision and require review. Privileged roles never self-assigned.

## Acceptance checks
- Signup/login/logout/recovery, persistent session; unauthorized and cross-account access rejected.
- Student without enrollment can build quiz and mock; correct section quota, no duplicate question, no answer key before submission; insufficient bank handled.
- Server clock, saved answers, expired attempt finalization, idempotent submission; historical version stable.
- Objective formats correctly scored; writing pending, no fake IELTS band; exam/variant and practice/mock isolation verified.
- Three distinct questions threshold, 60% not weak, no answers unassessed; recommendations relevant.
- Teacher ownership and admin review enforced; unpublished content inaccessible; course enrollment/progress idempotent.
- Same records visible after refresh on both clients. No raw errors, secrets or untested completion claims.
# Technical blueprint v0.1 — review baseline
## Architecture
Next.js web and Flutter mobile → HTTPS REST /api/v1 → NestJS modular monolith → PostgreSQL + private object storage. Future NestJS → separate FastAPI AI service → Ollama/ChromaDB. Clients never connect with database credentials. Modules: auth, users, catalog, sources, questions, blueprints, assessments, attempts, analytics, courses, moderation, audit. Server controls permissions, scoring and time. Local Docker PostgreSQL; shared staging when hosting selected. Mobile emulator uses host mapping (Android emulator 10.0.2.2), physical device uses LAN IP during development; production HTTPS. Web CORS explicit allowed origins. No production secrets in clients. Auth proposal: short JWT access, rotating hashed refresh tokens; web HttpOnly Secure SameSite cookies for refresh via same-site proxy; mobile secure storage; CSRF protection for cookie-based writes; rate limit auth; Argon2id password hash; reset tokens hashed, single use and expiry; email provider pending. Admin bootstrapped securely, never public signup. Check current role/suspension server-side.

## Logical ERD / schema design
All entity IDs UUID, timestamps UTC, snake_case DB, camelCase JSON. FK constraints and indexes on owner, variant, topic, status, attempt owner. Migrations canonical under backend/prisma. This is logical schema, not executed SQL.
- users(id,email unique,password_hash,status); profiles(user_id PK,display_name); roles(id,name unique); user_roles(user_id,role_id unique pair); refresh_sessions(id,user_id,token_hash,expires_at,revoked_at); reset_tokens(id,user_id,token_hash,expires_at,used_at).
- exams(id,code unique,name); exam_variants(id,exam_id,code unique within exam); subjects(id,variant_id,name); topics(id,subject_id,name). Exam→variant→subject→topic.
- sources(id,title,origin,rights_status,review_status,reviewer_id); passages(id,source_id,content,version); questions(id,owner_id,topic_id,source_id,visibility); question_versions(id,question_id,version,format,difficulty,prompt,passage_id,options_json,answer_key_json,explanation,status,marks, unique(question_id,version)). Immutable approved versions; answer key internal. Platform vs instructor scope explicit; approved platform bank only for independent tests.
- blueprints(id,variant_id,version,name,status,duration_seconds,scoring_policy_json,is_full_length); blueprint_sections(id,blueprint_id,subject_id,quota,allowed_formats_json). Verify current official pattern and source before publishing.
- assessments(id,variant_id,course_id nullable,owner_id nullable,mode,blueprint_id nullable,title,status); assessment_items(assessment_id,question_version_id,position,marks); attempts(id,user_id,assessment_id,variant_id,mode,status,started_at,deadline_at,submitted_at,earned_marks,available_marks,objective_answered,objective_correct); attempt_items(id,attempt_id,question_version_id,position,marks,presentation_snapshot_json); attempt_answers(attempt_item_id PK,answer_json,grading_status,earned_marks,updated_at). Snapshot immutable; use unique item positions and no duplicate question IDs per attempt; transaction locks on save/submit. Idempotency key unique per user/operation for creation retries. Expired attempts finalized by scheduled job and lazy server check.
- categories(id,name); courses(id,instructor_id,category_id,variant_id nullable,status,title,description); course_revisions(id,course_id,version,status,content_snapshot_json); lessons(id,course_id,position,title,content,storage_key nullable,required); enrollments(user_id,course_id unique pair); lesson_progress(user_id,lesson_id unique pair,completed_at); moderation_reviews(id,reviewer_id,target_type,target_id,decision,reason); audit_events(id,actor_id,action,target_type,target_id,metadata_json,created_at). Publish immutable approved revision; progress and access tied to published lessons; exact revision migration policy before course slice.
- Analytics initially computed from attempts and answers with indexed joins, not duplicated counters; latest distinct question-version evidence per exam variant/topic. Add cache later only if needed.

## API contract rules
JSON, UUID strings, UTC ISO timestamps, error {code,message,details?}; status 400 validation, 401 auth, 403 forbidden, 404 absent/inaccessible, 409 conflict/insufficient bank, 429 limits. Pagination limit/cursor. Token never in URL. No correct answers in attempt GET. See API_CONTRACT.yaml for initial executable-format OpenAPI draft covering first vertical slices. Later course/admin endpoint shapes must be agreed before implementation, not invented by clients.

## UX rules
Proposed baseline: dark #0D1117 background, #161B22 surfaces, coral #ED986E accent; high contrast text; 8px spacing grid; responsive web sidebar/mobile bottom nav. Student dashboard: exam workspaces, Build My Quiz, Exam Simulation, history, weak topics, optional courses. Instructor Studio and Admin separate protected web areas. Use loading/empty/error/retry states, keyboard navigation and readable labels. Do not label demo AI as real. Prototype v0.3 is reference, not source to copy wholesale.
# Day 1 — 25 November 2026
Leader: upload v2 documents to shared project sources; remove/archive v1 files from active sources only after confirming v2 available. Create private GitHub repository iqraverse, invite Anwar and Azmat using their own accounts, agree baseline, clone same repo. Do not share account passwords. Protect main where available; review every PR regardless. Start setup in individual chats.

Mazhar: install/check Git, Node LTS, editor; clone; create feature/web-foundation; scaffold Next.js TypeScript inside web/; responsive shell and API client; use contract mock data clearly labeled; no custom backend/database. Review auth and attempt screens. Commit and open PR.
Anwar: install/check Git, Flutter stable, Android Studio/SDK, run flutter doctor; clone; feature/mobile-foundation; scaffold Flutter in mobile/; create navigation and API client; use contract mocks; run on emulator/device. Commit and open PR.
Azmat: install/check Git, Node LTS, Docker, Postman; clone; feature/backend-foundation; scaffold NestJS in backend/; Docker PostgreSQL, env example, health endpoint, Swagger; review schema/auth defaults and migration strategy before auth implementation. No secret commits. Commit and open PR.
All: verify exact versions and lockfiles, run health endpoint test together, post branch/PR and test outputs. Day 2 start auth vertical slice only after shared contract approval. Add new features in order: exam catalog, approved bank, custom quiz, mock, scoring, analytics, course/instructor/admin. Integrate each slice immediately. If tooling blocked, report error and continue independent contract/UX review.

## Copy into each individual chat
Read IqraVerse_MASTER_PLAN_v2.md, IqraVerse_PRODUCT_WORKFLOW_v2.md, TECHNICAL_BLUEPRINT.md, API_CONTRACT.yaml and DAY_1.md from project sources. Follow my assigned role. Start Day 1 setup only; give one step at a time, exact commands for my OS after checking it, and verify each result. Do not change shared architecture or contracts without leader approval. Flag security or compatibility problems. No fake completion; end with test evidence and branch/PR status.

## Daily update
Member / task / branch or PR / completed / test evidence / blockers / proposed shared changes / next task.
