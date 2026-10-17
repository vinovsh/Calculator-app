import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  Text,
  Vibration,
  Share,
  useWindowDimensions,
} from 'react-native';
import Decimal from 'decimal.js';
import { useApp, Label, IconButton } from '../components/UI';
import { acceptsCalculatorInput } from '../core/calculatorInput';
import { evaluate, formatNumber } from '../core/expression';
import { platform } from '../core/storage';
export function Calculator({
  scientific = false,
  initial = '',
  onEditDone,
}: {
  scientific?: boolean;
  initial?: string;
  onEditDone?: () => void;
}) {
  const { colors, settings, save, toast } = useApp();
  const { height, width } = useWindowDimensions();
  const landscape = width > height;
  const [functionsOpen, setFunctionsOpen] = useState(false);
  let startingExpression = initial;
  if (!acceptsCalculatorInput(initial)) {
    try {
      startingExpression = evaluate(initial);
    } catch {
      startingExpression = '';
    }
  }
  const [availableHeight, setAvailableHeight] = useState(
    Math.max(0, height - 168),
  );
  const [expression, setExpression] = useState(startingExpression),
    [answer, setAnswer] = useState(''),
    [error, setError] = useState(''),
    [degrees, setDegrees] = useState(true),
    [memory, setMemory] = useState('0'),
    [memorySet, setMemorySet] = useState(false);
  const [selection, setSelection] = useState({
    start: startingExpression.length,
    end: startingExpression.length,
  });
  const [finished, setFinished] = useState(false);
  let preview = '';
  try {
    if (expression) preview = evaluate(expression, degrees);
  } catch {}
  const feedback = () => {
    if (settings.haptics) Vibration.vibrate(8);
  };
  const insert = (token: string) => {
    let src = expression,
      start = selection.start,
      end = selection.end;
    if (finished && !/^[+−×÷^%!]$/.test(token)) {
      src = '';
      start = 0;
      end = 0;
    }
    const next = src.slice(0, start) + token + src.slice(end);
    if (!acceptsCalculatorInput(next)) return;
    if (next.length > 400) {
      toast('Maximum expression length reached');
      return;
    }
    feedback();
    setError('');
    setAnswer('');
    setExpression(next);
    const pos = start + token.length;
    setSelection({ start: pos, end: pos });
    setFinished(false);
  };
  const clear = () => {
    setExpression('');
    setAnswer('');
    setError('');
    setSelection({ start: 0, end: 0 });
    setFinished(false);
  };
  const equals = () => {
    feedback();
    try {
      const result = evaluate(expression, degrees);
      save(scientific ? 'scientific' : 'calculator', expression, result);
      setAnswer(result);
      setError('');
      setFinished(true);
      setExpression(result);
      setSelection({ start: result.length, end: result.length });
      onEditDone?.();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const backspace = () => {
    const start = selection.start,
      end = selection.end;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    const next = expression.slice(0, from) + expression.slice(end);
    if (!acceptsCalculatorInput(next)) return;
    feedback();
    setExpression(next);
    setSelection({ start: from, end: from });
    setFinished(false);
    setError('');
    setAnswer('');
  };
  const mem = (action: string) => {
    try {
      if (action === 'MC') {
        setMemory('0');
        setMemorySet(false);
      } else if (action === 'MR') insert(memory);
      else {
        const v = evaluate(expression || '0', degrees);
        setMemory(
          new Decimal(memory)[action === 'M+' ? 'plus' : 'minus'](v).toString(),
        );
        setMemorySet(true);
        toast('Memory updated');
      }
    } catch {
      toast('Enter a valid expression first');
    }
  };
  const changeSign = () => {
    if (!expression) return;
    const next = `−(${expression})`;
    if (next.length > 400 || !acceptsCalculatorInput(next)) return;
    feedback();
    setExpression(next);
    setAnswer('');
    setError('');
    setSelection({ start: next.length, end: next.length });
    setFinished(false);
  };
  const compact = !landscape && availableHeight < 480;
  const shareCalculation = () => {
    if (preview)
      Share.share({ message: `${expression} = ${preview}` }).catch(() =>
        toast('Unable to share'),
      );
  };
  const rows = landscape
    ? [
        ['AC', '(', ')', '⌫', '%', '÷'],
        ['7', '8', '9', '+/−', '+', '×'],
        ['4', '5', '6', 'MC', 'MR', '−'],
        ['1', '2', '3', '0', '.', '='],
      ]
    : [
        ['AC', '(', ')', '⌫'],
        ['7', '8', '9', '÷'],
        ['4', '5', '6', '×'],
        ['1', '2', '3', '−'],
        ['0', '.', '%', '+'],
        ['+/−', '='],
      ];
  const pressKey = (key: string) => {
    if (key === 'AC') clear();
    else if (key === '⌫') backspace();
    else if (key === '=') equals();
    else if (key === '+/−') changeSign();
    else if (key === 'MC' || key === 'MR') mem(key);
    else insert(key);
  };
  const memoryKeys = landscape ? ['M+', 'M-'] : ['MC', 'MR', 'M+', 'M-'];
  const functions = [
    'sin(',
    'cos(',
    'tan(',
    'sqrt(',
    'ln(',
    'log(',
    '^',
    '!',
    'π',
    'e',
    'abs(',
    'exp(',
    'asin(',
    'acos(',
    'atan(',
  ];
  return (
    <View
      testID="calculator-layout"
      onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)}
      style={{
        flex: 1,
        flexDirection: landscape ? 'row' : 'column',
        paddingHorizontal: landscape ? 12 : 16,
        paddingVertical: landscape || availableHeight < 420 ? 4 : 8,
        gap: landscape ? 12 : 8,
      }}
    >
      <View
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: landscape
            ? 0
            : compact
            ? 96
            : scientific && availableHeight >= 560
            ? 200
            : 148,
          gap: 8,
        }}
      >
        <View style={{ flex: 1, minHeight: 96, justifyContent: 'flex-end' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 44,
            }}
          >
            <TextInput
              accessibilityLabel="Calculation expression"
              value={expression}
              onChangeText={value => {
                if (value.length > 400 || !acceptsCalculatorInput(value))
                  return;
                setExpression(value);
                setAnswer('');
                setError('');
                setFinished(false);
                const pos = Math.max(
                  0,
                  Math.min(
                    value.length,
                    selection.end + value.length - expression.length,
                  ),
                );
                setSelection({ start: pos, end: pos });
              }}
              onSelectionChange={event => {
                const { start, end } = event.nativeEvent.selection;
                setSelection({
                  start: Math.min(start, expression.length),
                  end: Math.min(end, expression.length),
                });
              }}
              selection={selection}
              showSoftInputOnFocus={false}
              multiline={false}
              maxLength={400}
              selectionColor={settings.accent}
              placeholder="0"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                minWidth: 0,
                color: colors.text,
                fontSize: 26,
                textAlign: 'right',
                padding: 0,
                height: 44,
              }}
            />
            <IconButton
              name="Copy"
              label="Copy result"
              onPress={() => {
                if (preview) {
                  platform.copy(preview);
                  toast('Result copied');
                }
              }}
            />
            {compact ? (
              <IconButton
                name="MoreHorizontal"
                label="Calculator controls"
                onPress={() => setFunctionsOpen(true)}
              />
            ) : (
              <IconButton
                name="Share2"
                label="Share calculation"
                onPress={shareCalculation}
              />
            )}
          </View>
          <Text
            accessibilityRole="text"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.35}
            style={{
              fontSize: 44,
              fontWeight: '700',
              color: error ? '#D54B5A' : settings.accent,
              textAlign: 'right',
              height: 52,
              textAlignVertical: 'center',
            }}
          >
            {error
              ? 'Check input'
              : formatNumber(
                  answer || preview || '0',
                  settings.decimals,
                  settings.indian,
                )}
          </Text>
          {!!error && (
            <Text
              accessibilityRole="alert"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontSize: 12, color: '#D54B5A', textAlign: 'right' }}
            >
              {error}
            </Text>
          )}
        </View>
        {!compact && (
          <View style={{ flexDirection: 'row', gap: 6, height: 44 }}>
            {memoryKeys.map(key => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key}
                onPress={() => mem(key)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 12,
                  backgroundColor: colors.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Label
                  size={13}
                  color={memorySet ? settings.accent : colors.muted}
                >
                  {key}
                </Label>
              </Pressable>
            ))}
            {scientific && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More scientific functions"
                onPress={() => setFunctionsOpen(true)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 12,
                  backgroundColor: settings.accent + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Label size={17} bold color={settings.accent}>
                  ƒx
                </Label>
              </Pressable>
            )}
          </View>
        )}
        {scientific && !landscape && availableHeight >= 560 && (
          <View style={{ flexDirection: 'row', gap: 6, height: 44 }}>
            {['sin(', 'cos(', 'tan('].map(key => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key}
                onPress={() => insert(key)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: colors.soft,
                }}
              >
                <Label color={settings.accent}>{key.slice(0, -1)}</Label>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle angle unit"
              onPress={() => setDegrees(!degrees)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: colors.soft,
              }}
            >
              <Label bold color={settings.accent}>
                {degrees ? 'DEG' : 'RAD'}
              </Label>
            </Pressable>
          </View>
        )}
      </View>
      <View
        testID="calculator-keypad"
        style={{
          flex: landscape ? 2.4 : 3.2,
          minHeight: landscape ? 188 : 284,
          gap: 4,
        }}
      >
        {rows.map((row, index) => (
          <View
            key={index}
            style={{ flex: 1, flexDirection: 'row', gap: 6, minHeight: 44 }}
          >
            {row.map(key => {
              const equalsKey = key === '=',
                operator = ['+', '−', '×', '÷'].includes(key);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={
                    key === '⌫'
                      ? 'Delete'
                      : key === 'AC'
                      ? 'Clear all'
                      : key === '='
                      ? 'Equals'
                      : key === '+/−'
                      ? 'Change sign'
                      : key
                  }
                  onPress={() => pressKey(key)}
                  onLongPress={key === '⌫' ? clear : undefined}
                  style={({ pressed }) => ({
                    flex: !landscape && equalsKey ? 3 : 1,
                    minWidth: 0,
                    borderRadius: 16,
                    borderWidth: equalsKey ? 0 : 1,
                    borderColor: colors.line,
                    backgroundColor: equalsKey
                      ? settings.accent
                      : operator
                      ? settings.accent + '16'
                      : key === 'AC'
                      ? '#E85D6A16'
                      : colors.key,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.55 : 1,
                  })}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={{
                      fontSize: landscape ? 23 : 25,
                      fontWeight: operator || equalsKey ? '700' : '500',
                      color: equalsKey
                        ? 'white'
                        : key === 'AC'
                        ? '#D54B5A'
                        : operator
                        ? settings.accent
                        : colors.text,
                    }}
                  >
                    {key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Modal
        visible={functionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFunctionsOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#00000088',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90%',
              borderRadius: 24,
              padding: 16,
              gap: 12,
              backgroundColor: colors.card,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Label bold size={20}>
                {scientific ? 'Scientific functions' : 'Calculator controls'}
              </Label>
              <IconButton
                name="X"
                label="Close calculator controls"
                onPress={() => setFunctionsOpen(false)}
              />
            </View>
            <ScrollView
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ gap: 12 }}
            >
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['MC', 'MR', 'M+', 'M-'].map(key => (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`Memory ${key}`}
                    onPress={() => {
                      mem(key);
                      setFunctionsOpen(false);
                    }}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 12,
                      backgroundColor: colors.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Label>{key}</Label>
                  </Pressable>
                ))}
              </View>
              {scientific && (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Toggle angle unit"
                    onPress={() => setDegrees(!degrees)}
                    style={{
                      padding: 12,
                      backgroundColor: colors.soft,
                      borderRadius: 12,
                    }}
                  >
                    <Label bold color={settings.accent}>
                      {degrees ? 'Degrees (DEG)' : 'Radians (RAD)'} ⇄
                    </Label>
                  </Pressable>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {functions.map(key => (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={key}
                        onPress={() => {
                          insert(key);
                          setFunctionsOpen(false);
                        }}
                        style={{
                          width: '23%',
                          flexGrow: 1,
                          minHeight: 44,
                          borderRadius: 12,
                          backgroundColor: colors.soft,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Label color={settings.accent} size={17}>
                          {key === 'sqrt(' ? '√' : key.replace('(', '')}
                        </Label>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share calculation"
                onPress={shareCalculation}
                style={{
                  padding: 14,
                  backgroundColor: colors.soft,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Label>Share calculation</Label>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
