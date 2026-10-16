import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  Vibration,
  Share,
  useWindowDimensions,
} from 'react-native';
import Decimal from 'decimal.js';
import { useApp, Label, Icon, IconButton, styles } from '../components/UI';
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
  const { colors, settings, save, go, toast } = useApp();
  const { height } = useWindowDimensions();
  const [expression, setExpression] = useState(initial),
    [answer, setAnswer] = useState(''),
    [error, setError] = useState(''),
    [degrees, setDegrees] = useState(true),
    [memory, setMemory] = useState('0'),
    [memorySet, setMemorySet] = useState(false);
  const [selection, setSelection] = useState({
    start: initial.length,
    end: initial.length,
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
    feedback();
    setError('');
    setAnswer('');
    let src = expression,
      start = selection.start,
      end = selection.end;
    if (finished && !/^[+−×÷^%!]$/.test(token)) {
      src = '';
      start = 0;
      end = 0;
    }
    const next = src.slice(0, start) + token + src.slice(end);
    if (next.length > 400) {
      toast('Maximum expression length reached');
      return;
    }
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
    feedback();
    const start = selection.start,
      end = selection.end;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    setExpression(expression.slice(0, from) + expression.slice(end));
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
  const keyHeight = Math.min(
    scientific ? 54 : 72,
    Math.max(43, (height - (scientific ? 430 : 370)) / 5),
  );
  const keys = [
    'AC',
    '(',
    ')',
    '⌫',
    '7',
    '8',
    '9',
    '÷',
    '4',
    '5',
    '6',
    '×',
    '1',
    '2',
    '3',
    '−',
    '0',
    '.',
    '%',
    '+',
  ];
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexGrow: 1,
          minHeight: scientific ? 105 : 145,
          justifyContent: 'flex-end',
          paddingVertical: 12,
          gap: 8,
        }}
      >
        <View style={styles.between}>
          <Label muted size={12}>
            {memorySet
              ? 'M  •  MEMORY SAVED'
              : scientific
              ? 'SCIENTIFIC MODE'
              : 'EVERYDAY CALCULATIONS'}
          </Label>
          <View style={styles.row}>
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
            <IconButton
              name="Share2"
              label="Share calculation"
              onPress={() => {
                if (preview)
                  Share.share({ message: `${expression} = ${preview}` }).catch(
                    () => toast('Unable to share'),
                  );
              }}
            />
          </View>
        </View>
        <TextInput
          accessibilityLabel="Calculation expression"
          value={expression}
          onChangeText={v => {
            setExpression(v);
            setAnswer('');
            setError('');
            setFinished(false);
          }}
          onSelectionChange={e => setSelection(e.nativeEvent.selection)}
          selection={selection}
          showSoftInputOnFocus={false}
          multiline
          maxLength={400}
          selectionColor={settings.accent}
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={{
            color: colors.text,
            fontSize: 28,
            textAlign: 'right',
            padding: 0,
            minHeight: 42,
          }}
        />
        <Label
          size={44}
          bold
          color={error ? '#D54B5A' : settings.accent}
          style={{ textAlign: 'right' }}
        >
          {error
            ? 'Check input'
            : formatNumber(
                answer || preview || '0',
                settings.decimals,
                settings.indian,
              )}
        </Label>
        {!!error && (
          <Label size={13} color="#D54B5A" style={{ textAlign: 'right' }}>
            {error}
          </Label>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 7, marginVertical: 12 }}>
        {['MC', 'MR', 'M+', 'M-'].map(k => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k}
            onPress={() => mem(k)}
            style={{
              flex: 1,
              minHeight: 36,
              borderRadius: 12,
              backgroundColor: colors.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label size={13} muted>
              {k}
            </Label>
          </Pressable>
        ))}
      </View>
      {scientific && (
        <View style={{ gap: 6, marginBottom: 8 }}>
          <View style={styles.between}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDegrees(!degrees)}
              style={{ padding: 8 }}
            >
              <Label bold color={settings.accent}>
                {degrees ? 'DEG' : 'RAD'} ⇄
              </Label>
            </Pressable>
            <Label muted size={12}>
              Trigonometry · powers · roots
            </Label>
          </View>
          {[
            ['sin(', 'cos(', 'tan(', '^'],
            ['ln(', 'log(', 'sqrt(', '!'],
            ['π', 'e', 'abs(', 'exp('],
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
              {row.map(k => (
                <Pressable
                  key={k}
                  accessibilityRole="button"
                  accessibilityLabel={k}
                  onPress={() => insert(k)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.soft,
                    borderRadius: 12,
                    minHeight: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Label size={15} color={settings.accent}>
                    {k === 'sqrt(' ? '√' : k.replace('(', '')}
                  </Label>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {keys.map((k, i) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={
              k === '⌫' ? 'Delete' : k === 'AC' ? 'Clear all' : k
            }
            onPress={() =>
              k === 'AC' ? clear() : k === '⌫' ? backspace() : insert(k)
            }
            style={({ pressed }) => ({
              width: '23%',
              flexGrow: 1,
              minHeight: keyHeight,
              borderRadius: 16,
              backgroundColor:
                i % 4 === 3
                  ? settings.accent + '16'
                  : k === 'AC'
                  ? '#E85D6A16'
                  : colors.key,
              borderColor: colors.line,
              borderWidth: 1,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <Label
              size={25}
              bold={i % 4 === 3}
              color={
                k === 'AC'
                  ? '#D54B5A'
                  : i % 4 === 3
                  ? settings.accent
                  : colors.text
              }
            >
              {k}
            </Label>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change sign"
          onPress={() => {
            if (expression) {
              const next = `−(${expression})`;
              setExpression(next);
              setSelection({ start: next.length, end: next.length });
              setFinished(false);
            }
          }}
          style={{
            width: '23%',
            minHeight: 50,
            backgroundColor: colors.soft,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Label size={22}>+/−</Label>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Equals"
          onPress={equals}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 50,
            borderRadius: 16,
            backgroundColor: settings.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Label size={28} color="white" bold>
            =
          </Label>
        </Pressable>
      </View>
      <Pressable
        onPress={() => go(scientific ? 'calculator' : 'scientific')}
        style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 4 }}
      >
        <View style={styles.row}>
          <Icon
            name={scientific ? 'Calculator' : 'FlaskConical'}
            color={settings.accent}
            size={16}
          />
          <Label size={13} color={settings.accent}>
            {scientific ? 'Basic calculator' : 'Scientific calculator'}
          </Label>
        </View>
      </Pressable>
    </ScrollView>
  );
}
