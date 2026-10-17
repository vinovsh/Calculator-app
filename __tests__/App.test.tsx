import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput, Text, ScrollView, useWindowDimensions } from 'react-native';
import App from '../App';
import { platform } from '../src/core/storage';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/core/storage', () => {
  const native = require('react-native').NativeModules;
  native.CalculatorPlatform = {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    copy: jest.fn(),
    keepAwake: jest.fn(),
    exportFile: jest.fn(async () => true),
    importFile: jest.fn(async () => null),
  };
  return jest.requireActual('../src/core/storage');
});
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
}));
jest.mock('../src/components/AdBanner', () => ({ AdBanner: () => null }));
jest.mock('lucide-react-native', () => ({ Calculator: () => null }));
let app: TestRenderer.ReactTestRenderer;
const button = (label: string) =>
  app.root
    .findAll(n => typeof n.props.onPress === 'function')
    .find(p => p.props.accessibilityLabel === label)!;
const text = () =>
  app.root
    .findAllByType(Text)
    .map(t => t.props.children)
    .flat()
    .join(' ');
async function navigate(name: string) {
  await act(async () => button('Open navigation menu').props.onPress());
  await act(async () => button(`Navigate to ${name}`).props.onPress());
}
beforeEach(async () => {
  jest.clearAllMocks();
  (useWindowDimensions as jest.Mock).mockReturnValue({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: 1,
  });
  await act(async () => {
    app = TestRenderer.create(<App />);
  });
});
afterEach(async () => {
  await act(async () => app?.unmount());
});
test('calculator records decimal result and allows history copy', async () => {
  await act(async () => {
    app.root.findByType(TextInput).props.onChangeText('0.1+0.2');
  });
  await act(async () => button('Equals').props.onPress());
  expect(text()).toContain('0.3');
  expect(
    (platform.setItem as jest.Mock).mock.calls.some(
      c => c[0] === 'history' && c[1].includes('0.3'),
    ),
  ).toBe(true);
  await navigate('History');
  await act(async () => button('Copy saved result').props.onPress());
  expect(platform.copy).toHaveBeenCalledWith('0.3');
});
test('opens searchable tool catalogue and discount calculation', async () => {
  await navigate('All tools');
  expect(text()).toContain('One app. Every answer.');
  await act(async () => button('Discount, favorite')?.props.onPress());
  // The default favourite ID is discount, so the labelled tile must open its form.
  expect(text()).toContain('Original price');
  const calculate = app.root
    .findAll(n => typeof n.props.onPress === 'function')
    .find(p =>
      p.findAllByType(Text).some(t => t.props.children === 'Calculate'),
    )!;
  await act(async () => calculate.props.onPress());
  expect(text()).toContain('800');
});
test('settings theme can be switched and persists to SQLite', async () => {
  await act(async () => button('Settings').props.onPress());
  const appearance = app.root
    .findAll(n => typeof n.props.onPress === 'function')
    .find(p =>
      p.findAllByType(Text).some(t => t.props.children === 'Appearance'),
    )!;
  await act(async () => appearance.props.onPress());
  const radios = app.root
    .findAll(n => typeof n.props.onPress === 'function')
    .filter(p => p.props.accessibilityRole === 'radio');
  await act(async () => radios[1].props.onPress());
  expect(
    (platform.setItem as jest.Mock).mock.calls.some(
      c => c[0] === 'settings' && JSON.parse(c[1]).theme === 'dark',
    ),
  ).toBe(true);
});

test('silently rejects a second minus on the keypad', async () => {
  await act(async () => button('5').props.onPress());
  await act(async () => button('−').props.onPress());
  await act(async () => button('−').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('5−');
  expect(text()).not.toContain('Check input');
  await act(async () => button('2').props.onPress());
  await act(async () => button('Equals').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('3');
});
test('rejects pasted and mixed minus pairs without a message or replacement', async () => {
  await act(async () =>
    app.root.findByType(TextInput).props.onChangeText('12'),
  );
  for (const value of ['12--', '12−−', '12-−', '12−-', '12− −']) {
    await act(async () =>
      app.root.findByType(TextInput).props.onChangeText(value),
    );
    expect(app.root.findByType(TextInput).props.value).toBe('12');
  }
  expect(text()).not.toContain('Check input');
});
test('guards edits before an existing minus and deletes that join two minus signs', async () => {
  await act(async () =>
    app.root.findByType(TextInput).props.onChangeText('5−2'),
  );
  await act(async () =>
    app.root.findByType(TextInput).props.onSelectionChange({
      nativeEvent: { selection: { start: 1, end: 1 } },
    }),
  );
  await act(async () => button('−').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('5−2');
  await act(async () =>
    app.root.findByType(TextInput).props.onChangeText('5−(−2)'),
  );
  await act(async () =>
    app.root.findByType(TextInput).props.onSelectionChange({
      nativeEvent: { selection: { start: 3, end: 3 } },
    }),
  );
  await act(async () => button('Delete').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('5−(−2)');
});
test('keeps negative operands usable after multiplication', async () => {
  for (const key of ['5', '×', '−', '2'])
    await act(async () => button(key).props.onPress());
  await act(async () => button('Equals').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('-10');
});
test('side menu preserves the current calculation and replaces bottom tabs', async () => {
  await act(async () =>
    app.root.findByType(TextInput).props.onChangeText('123+4'),
  );
  expect(
    app.root.findAll(n => n.props.accessibilityRole === 'tab'),
  ).toHaveLength(0);
  await act(async () => button('Open navigation menu').props.onPress());
  await act(async () => button('Close navigation menu').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('123+4');
  await navigate('Calculator');
  expect(app.root.findByType(TextInput).props.value).toBe('123+4');
  expect(app.root.findAllByType(ScrollView)).toHaveLength(0);
});
test('scientific functions remain accessible without scrolling the calculator', async () => {
  await navigate('Scientific calculator');
  expect(app.root.findAllByType(ScrollView)).toHaveLength(0);
  await act(async () => button('More scientific functions').props.onPress());
  await act(async () => button('sqrt(').props.onPress());
  for (const key of ['9', ')'])
    await act(async () => button(key).props.onPress());
  await act(async () => button('Equals').props.onPress());
  expect(app.root.findByType(TextInput).props.value).toBe('3');
});

test('landscape keeps every core key in a fixed four-row keypad', async () => {
  (useWindowDimensions as jest.Mock).mockReturnValue({
    width: 844,
    height: 390,
    scale: 3,
    fontScale: 1,
  });
  await act(async () => app.update(<App />));
  const keypad = app.root.findAll(
    n => n.props.testID === 'calculator-keypad',
  )[0];
  expect(keypad.props.children).toHaveLength(4);
  for (const key of [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '+',
    '−',
    '×',
    '÷',
    'Equals',
    'Change sign',
    'Delete',
  ])
    expect(button(key)).toBeDefined();
  expect(app.root.findAllByType(ScrollView)).toHaveLength(0);
});
test('compact portrait moves secondary controls into a sheet while keeping equals visible', async () => {
  const layout = app.root.findAll(
    n => n.props.testID === 'calculator-layout',
  )[0];
  await act(async () =>
    layout.props.onLayout({ nativeEvent: { layout: { height: 400 } } }),
  );
  expect(button('Equals')).toBeDefined();
  expect(button('Calculator controls')).toBeDefined();
  expect(app.root.findAllByType(ScrollView)).toHaveLength(0);
  await act(async () => button('Calculator controls').props.onPress());
  expect(button('Memory M+')).toBeDefined();
  expect(button('Share calculation')).toBeDefined();
});
