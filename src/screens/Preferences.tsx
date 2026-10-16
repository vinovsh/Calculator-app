import React, { useState } from 'react';
import { View, Pressable, Switch, Alert, Share, Linking } from 'react-native';
import {
  Page,
  Card,
  Label,
  Icon,
  Input,
  Choice,
  Action,
  ResultCard,
  styles,
  useApp,
  IconButton,
} from '../components/UI';
import { tools, toolById } from '../core/tools';
import { platform, validateSettings, validateHistory } from '../core/storage';
export function Appearance() {
  const { colors, settings, update, toast } = useApp();
  const [hex, setHex] = useState(settings.accent);
  const swatches = [
    '#1764FF',
    '#7450CC',
    '#007F88',
    '#087D55',
    '#B94F00',
    '#C43272',
    '#B03945',
    '#526274',
  ];
  return (
    <Page>
      <Label bold size={28}>
        Make it yours.
      </Label>
      <Label muted>Comfortable in every light. Personal in every colour.</Label>
      <Card>
        <Label size={17} bold>
          Theme
        </Label>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
          {(['light', 'dark', 'system'] as const).map(t => (
            <Pressable
              key={t}
              accessibilityRole="radio"
              accessibilityState={{ selected: settings.theme === t }}
              onPress={() => update({ theme: t })}
              style={{ flex: 1, gap: 10, alignItems: 'center' }}
            >
              <View
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 15,
                  borderWidth: 2,
                  borderColor:
                    settings.theme === t ? settings.accent : colors.line,
                  backgroundColor:
                    t === 'dark'
                      ? '#111A28'
                      : t === 'light'
                      ? '#F8FAFF'
                      : '#B2BDCF',
                  padding: 10,
                }}
              >
                <View
                  style={{
                    height: 18,
                    width: '70%',
                    alignSelf: 'flex-end',
                    borderRadius: 4,
                    backgroundColor: settings.accent + '60',
                    marginBottom: 10,
                  }}
                />
                {[0, 1, 2].map(i => (
                  <View
                    key={i}
                    style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}
                  >
                    {[0, 1, 2].map(j => (
                      <View
                        key={j}
                        style={{
                          flex: 1,
                          height: 10,
                          borderRadius: 3,
                          backgroundColor: t === 'dark' ? '#344158' : '#DCE4F2',
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Label
                size={13}
                bold
                color={settings.theme === t ? settings.accent : colors.text}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Label>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card style={{ gap: 18 }}>
        <Label size={17} bold>
          Primary colour
        </Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {swatches.map(c => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityLabel={`Colour ${c}`}
              accessibilityState={{ selected: settings.accent === c }}
              onPress={() => {
                update({ accent: c });
                setHex(c);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 24,
                backgroundColor: c,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {settings.accent === c && <Icon name="Check" color="white" />}
            </Pressable>
          ))}
        </View>
        <Input
          label="Custom hex colour"
          text
          value={hex}
          onChange={setHex}
          placeholder="#1764FF"
        />
        <Action
          title="Apply custom colour"
          onPress={() => {
            if (!/^#[0-9a-f]{6}$/i.test(hex)) {
              toast('Use a six-digit hex colour, for example #1764FF');
              return;
            }
            const rgb = hex
              .slice(1)
              .match(/../g)!
              .map(c => parseInt(c, 16) / 255)
              .map(c =>
                c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
              );
            const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
            if (1.05 / (lum + 0.05) < 4.5) {
              toast(
                'Choose a darker colour so white button text stays readable',
              );
              return;
            }
            update({ accent: hex });
          }}
        />
      </Card>
      <Label muted size={12}>
        LIVE PREVIEW
      </Label>
      <ResultCard label="1,250 × 18%" value="225" primary />
      <Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['7', '8', '9', '÷'].map((k, i) => (
            <View
              key={k}
              style={{
                flex: 1,
                padding: 15,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: i === 3 ? settings.accent : colors.soft,
              }}
            >
              <Label color={i === 3 ? 'white' : colors.text} bold>
                {k}
              </Label>
            </View>
          ))}
        </View>
      </Card>
    </Page>
  );
}
function Row({
  icon,
  title,
  detail,
  onPress,
  toggle,
  onToggle,
}: {
  icon: string;
  title: string;
  detail?: string;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
}) {
  const { colors, settings } = useApp();
  return (
    <Pressable
      accessibilityRole={onToggle ? 'switch' : 'button'}
      accessibilityState={onToggle ? { checked: toggle } : undefined}
      onPress={onToggle ? () => onToggle(!toggle) : onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        minHeight: 64,
      }}
    >
      <Icon name={icon} size={21} />
      <View style={{ flex: 1, gap: 4 }}>
        <Label bold>{title}</Label>
        {detail && (
          <Label muted size={12}>
            {detail}
          </Label>
        )}
      </View>
      {onToggle ? (
        <Switch
          accessibilityLabel={title}
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: colors.line, true: settings.accent }}
          thumbColor="white"
        />
      ) : (
        <Icon name="ChevronRight" size={17} color={colors.muted} />
      )}
    </Pressable>
  );
}
export function Settings() {
  const { settings, update, go, toast, history, setHistory } = useApp();
  const [busy, setBusy] = useState(false);
  const backup = async () => {
    setBusy(true);
    try {
      const success = await platform.exportFile(
        'EverydayCalculator-backup.json',
        'application/json',
        JSON.stringify(
          {
            app: 'EverydayCalculator',
            version: 1,
            createdAt: new Date().toISOString(),
            settings,
            history,
          },
          null,
          2,
        ),
      );
      if (success) toast('Backup saved');
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const restore = async () => {
    setBusy(true);
    try {
      const text = await platform.importFile();
      if (!text) return;
      const data = JSON.parse(text);
      if (data.app !== 'EverydayCalculator' || data.version !== 1)
        throw Error('Choose an Everyday Calculator version 1 backup');
      const restored = validateSettings(data.settings),
        records = validateHistory(data.history);
      if (
        records.some(h => !tools.some(t => t.id === h.tool)) ||
        restored.favorites.some(id => !tools.some(t => t.id === id))
      )
        throw Error('Backup contains unknown calculators');
      Alert.alert(
        'Restore backup?',
        `Replace your settings and history with ${records.length} saved records?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: () => {
              update(restored);
              setHistory(records);
              toast('Backup restored');
            },
          },
        ],
      );
    } catch (e) {
      toast((e as Error).message || 'Unable to restore backup');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Label bold size={28}>
        Your preferences.
      </Label>
      <Card>
        <Row
          icon="Palette"
          title="Appearance"
          detail="Theme and primary colour"
          onPress={() => go('appearance')}
        />
        <Row
          icon="Star"
          title="Favourite tools"
          detail="Choose and reorder your favourites"
          onPress={() => go('favorites')}
        />
        <View style={{ paddingTop: 16, gap: 16 }}>
          <Choice
            label="Startup calculator"
            value={
              settings.startup === 'last'
                ? 'Last used calculator'
                : toolById(settings.startup).title
            }
            options={['Last used calculator', ...tools.map(t => t.title)]}
            onChange={v =>
              update({
                startup:
                  v === 'Last used calculator'
                    ? 'last'
                    : tools.find(t => t.title === v)!.id,
              })
            }
          />
          <Choice
            label="Decimal places (maximum)"
            value={String(settings.decimals)}
            options={['0', '2', '4', '6', '8', '10', '12']}
            onChange={v => update({ decimals: Number(v) })}
          />
        </View>
        <Row
          icon="WholeWord"
          title="Indian number grouping"
          detail="Example: 1,00,000"
          toggle={settings.indian}
          onToggle={v => update({ indian: v })}
        />
        <Row
          icon="Vibrate"
          title="Haptic feedback"
          detail="Gentle vibration on calculator keys"
          toggle={settings.haptics}
          onToggle={v => update({ haptics: v })}
        />
        <Row
          icon="Sun"
          title="Keep screen on"
          detail="While this app is open"
          toggle={settings.keepAwake}
          onToggle={v => update({ keepAwake: v })}
        />
        <Row
          icon="History"
          title="Save calculation history"
          detail="Keep up to 1,000 recent calculations"
          toggle={settings.history}
          onToggle={v => update({ history: v })}
        />
        <Row
          icon="LayoutGrid"
          title="Open tool list at startup"
          toggle={settings.openTools}
          onToggle={v => update({ openTools: v })}
        />
      </Card>
      <Label muted size={12}>
        YOUR DATA
      </Label>
      <Card>
        <Row
          icon="Download"
          title="Create backup"
          detail={
            busy
              ? 'File operation in progress…'
              : 'Save settings and history to a file'
          }
          onPress={() => {
            if (!busy) backup();
          }}
        />
        <Row
          icon="Upload"
          title="Restore backup"
          detail="Import a saved backup file"
          onPress={() => {
            if (!busy) restore();
          }}
        />
        <Row
          icon="Trash2"
          title="Clear history"
          detail={`${history.length} saved calculations`}
          onPress={() =>
            Alert.alert(
              'Clear all history?',
              'This removes your saved calculations from this device.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => setHistory([]),
                },
              ],
            )
          }
        />
      </Card>
      <Card>
        <Row icon="BookOpen" title="Help & guide" onPress={() => go('help')} />
        <Row
          icon="ShieldCheck"
          title="Privacy & data"
          onPress={() => go('privacy')}
        />
      </Card>
      <Label size={12} muted style={{ textAlign: 'center' }}>
        Everyday Calculator · 1.0.0{'\n'}All tools included. No subscription.
      </Label>
    </Page>
  );
}
export function Favorites() {
  const { settings, update, colors } = useApp();
  const ids = [
    ...settings.favorites,
    ...tools.map(t => t.id).filter(id => !settings.favorites.includes(id)),
  ];
  const move = (id: string, delta: number) => {
    const arr = [...settings.favorites],
      i = arr.indexOf(id),
      next = i + delta;
    if (next < 0 || next >= arr.length) return;
    [arr[i], arr[next]] = [arr[next], arr[i]];
    update({ favorites: arr });
  };
  return (
    <Page>
      <Label bold size={26}>
        Your favourite tools.
      </Label>
      <Label muted>Tap the star to add or remove. Use arrows to reorder.</Label>
      {ids.map(id => {
        const t = toolById(id),
          selected = settings.favorites.includes(id);
        return (
          <Card key={id} style={{ padding: 10 }}>
            <View style={styles.row}>
              <IconButton
                name="Star"
                color={selected ? settings.accent : colors.muted}
                label={`${selected ? 'Remove' : 'Add'} ${t.title} ${
                  selected ? 'from' : 'to'
                } favorites`}
                onPress={() =>
                  update({
                    favorites: selected
                      ? settings.favorites.filter(x => x !== id)
                      : [...settings.favorites, id],
                  })
                }
              />
              <Label bold style={{ flex: 1 }}>
                {t.title}
              </Label>
              {selected && (
                <>
                  <IconButton
                    name="ChevronUp"
                    label={`Move ${t.title} up`}
                    onPress={() => move(id, -1)}
                  />
                  <IconButton
                    name="ChevronDown"
                    label={`Move ${t.title} down`}
                    onPress={() => move(id, 1)}
                  />
                </>
              )}
            </View>
          </Card>
        );
      })}
    </Page>
  );
}
export function History({
  reuse,
}: {
  reuse: (s: string, tool: string) => void;
}) {
  const { history, setHistory, toast, colors } = useApp();
  const [query, setQuery] = useState('');
  const items = history.filter(h =>
    `${h.expression} ${h.result} ${toolById(h.tool).title}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const exportCSV = async () => {
    try {
      const esc = (s: string) => '"' + s.replace(/"/g, '""') + '"';
      const csv =
        'Date,Tool,Expression,Result\n' +
        history
          .map(h =>
            [h.date, toolById(h.tool).title, h.expression, h.result]
              .map(esc)
              .join(','),
          )
          .join('\n');
      if (
        await platform.exportFile(
          'EverydayCalculator-history.csv',
          'text/csv',
          csv,
        )
      )
        toast('History exported');
    } catch {
      toast('Unable to export history');
    }
  };
  return (
    <Page>
      <View style={styles.between}>
        <Label bold size={27}>
          Past calculations.
        </Label>
        <IconButton
          name="Download"
          label="Export history as CSV"
          onPress={exportCSV}
        />
      </View>
      <Input label="Search history" value={query} onChange={setQuery} text />
      {items.length === 0 && (
        <Card style={{ gap: 12, alignItems: 'center', padding: 30 }}>
          <Icon name="History" size={40} color={colors.muted} />
          <Label bold>No calculations here yet</Label>
          <Label muted size={13}>
            Saved results will appear here.
          </Label>
        </Card>
      )}
      {items.map(h => (
        <Card key={h.id}>
          <View style={styles.between}>
            <Label size={12} muted>
              {toolById(h.tool).title} · {new Date(h.date).toLocaleDateString()}
            </Label>
            <IconButton
              name="Trash2"
              label="Delete calculation"
              onPress={() => setHistory(history.filter(x => x.id !== h.id))}
            />
          </View>
          <Label size={14} muted style={{ lineHeight: 21 }}>
            {h.expression}
          </Label>
          <Label size={22} bold style={{ marginTop: 10 }}>
            {h.result}
          </Label>
          <View
            style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }}
          >
            {['calculator', 'scientific'].includes(h.tool) && (
              <IconButton
                name="RotateCcw"
                label="Reuse expression"
                onPress={() => reuse(h.expression, h.tool)}
              />
            )}
            <IconButton
              name="Copy"
              label="Copy saved result"
              onPress={() => {
                platform.copy(h.result);
                toast('Copied');
              }}
            />
            <IconButton
              name="Share2"
              label="Share saved result"
              onPress={() =>
                Share.share({
                  message: `${h.expression}\n= ${h.result}`,
                }).catch(() => toast('Unable to share'))
              }
            />
          </View>
        </Card>
      ))}
    </Page>
  );
}
export function Help({ privacy = false }: { privacy?: boolean }) {
  const topics = privacy
    ? [
        [
          'Your calculations stay on your device',
          'History, preferences and cached exchange rates are stored locally in a private SQLite database. No account is required.',
        ],
        [
          'Currency requests',
          'Only the requested currency codes are sent to api.frankfurter.dev. Calculation history, financial inputs and health inputs are not attached to these requests.',
        ],
        [
          'Advertisements',
          'This testing build uses Google sample AdMob IDs and requests non-personalized banner ads. The Google Mobile Ads SDK may process device and network information. Production advertising requires the publisher’s AdMob IDs, consent configuration and published privacy policy.',
        ],
        [
          'Backup files',
          'Backups contain settings and history as readable JSON. Save them somewhere you trust. You choose the destination using Android’s file picker.',
        ],
        [
          'Delete your data',
          'Clear history in Settings. Android Settings → Apps → Everyday Calculator → Storage → Clear storage removes all local app data. No analytics or crash tracking SDK is included.',
        ],
      ]
    : [
        [
          'Getting started',
          'Use Calculator for everyday arithmetic, or open All Tools to find a specialist calculator. Search by name or choose a category. All features are available without a subscription.',
        ],
        [
          'Calculator & scientific mode',
          'Tap the expression to move its cursor. Use brackets for grouping. The scientific calculator supports sin, cos, tan, logarithms, roots, powers and factorials. DEG/RAD changes the angle convention. Long calculations can be scrolled.',
        ],
        [
          'Percentages',
          'The % key always means divide by 100: 200 × 10% = 20; 200 + 10% = 200.1. To increase 200 by 10%, enter 200 × (1 + 10%). Use Percentage or Discount for guided calculations.',
        ],
        [
          'Memory & history',
          'M+ adds the current value to memory; M− subtracts it. MR inserts memory; MC clears it. Memory lasts for the calculator screen session. Press = to save a calculation. History lets you copy, share, delete or reuse expressions.',
        ],
        [
          'Favourite tools',
          'Long press a tile in All Tools, or open Settings → Favourite tools. Use the arrows to reorder favourites. The Favorites filter shows your chosen tools.',
        ],
        [
          'Themes & colours',
          'Open Settings → Appearance to choose Light, Dark or System and a primary colour. Custom colours use six-digit hex codes. Settings also controls decimals, Indian number grouping and vibration.',
        ],
        [
          'Currency conversion',
          'Choose the source and destination currency and enter an amount. The app fetches the latest published daily reference rate and shows its date. If refresh fails, a saved rate is shown when available. There are no invented fallback rates.',
        ],
        [
          'Dates, units & estimates',
          'Enter dates as YYYY-MM-DD. Date differences use calendar days. Use the same quantity units when comparing unit prices. Financial projections assume the stated constant rates and exclude fees. Health and cycle tools provide estimates only.',
        ],
        [
          'Backup & restore',
          'Settings → Create backup saves a JSON file using the Android picker. Restore validates the file and asks before replacing local settings and history. Cloud destinations are available if your Android file picker provides them.',
        ],
      ];
  return (
    <Page>
      <Label size={27} bold>
        {privacy ? 'Privacy & your data.' : 'A little guidance.'}
      </Label>
      {topics.map(([title, text]) => (
        <Card key={title}>
          <Label bold size={17}>
            {title}
          </Label>
          <Label muted size={14} style={{ lineHeight: 23, marginTop: 10 }}>
            {text}
          </Label>
        </Card>
      ))}
      {privacy && (
        <Action
          title="Google advertising privacy"
          secondary
          icon="ExternalLink"
          onPress={() =>
            Linking.openURL('https://policies.google.com/technologies/ads')
          }
        />
      )}
    </Page>
  );
}
