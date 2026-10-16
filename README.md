# Everyday Calculator

An Android app built with **React Native CLI + TypeScript**, inspired by the approved six-screen UI storyboard. All tools are included, with no subscriptions or premium locks.

## Features

- Editable basic and scientific expressions, decimal arithmetic, memory, degree/radian mode, history, copy and share.
- Currency conversion using Frankfurter v2, actual published rate dates, manual refresh, saved offline rates, searchable currency selection.
- Twelve unit categories: length, area, volume, weight, temperature, speed, time, pressure, energy, data, power and angle.
- Discount, percentage, GST/tax, adult BMI/BMR, date/age, fuel cost, fuel efficiency, weighted grades, number bases, loan/EMI, savings/SIP, tip/split, unit price, world time and cycle estimates.
- Light/dark/system appearance, eight colour presets, custom primary colour, live preview.
- Favourites and ordering, startup tool, decimal precision, Indian grouping, haptics and keep-screen-on.
- Local SQLite storage; JSON backup/restore through Android's file picker; CSV history export; in-app help and privacy information.
- Small adaptive AdMob **test** banner. No interstitials or subscriptions.

## Requirements & development

- Node.js 20.19.4+ (Node 22 LTS recommended), JDK 17 **JDK**, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1.
- React Native 0.82.1 / React 19.1.1 / New Architecture / Hermes.
- Android 7.0+ (API 24). Android is the validated target; the generated iOS scaffold is retained but the custom platform bridge is Android-only.

```sh
npm ci
npm run typecheck
npm test -- --runInBand
npm start
# In another terminal, with an Android emulator or device connected:
npm run android
```

Set `ANDROID_HOME` or create ignored `android/local.properties` with `sdk.dir=/path/to/android-sdk`. If needed, point `JAVA_HOME` to a complete JDK 17 installation.

## Standalone test APK

The release build bundles JavaScript and does not need Metro. It currently uses the **debug signing certificate for installation testing**. Generate a local testing key if the file does not exist:

```sh
keytool -genkeypair -v -keystore android/app/debug.keystore -storepass android \
  -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 \
  -dname 'CN=Android Debug,O=Android,C=US'
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a --max-workers=2
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. Never use the testing key for a Play Store release. Configure a private upload signing key outside Git before distributing a production AAB.

## Advertising setup before public release

`app.json` contains Google's public sample AdMob application IDs. `src/components/AdBanner.tsx` uses `TestIds.BANNER`, intentionally including standalone test APKs. No publisher account or revenue is configured. Test ads initialize directly; before replacing sample IDs, configure UMP consent, privacy options where required, publisher policy details and a published privacy policy. Keep test IDs during development. On ad failure the app continues normally.

## Currency data

- `GET https://api.frankfurter.dev/v2/currencies`
- `GET https://api.frankfurter.dev/v2/rate/USD/INR`

Free public API, no key. Values are daily reference rates, not live trading prices. Requests time out after 12 seconds. Successful pairs are saved locally; offline mode shows the saved rate date. There are no invented fallback exchange rates. Currency API availability is external to the app.

## Documentation & validation

See [technical specification](docs/TECHNICAL.md) and [validation](docs/VALIDATION.md). Financial formulas are estimates excluding fees and taxes unless explicitly entered. Health/cycle estimates are labelled in the app and must not be used for diagnosis, contraception or treatment.
