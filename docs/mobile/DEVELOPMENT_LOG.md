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
