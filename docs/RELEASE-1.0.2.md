# Everyday Calculator 1.0.2

Expression editing now opens the system keyboard. While editing, the calculator keypad is hidden to leave room for the keyboard; Done returns to the calculator keypad. Autocorrection and automatic capitalization are disabled for expressions. Copy continues to copy the calculated result.

A shared grammar validator checks keypad, typed, pasted, memory-recall, and deletion changes. It silently rejects malformed operator sequences, repeated decimal points, unmatched closing brackets, empty brackets, unsupported characters/functions, and repeated postfix operators. Valid unfinished expressions remain editable; Equals requires a complete expression. Scientific notation, negative operands, scientific functions, and parentheses remain supported. Mathematical domain errors (division by zero, negative square roots, invalid factorials, and out-of-range results) are handled by the evaluator and never saved as successful calculations.

Validation: 153 Jest tests passed, TypeScript passed, affected-file ESLint passed with inline-style warnings. Physical-device keyboard, selection, and layout acceptance remain unverified. Existing test signing certificate cache is reused by the Android workflow when available.
