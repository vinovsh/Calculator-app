import React, { useState } from 'react';
import { View, Pressable, TextInput, Keyboard, Share } from 'react-native';
import {
  useApp,
  Icon,
  Label,
  Card,
  Input,
  Choice,
  Action,
  Page,
  ResultCard,
  styles,
  IconButton,
} from '../components/UI';
import { tools, Tool, Result } from '../core/tools';
import { categories, convertUnit } from '../core/units';
import { platform } from '../core/storage';
export function AllTools() {
  const { colors, settings, update, go } = useApp();
  const [query, setQuery] = useState(''),
    [group, setGroup] = useState('All');
  const visible = tools.filter(
    t =>
      (group === 'All' ||
        (group === 'Favorites' && settings.favorites.includes(t.id)) ||
        t.group === group) &&
      `${t.title} ${t.subtitle}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (group === 'Favorites')
    visible.sort(
      (a, b) =>
        settings.favorites.indexOf(a.id) - settings.favorites.indexOf(b.id),
    );
  return (
    <Page>
      <View>
        <Label bold size={28}>
          One app. Every answer.
        </Label>
        <Label muted style={{ marginTop: 7 }}>
          Your everyday tools, thoughtfully together.
        </Label>
      </View>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Icon name="Search" color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search calculators"
          placeholder="Search calculators…"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, minHeight: 52, color: colors.text, fontSize: 16 }}
        />
        {!!query && (
          <IconButton
            name="X"
            label="Clear search"
            onPress={() => setQuery('')}
          />
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          'All',
          'Favorites',
          'Everyday',
          'Finance',
          'Shopping',
          'Health',
          'Travel',
          'Education',
          'Lifestyle',
        ].map(g => (
          <Pressable
            key={g}
            accessibilityRole="button"
            accessibilityState={{ selected: group === g }}
            onPress={() => setGroup(g)}
            style={{
              backgroundColor: group === g ? settings.accent : colors.soft,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 30,
            }}
          >
            <Label size={13} bold color={group === g ? 'white' : colors.muted}>
              {g}
            </Label>
          </Pressable>
        ))}
      </View>
      <Label muted size={12}>
        {visible.length} TOOLS · Long press a tool to favourite
      </Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {visible.map(t => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`${t.title}${
              settings.favorites.includes(t.id) ? ', favorite' : ''
            }`}
            onPress={() => go(t.id)}
            onLongPress={() =>
              update({
                favorites: settings.favorites.includes(t.id)
                  ? settings.favorites.filter(id => id !== t.id)
                  : [...settings.favorites, t.id],
              })
            }
            style={({ pressed }) => ({
              width: '47%',
              flexGrow: 1,
              maxWidth: '50%',
              borderRadius: 20,
              padding: 16,
              gap: 10,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View style={styles.between}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: t.color + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={t.icon} color={t.color} size={25} />
              </View>
              {settings.favorites.includes(t.id) && (
                <Icon name="Star" size={14} color={settings.accent} />
              )}
            </View>
            <Label bold size={16}>
              {t.title}
            </Label>
            <Label muted size={12}>
              {t.subtitle}
            </Label>
          </Pressable>
        ))}
      </View>
      {!visible.length && (
        <Card>
          <Label muted>No matching calculators.</Label>
        </Card>
      )}
    </Page>
  );
}
export function FormTool({ tool }: { tool: Tool }) {
  const { save, toast, settings } = useApp();
  const [values, setValues] = useState<Record<string, string>>(() =>
      Object.fromEntries((tool.fields || []).map(f => [f.key, f.initial])),
    ),
    [results, setResults] = useState<Result[]>([]),
    [error, setError] = useState('');
  const calculate = () => {
    Keyboard.dismiss();
    try {
      const output = tool.calculate!(values);
      setResults(output);
      setError('');
      save(
        tool.id,
        (tool.fields || [])
          .map(f => `${f.label}: ${values[f.key]}`)
          .join(' · '),
        output
          .map(o => `${o.label}: ${o.value}${o.unit ? ' ' + o.unit : ''}`)
          .join('\n'),
      );
    } catch (e) {
      setError((e as Error).message);
      setResults([]);
    }
  };
  const resultText = results
    .map(r => `${r.label}: ${r.value}${r.unit ? ' ' + r.unit : ''}`)
    .join('\n');
  return (
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            padding: 14,
            borderRadius: 17,
            backgroundColor: tool.color + '18',
          }}
        >
          <Icon name={tool.icon} color={tool.color} size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Label size={23} bold>
            {tool.title}
          </Label>
          <Label muted size={13} style={{ marginTop: 4 }}>
            {tool.subtitle}
          </Label>
        </View>
      </View>
      <Card style={{ gap: 18 }}>
        {tool.fields?.map(f =>
          f.kind === 'select' ? (
            <Choice
              key={f.key}
              label={f.label}
              value={values[f.key]}
              options={f.options || []}
              onChange={value => {
                setValues({ ...values, [f.key]: value });
                setResults([]);
                setError('');
              }}
            />
          ) : (
            <Input
              key={f.key}
              label={f.label}
              value={values[f.key]}
              onChange={value => {
                setValues({ ...values, [f.key]: value });
                setResults([]);
                setError('');
              }}
              text={f.kind === 'text' || f.kind === 'date'}
              placeholder={f.kind === 'date' ? 'YYYY-MM-DD' : undefined}
            />
          ),
        )}
        <Action title="Calculate" icon="Equal" onPress={calculate} />
      </Card>
      {!!error && <Label color="#D54B5A">{error}</Label>}
      {results.map((r, i) => (
        <ResultCard
          key={r.label}
          label={r.label}
          value={r.value}
          unit={r.unit}
          primary={i === 0}
          raw={
            tool.id === 'hex' || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(r.value)
          }
        />
      ))}
      {!!results.length && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Action
              title="Copy"
              icon="Copy"
              secondary
              onPress={() => {
                platform.copy(resultText);
                toast('Results copied');
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Action
              title="Share"
              icon="Share2"
              secondary
              onPress={() =>
                Share.share({ message: `${tool.title}\n${resultText}` }).catch(
                  () => toast('Unable to share'),
                )
              }
            />
          </View>
        </View>
      )}
      {tool.note && (
        <Card style={{ backgroundColor: settings.accent + '09' }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="Info" color={settings.accent} size={18} />
            <Label size={13} muted style={{ flex: 1, lineHeight: 20 }}>
              {tool.note}
            </Label>
          </View>
        </Card>
      )}
    </Page>
  );
}
export function UnitConverter() {
  const { save, toast } = useApp();
  const [category, setCategory] = useState('Length'),
    [from, setFrom] = useState('Metres'),
    [to, setTo] = useState('Feet'),
    [value, setValue] = useState('1');
  const cat = categories.find(c => c.name === category)!;
  let result = '',
    error = '';
  try {
    result = convertUnit(value, cat, from, to);
  } catch (e) {
    if (value) error = (e as Error).message;
  }
  return (
    <Page>
      <Label bold size={27}>
        Convert with confidence.
      </Label>
      <Card style={{ gap: 18 }}>
        <Choice
          label="Category"
          value={category}
          options={categories.map(c => c.name)}
          onChange={c => {
            setCategory(c);
            const units = Object.keys(
              categories.find(x => x.name === c)!.units,
            );
            setFrom(units[0]);
            setTo(units[1]);
          }}
        />
        <Input label="Amount" value={value} onChange={setValue} />
        <Choice
          label="From"
          value={from}
          options={Object.keys(cat.units)}
          onChange={setFrom}
        />
        <View style={{ alignItems: 'center' }}>
          <IconButton
            name="ArrowDownUp"
            label="Swap units"
            onPress={() => {
              setFrom(to);
              setTo(from);
            }}
          />
        </View>
        <Choice
          label="To"
          value={to}
          options={Object.keys(cat.units)}
          onChange={setTo}
        />
      </Card>
      {result && (
        <ResultCard
          label={`${value} ${from} =`}
          value={result}
          unit={to}
          primary
        />
      )}
      {!!error && <Label color="#D54B5A">{error}</Label>}
      <Action
        title="Save to history"
        icon="History"
        disabled={!result}
        onPress={() => {
          save('units', `${value} ${from}`, `${result} ${to}`);
          toast('Conversion saved');
        }}
      />
      <Label muted size={13}>
        Conversions use fixed unit definitions. Temperature conversion respects
        absolute zero.
      </Label>
    </Page>
  );
}
const cities = [
  ['New Delhi', 'Asia/Kolkata'],
  ['London', 'Europe/London'],
  ['New York', 'America/New_York'],
  ['Los Angeles', 'America/Los_Angeles'],
  ['Dubai', 'Asia/Dubai'],
  ['Singapore', 'Asia/Singapore'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Sydney', 'Australia/Sydney'],
  ['Paris', 'Europe/Paris'],
  ['Berlin', 'Europe/Berlin'],
  ['Toronto', 'America/Toronto'],
  ['Auckland', 'Pacific/Auckland'],
];
export function WorldTime() {
  const [now, setNow] = useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Page>
      <Label bold size={27}>
        Around the world.
      </Label>
      <Label muted>Current local times · daylight saving included</Label>
      {cities.map(([city, zone]) => (
        <Card key={zone}>
          <View style={styles.between}>
            <View>
              <Label bold size={17}>
                {city}
              </Label>
              <Label size={12} muted style={{ marginTop: 5 }}>
                {now.toLocaleDateString('en-GB', {
                  timeZone: zone,
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Label>
            </View>
            <Label bold size={25}>
              {now.toLocaleTimeString('en-GB', {
                timeZone: zone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Label>
          </View>
        </Card>
      ))}
    </Page>
  );
}
