# Validation

## Automated checks

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: 68 tests passed across formula, storage and app interaction suites.
- App interaction coverage: compute/save result, copy from history, open tool catalogue and discount form, persist dark theme.
- ESLint: zero errors; inline-style warnings remain.
- Formula coverage includes decimal precision, precedence, unary/exponent behaviour, percentage semantics, scientific domains, unsafe input rejection, zero-rate loans and savings, tax, weighted grades, fuel, bill splitting, exact large integers, leap-day dates, cycle dates and unit conversions.
- Backup validation rejects invalid settings types, invalid record shapes and excessive history size.
- Frankfurter v2 live endpoint checked for USD/INR and currency catalogue response shape.

Android build results and device/emulator observations will be added after compilation. Passing pure formula tests does not replace physical-device acceptance testing.
