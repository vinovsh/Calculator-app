import { readJSON, writeJSON } from './storage';
export type Rate = { date: string; base: string; quote: string; rate: number };
export type Currency = { iso_code: string; name: string };
export const common: Currency[] = [
  ['USD', 'US Dollar'],
  ['INR', 'Indian Rupee'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['JPY', 'Japanese Yen'],
  ['AUD', 'Australian Dollar'],
  ['CAD', 'Canadian Dollar'],
  ['CHF', 'Swiss Franc'],
  ['CNY', 'Chinese Yuan'],
  ['SGD', 'Singapore Dollar'],
  ['AED', 'UAE Dirham'],
  ['SAR', 'Saudi Riyal'],
  ['NZD', 'New Zealand Dollar'],
  ['MYR', 'Malaysian Ringgit'],
  ['THB', 'Thai Baht'],
  ['KRW', 'South Korean Won'],
  ['ZAR', 'South African Rand'],
  ['BRL', 'Brazilian Real'],
].map(([iso_code, name]) => ({ iso_code, name }));
async function json(url: string) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw Error('Rate service is temporarily unavailable');
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
export const isRate = (data: any, base: string, quote: string): data is Rate =>
  !!data &&
  data.base?.toUpperCase() === base.toUpperCase() &&
  data.quote?.toUpperCase() === quote.toUpperCase() &&
  typeof data.rate === 'number' &&
  Number.isFinite(data.rate) &&
  data.rate > 0 &&
  /^\d{4}-\d{2}-\d{2}$/.test(data.date);
export async function fetchRate(base: string, quote: string): Promise<Rate> {
  const data = await json(
    `https://api.frankfurter.dev/v2/rate/${base}/${quote}`,
  );
  if (!isRate(data, base, quote))
    throw Error('Unexpected response from rate provider');
  await writeJSON(`rate:${base}:${quote}`, data);
  return data;
}
export async function cachedRate(
  base: string,
  quote: string,
): Promise<Rate | null> {
  const data = await readJSON<Rate | null>(`rate:${base}:${quote}`, null);
  return isRate(data, base, quote) ? data : null;
}
export async function currencies(): Promise<Currency[]> {
  const data = await json('https://api.frankfurter.dev/v2/currencies');
  if (!Array.isArray(data)) throw Error('Currency list unavailable');
  const valid = data
    .filter(
      c =>
        typeof c.iso_code === 'string' &&
        /^[A-Z]{3}$/i.test(c.iso_code) &&
        typeof c.name === 'string',
    )
    .map(c => ({ ...c, iso_code: c.iso_code.toUpperCase() }));
  if (!valid.length) throw Error('Currency list unavailable');
  await writeJSON('currencies', valid);
  return valid;
}
