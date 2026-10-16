import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput, Text } from 'react-native';
import App from '../App';
import { platform } from '../src/core/storage';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/core/storage', () => {
 const native = require('react-native').NativeModules;
 native.CalculatorPlatform = {
   getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}),
   copy: jest.fn(), keepAwake: jest.fn(), exportFile: jest.fn(async () => true),
   importFile: jest.fn(async () => null),
 };
 return jest.requireActual('../src/core/storage');
});
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
beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    app = TestRenderer.create(<App />);
  });
});
afterEach(async () => {
  await act(async () => app.unmount());
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
  const tabs = app.root
    .findAll(n => typeof n.props.onPress === 'function')
    .filter(p => p.props.accessibilityRole === 'tab');
  await act(async () => tabs[2].props.onPress());
  await act(async () => button('Copy saved result').props.onPress());
  expect(platform.copy).toHaveBeenCalledWith('0.3');
});
test('opens searchable tool catalogue and discount calculation', async () => {
  const tabs = app.root
    .findAll(n => typeof n.props.onPress === 'function')
    .filter(p => p.props.accessibilityRole === 'tab');
  await act(async () => tabs[1].props.onPress());
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
