import React, { useEffect, useRef, useState } from 'react';
import { View, Linking } from 'react-native';
import Decimal from 'decimal.js';
import {
  Page,
  Card,
  Label,
  Input,
  Choice,
  Action,
  IconButton,
  ResultCard,
  styles,
  useApp,
} from '../components/UI';
import {
  Rate,
  common,
  currencies,
  fetchRate,
  cachedRate,
  Currency as CurrencyType,
} from '../core/currency';
import { readJSON } from '../core/storage';
export function Currency() {
  const { save, toast } = useApp();
  const [list, setList] = useState<CurrencyType[]>(common),
    [from, setFrom] = useState('USD'),
    [to, setTo] = useState('INR'),
    [amount, setAmount] = useState('100'),
    [rate, setRate] = useState<Rate | null>(null),
    [loading, setLoading] = useState(false),
    [cached, setCached] = useState(false),
    [error, setError] = useState(''),
    [refresh, setRefresh] = useState(0);
  const version = useRef(0);
  useEffect(() => {
    let active = true;
    readJSON<CurrencyType[]>('currencies', common)
      .then(v => {
        if (active && Array.isArray(v)) setList(v);
      })
      .catch(() => {});
    currencies()
      .then(v => {
        if (active) setList(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const id = ++version.current;
    setRate(null);
    setLoading(true);
    setError('');
    setCached(false);
    cachedRate(from, to)
      .then(v => {
        if (active && id === version.current && v) {
          setRate(v);
          setCached(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        fetchRate(from, to)
          .then(v => {
            if (active && id === version.current) {
              setRate(v);
              setCached(false);
            }
          })
          .catch(() => {
            if (active && id === version.current) {
              setCached(true);
              setError(
                'Could not refresh. Saved rates are shown if available.',
              );
            }
          })
          .finally(() => {
            if (active && id === version.current) setLoading(false);
          });
      });
    return () => {
      active = false;
    };
  }, [from, to, refresh]);
  const options = list.map(c => `${c.iso_code} · ${c.name}`);
  const selected = (code: string) =>
    options.find(o => o.startsWith(code + ' ·')) || `${code} · ${code}`;
  let result = '';
  try {
    const a = new Decimal(amount);
    if (
      a.isFinite() &&
      a.gte(0) &&
      rate &&
      rate.base.toUpperCase() === from &&
      rate.quote.toUpperCase() === to
    )
      result = a.mul(rate.rate).toString();
  } catch {}
  return (
    <Page>
      <Label size={27} bold>
        Money without borders.
      </Label>
      <Label muted>Daily reference rates. No subscription.</Label>
      <Card style={{ gap: 18 }}>
        <Choice
          label="From"
          value={selected(from)}
          options={options}
          onChange={s => setFrom(s.slice(0, 3))}
        />
        <Input
          label={`Amount in ${from}`}
          value={amount}
          onChange={setAmount}
        />
        <View style={{ alignItems: 'center' }}>
          <IconButton
            name="ArrowDownUp"
            label="Swap currencies"
            onPress={() => {
              setFrom(to);
              setTo(from);
            }}
          />
        </View>
        <Choice
          label="To"
          value={selected(to)}
          options={options}
          onChange={s => setTo(s.slice(0, 3))}
        />
      </Card>
      {result ? (
        <ResultCard
          label={`Converted amount · ${to}`}
          value={result}
          unit={to}
          primary
        />
      ) : (
        <Card>
          <Label muted>
            {loading
              ? 'Fetching latest available rates…'
              : rate
              ? 'Enter a valid non-negative amount'
              : 'Connect to the internet to load this currency pair.'}
          </Label>
        </Card>
      )}
      {rate && (
        <Card>
          <View style={styles.between}>
            <Label bold size={15}>
              1 {from} = {rate.rate} {to}
            </Label>
            <Label size={11} muted>
              {cached ? 'SAVED RATE' : 'DAILY RATE'}
            </Label>
          </View>
          <Label muted size={12} style={{ marginTop: 10 }}>
            Rate date: {rate.date} · Frankfurter
          </Label>
          <Label muted size={12} style={{ marginTop: 7, lineHeight: 18 }}>
            Latest published reference rate. Banks and exchange services may
            apply different rates and fees.
          </Label>
        </Card>
      )}
      {!!error && (
        <Label color="#D54B5A" size={13}>
          {error}
        </Label>
      )}
      <Action
        title={loading ? 'Refreshing…' : 'Refresh rates'}
        icon="RefreshCw"
        disabled={loading}
        onPress={() => setRefresh(refresh + 1)}
      />
      <Action
        title="Save conversion"
        secondary
        icon="History"
        disabled={!result}
        onPress={() => {
          save(
            'currency',
            `${amount} ${from}`,
            `${result} ${to} · rate date ${rate?.date}`,
          );
          toast('Conversion saved');
        }}
      />
      <Action
        title="About the rate source"
        secondary
        icon="ExternalLink"
        onPress={() =>
          Linking.openURL('https://frankfurter.dev/').catch(() =>
            toast('Unable to open browser'),
          )
        }
      />
    </Page>
  );
}
