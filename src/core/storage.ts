import { NativeModules } from 'react-native';
export const platform = NativeModules.CalculatorPlatform as {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  copy: (text: string) => void;
  keepAwake: (enabled: boolean) => void;
  exportFile: (
    name: string,
    type: string,
    text: string,
  ) => Promise<boolean | null>;
  importFile: () => Promise<string | null>;
};
export type Settings = {
  theme: 'light' | 'dark' | 'system';
  accent: string;
  decimals: number;
  indian: boolean;
  haptics: boolean;
  keepAwake: boolean;
  history: boolean;
  startup: string;
  openTools: boolean;
  favorites: string[];
};
export type HistoryEntry = {
  id: string;
  tool: string;
  expression: string;
  result: string;
  date: string;
};
export const defaults: Settings = {
  theme: 'system',
  accent: '#1764FF',
  decimals: 6,
  indian: false,
  haptics: true,
  keepAwake: false,
  history: true,
  startup: 'calculator',
  openTools: false,
  favorites: [
    'calculator',
    'currency',
    'units',
    'discount',
    'percentage',
    'loan',
  ],
};
export function validateSettings(s: unknown): Settings {
  if (!s || typeof s !== 'object') throw Error('Invalid settings');
  const x = s as Settings;
  if (
    !['light', 'dark', 'system'].includes(x.theme) ||
    !/^#[0-9a-f]{6}$/i.test(x.accent) ||
    !Number.isInteger(x.decimals) ||
    x.decimals < 0 ||
    x.decimals > 12 ||
    typeof x.startup !== 'string' ||
    !Array.isArray(x.favorites) ||
    x.favorites.length > 30 ||
    x.favorites.some(a => typeof a !== 'string') ||
    ['indian', 'haptics', 'keepAwake', 'history', 'openTools'].some(
      k => typeof (x as any)[k] !== 'boolean',
    )
  )
    throw Error('Invalid backup preferences');
  return { ...defaults, ...x };
}
export function validateHistory(x: unknown): HistoryEntry[] {
  if (
    !Array.isArray(x) ||
    x.length > 1000 ||
    x.some(
      h =>
        !h ||
        ['id', 'tool', 'expression', 'result', 'date'].some(
          k => typeof h[k] !== 'string' || h[k].length > 5000,
        ) ||
        !Number.isFinite(Date.parse(h.date)),
    )
  )
    throw Error('Invalid backup history');
  return x;
}
export const readJSON = async <T>(key: string, fallback: T): Promise<T> => {
  const s = await platform.getItem(key);
  return s ? JSON.parse(s) : fallback;
};
export const writeJSON = (key: string, value: unknown) =>
  platform.setItem(key, JSON.stringify(value));
