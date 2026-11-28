# IqraVerse mobile development log

## Milestone 01 — Application shell (2026-11-28)

Branch: feature/mobile-foundation. Baseline: team blueprint and API contract v3.3.

- 0078dae: restore missing AppColors constants using dart:ui.
- 1e78ae1: branded welcome screen with explicitly labeled preview entry.
- 602e9f3: four examination identities.
- 91736a9: Riverpod active exam state.
- b2accf4: initial examination selection.
- 9b001b4: dashboard and five-tab navigation.
- d5d92a3: GoRouter routes and missing-exam guard.
- 744e867: MaterialApp.router with centralized themes.
- deb59f4: replace generated counter entry point.
- da66f95: widget test for exam selection and switching.

## Architecture

main.dart -> ProviderScope -> IqraVerseApp -> GoRouter -> feature screens.
Exam selection uses a nullable Riverpod Notifier; state is in memory only.
Feature-first directories separate presentation, application and domain.
The five tabs are Home, Courses, Practice, Mock Tests and Profile.
Profile exposes exam switching. Home shows the current exam.

## Verification status

GitHub writes succeeded. Flutter analysis, formatting, widget tests and APK build
have not yet been executed for this milestone. The earlier template APK build
does not verify this new code.

## Limitations

This is a development preview, not an authenticated application. Courses,
practice and mock tests are placeholders; no real student data is fabricated.
Theme defaults to dark; user preferences and persistent exam selection are
pending. Backend integration must follow API contract v3.3; secure examination
timing and scoring must remain server-authoritative. No main branch merge.

## Next steps

1. Verify analysis and tests, correct failures.
2. Configure Android CI and debug APK artifacts.
3. Implement student authentication and session handling.
4. Integrate NSCT curriculum and practice before expanding mock functionality.

## Milestone 02 — CI and authentication preview (2026-11-28)

- fa0bf8d: Android GitHub Actions workflow with Flutter 3.50.1, Temurin 25,
  lockfile enforcement, advisory formatting, mandatory analysis/test/build,
  and 14-day debug APK artifact retention.
- 3872d63: field validation aligned with Register and Login DTOs in v3.3.
- 7685132: responsive login/registration preview with obscured password.
- d6493ad: unit tests for field validation.
- e55796c: welcome screen entry points.
- 99daf13: login and registration routes.

The forms never submit credentials or create a session. The contract requires
joint approval of native token transport before real auth integration.
Recovery and verification endpoints also require reviewed contracts.
Preview access remains explicitly labeled; do not ship it as authentication.
No credentials or secrets have been added.

GitHub Actions runs were observed in progress, with older runs cancelled by
concurrency. No successful analysis, test, or APK result has been confirmed.
Formatting is advisory until the baseline is stabilized. Action references use
version tags and should be pinned to reviewed commit SHAs before release.
Next: inspect CI results and fix failures; agree native session transport with
backend developer; integrate one NSCT catalog/practice slice.

## Milestone 03 — NSCT curriculum preview and networking (2026-11-28)

- a9a7103: ten competency names and proposed mock quotas from blueprint v3.3 section 3A.
- e56fd9b: competency list and detail view, explicitly unpublished preview.
- e41caaf: unit test for ten unique areas and total quota of 100.
- 8300e64: NSCT-only curriculum access within Courses.
- 4832c3e: configurable Dio client with timeouts and API path validation.
- 71b2afb: v3.3 catalog endpoints with optional syllabus edition and cancellation.

Previous milestone CI run 46139897344 succeeded for revision 99daf13.
Artifact 15261042840 contains the Android debug APK.
New milestone build is not verified yet. Catalog data is local, not live;
topic mapping, independent resources and course enrollment are not implemented.
No official duration/count or question-bank publication claims.
The client and repository are not wired to UI or authentication; real base
URL, typed DTOs, session transport and backend integration remain pending.
Only mobile branch and mobile documentation changed.

## Milestone 04 — CI regression fix and NSCT practice (2026-11-28)

CI run 46140620722 failed in flutter analyze due to use_null_aware_elements
in catalog_repository.dart line 26. Tests and APK build were skipped.
- 94b34f1: replace conditional map entry with Dart null-aware value syntax.
- 7066816: immutable practice question model and score calculation.
- 92e0aa1: ten original sample questions, one per NSCT competency, and filtering.
- dd2b1bd: untimed practice configuration, single-answer session, explanations and results.
- bdea1b6: connect practice to NSCT navigation.
- b311647: unit tests for question integrity, filtering and scoring.

Practice is local preview only, with deterministic selection and no persistence,
official question bank, live API or server results. Secure mock functionality is
not implemented and must not reuse this client-side answer-key design.
Latest CI result must be checked before marking this milestone verified.
