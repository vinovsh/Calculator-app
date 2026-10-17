# Version 1.0.1

## Changes

- Reject consecutive minus signs silently, including ASCII `-`, mathematical `−`, mixed pairs and whitespace-separated pairs. Applies to keypad insertion, pasted/replaced text, memory insertion and deletion that would join minus signs. Ordinary subtraction, negative operands and bracketed negative values continue to work.
- Replace the bottom navigation bar with an accessible left-side menu: Calculator, Scientific calculator, All tools, History, Settings and Help. Backdrop, close button and Android Back dismiss the menu. Opening/closing it or selecting the current screen preserves the current expression.
- Use a fixed calculator page, without a parent ScrollView. Portrait has a six-row keypad; landscape uses four rows of six keys. Rows retain a 44 dp minimum target, and long results scale within a single display line.
- Compact phones move secondary memory/share/scientific controls into a bounded popup; other tools, navigation lists and popups remain scrollable where needed. The bottom adaptive banner remains.

## Verification

- TypeScript: passed.
- 91 tests: passed, including new minus-entry/edit/paste tests, side-menu navigation, compact controls and landscape key availability.
- ESLint on affected source/tests: no errors; existing inline-style warnings remain.
- These are component/logic checks; actual phone layout and native runtime behavior still need device acceptance testing.

## Installing this testing APK

The original 1.0.0 workflow did not retain its generated testing certificate. Android cannot install a differently signed update over that APK. Export a backup from the old app before uninstalling it, install 1.0.1, then restore the backup. The JSON backup schema is unchanged. This workflow caches its nonproduction testing certificate for subsequent builds; cache retention is not a substitute for a privately managed production upload key.
