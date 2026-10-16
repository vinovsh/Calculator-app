# Validation

## Automated checks

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: 68 tests passed across formula, storage and app interaction suites.
- App interaction coverage: compute/save result, copy from history, open tool catalogue and discount form, persist dark theme.
- ESLint: zero errors; inline-style warnings remain.
- Formula coverage includes decimal precision, precedence, unary/exponent behaviour, percentage semantics, scientific domains, unsafe input rejection, zero-rate loans and savings, tax, weighted grades, fuel, bill splitting, exact large integers, leap-day dates, cycle dates and unit conversions.
- Backup validation rejects invalid settings types, invalid record shapes and excessive history size.
- Frankfurter v2 live endpoint checked for USD/INR and currency catalogue response shape.

## Android build

- Final GitHub Actions run: https://github.com/vinovsh/Calculator-app/actions/runs/38837482024 — succeeded.
- App source commit: `8e0c000022d0130f7233c10e1e8ed94492229829`.
- Standalone APK: `EverydayCalculator-1.0.0.apk`, version 1.0.0 / code 1.
- Android API 24 minimum, API 36 target; ARM64 and ARMv7 libraries included.
- Signature verified with Android `apksigner`; testing certificate (not a Play Store upload key).
- `zipalign -c -P 16 4`: passed.
- Bundled JavaScript is included; Metro is not required.
- APK SHA-256: `5480b2cc5e16a03cb4dbd704336ac6351727f5adfd0b333ee2fdacdf8583610a`.

## Runtime verification limit

A baseline build containing the same native bridge installed on an Android 11 emulator. This environment has no hardware acceleration; the app-launch wait timed out under software emulation. A successful on-device launch and full visual acceptance test have not been established. The final build includes subsequent keypad sizing and startup-tracking fixes and passes all automated checks. Physical-device testing remains necessary.

Banner advertising intentionally uses Google's sample IDs. Publisher IDs, production signing and consent/privacy setup are required before a public Play Store release.
