# Technical specification

## Structure

| Path | Responsibility |
|---|---|
| `App.tsx` | App state, navigation/back stack, startup routing, theme context, safe areas, persistent shell |
| `src/components/UI.tsx` | Accessible shared UI primitives, searchable selection dialog, number/result presentation |
| `src/components/AdBanner.tsx` | Fixed bottom adaptive sample banner with graceful failure |
| `src/core/expression.ts` | Bounded recursive descent parser and decimal formatting |
| `src/core/tools.ts` | Typed calculator definitions, input rules and pure formulas |
| `src/core/units.ts` | Unit definitions and temperature offsets |
| `src/core/currency.ts` | Frankfurter requests, schema checks, timeouts and cached rate pairs |
| `src/core/storage.ts` | Platform contract, preferences and backup validation |
| `src/screens/` | Calculator, catalogue, specialist tools, currency, settings and history |
| `android/.../CalculatorPlatform.kt` | SQLite key-value storage, clipboard, screen wake flag and Android document picker |

## Data model

Private SQLite database `everyday.db`, table `store(key TEXT PRIMARY KEY, value TEXT NOT NULL)`. JSON values are stored using parameterized queries and conflict replacement.

- `settings`: theme, accent, decimals, grouping, haptics, screen wake, history toggle, startup, tool-list startup and ordered favourites.
- `history`: at most 1,000 records `{id, tool, expression, result, date}`.
- `last`: last opened calculator ID.
- `currencies`: cached provider currency catalogue.
- `rate:BASE:QUOTE`: validated `{date, base, quote, rate}` object.

Device data is not uploaded to an app backend. History data can be manually exported. SQLite access is supplied through React Native's Android native-module interop. Automatic Google account sync is not implemented; backup uses the user's Android document provider.

## Calculations

`decimal.js` uses 32 significant digits internally. Expression results retain 24 significant digits; specialist results retain 18. Display decimals are configurable 0–12 and do not change stored expression precision. Native numeric approximations apply to unit definitions such as angle/speed constants. Money is not calculated using binary floating-point additions.

Parser precedence: factorial/percentage postfix, right-associative exponent, unary signs, multiplication/division, addition/subtraction. `%` always divides by 100 (`200 + 10% = 200.1`); it is not a contextual retail-percent operator. Implicit multiplication is not accepted. Input is limited to 400 UI characters / 500 parser tokens. Division by zero and non-finite/out-of-range results produce readable errors. No `eval()` or dynamic function execution.

- EMI: monthly reducing balance, nominal annual rate / 12; explicit zero-interest branch.
- Savings: monthly compounding, initial principal plus monthly annuity; start/end contribution option.
- Tax: inclusive or exclusive user-entered tax; CGST/SGST shown as equal halves.
- Grades: weighted scores 0–100 and strictly positive credits.
- Number bases: exact BigInt conversion, signed integer, max 128 input digits.
- Date: strict ISO calendar dates, UTC day arithmetic to avoid daylight-saving drift.
- BMR: adult Mifflin–St Jeor estimate; BMI from metric height/weight.
- Cycle: calendar-only estimate using nominal 14-day luteal phase.
- World time: 12 cities using platform IANA time zones and daylight-saving rules.

## Networking and concurrency

Only currency refresh and advertising require networking. Currency fetches use AbortController and a 12-second deadline; stale screen requests cannot overwrite a newly selected pair. Saved pair rates are available while refresh runs. Refresh failures retain any validated cached response and show its date. Unsupported pairs display errors rather than using a fabricated rate.

## Backup, privacy and lifecycle

Version 1 JSON backup identifies the app and validates settings types, history fields, timestamps, known tools and limits. Native imports are bounded to 5 MB; restoration asks before replacing device data. File operations are serialized and cancelled file pickers resolve without changing data. JSON backups are readable, not encrypted. Clipboard actions require an explicit user tap. Keep-awake is cleared when backgrounding and restored on foreground only if enabled. Health/financial entries are not attached to currency or ad requests.

## Release boundaries

The APK is a standalone installable testing release signed with a testing key. Production tasks: private upload signing, publisher AdMob IDs, UMP consent/privacy options, publisher privacy-policy URL, Play Console data-safety declarations and physical-device acceptance testing. The iOS platform bridge is not implemented. No subscription service, authentication or app backend is required.
