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
