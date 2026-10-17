import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StatusBar,
  Pressable,
  useColorScheme,
  BackHandler,
  ActivityIndicator,
  Text,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  AppContext,
  light,
  dark,
  Label,
  IconButton,
} from './src/components/UI';
import {
  Settings as SettingsType,
  HistoryEntry,
  defaults,
  readJSON,
  writeJSON,
  validateSettings,
  validateHistory,
  platform,
} from './src/core/storage';
import { toolById, tools } from './src/core/tools';
import { Calculator } from './src/screens/Calculator';
import {
  AllTools,
  FormTool,
  UnitConverter,
  WorldTime,
} from './src/screens/Tools';
import { Currency } from './src/screens/Currency';
import {
  Appearance,
  Settings,
  Favorites,
  History,
  Help,
} from './src/screens/Preferences';
import { AdBanner } from './src/components/AdBanner';
import { SideMenu } from './src/components/SideMenu';
export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F6F8FC',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 24, color: '#152139' }}>
            Let’s try that again.
          </Text>
          <Text style={{ color: '#63728A' }}>
            Your saved calculations are kept on this device.
          </Text>
          <Pressable
            onPress={() => this.setState({ error: false })}
            style={{
              padding: 16,
              backgroundColor: '#1764FF',
              borderRadius: 14,
            }}
          >
            <Text style={{ color: 'white' }}>Reopen calculator</Text>
          </Pressable>
        </View>
      );
    return this.props.children;
  }
}
function Root() {
  const system = useColorScheme();
  const [settings, setSettings] = useState<SettingsType>(defaults),
    [history, setHistory] = useState<HistoryEntry[]>([]),
    [page, setPage] = useState('calculator'),
    [ready, setReady] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [message, setMessage] = useState(''),
    [reuse, setReuse] = useState(''),
    [session, setSession] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    nav = useRef<string[]>([]);
  const colors =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && system === 'dark')
      ? dark
      : light;
  const toast = (s: string) => {
    setMessage(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), 3500);
  };
  useEffect(() => {
    let active = true;
    Promise.all([
      readJSON('settings', defaults),
      readJSON<HistoryEntry[]>('history', []),
      readJSON('last', 'calculator'),
    ])
      .then(([s, h, last]) => {
        const prefs = validateSettings(s),
          records = validateHistory(h);
        if (active) {
          setSettings(prefs);
          setHistory(records);
          const start = prefs.startup === 'last' ? last : prefs.startup;
          setPage(
            prefs.openTools
              ? 'tools'
              : tools.some(t => t.id === start)
              ? start
              : 'calculator',
          );
        }
      })
      .catch(() => {
        if (active)
          Alert.alert(
            'Could not load saved data',
            'The app will open with defaults. Your stored data has not been overwritten.',
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const loaded = useRef(false);
  useEffect(() => {
    if (ready && !loaded.current) {
      loaded.current = true;
    }
  }, [ready]);
  const persistSettings = (next: SettingsType) => {
    setSettings(next);
    writeJSON('settings', next).catch(() =>
      toast('Could not save preferences. Check device storage.'),
    );
  };
  const update = (patch: Partial<SettingsType>) =>
    persistSettings({ ...settings, ...patch });
  const changeHistory = (next: HistoryEntry[]) => {
    setHistory(next);
    writeJSON('history', next).catch(() =>
      toast('Could not save history. Check device storage.'),
    );
  };
  const go = (next: string) => {
    setMenuOpen(false);
    if (next === page) return;
    nav.current.push(page);
    setReuse('');
    setSession(s => s + 1);
    setPage(next);
    if (tools.some(t => t.id === next)) writeJSON('last', next).catch(() => {});
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      const prev = nav.current.pop();
      if (prev) {
        setReuse('');
        setPage(prev);
        setSession(s => s + 1);
        return true;
      }
      if (page !== 'calculator') {
        setPage('calculator');
        return true;
      }
      return false;
    });
    return () => listener.remove();
  }, [page]);
  useEffect(() => {
    platform.keepAwake(settings.keepAwake);
    const sub = AppState.addEventListener('change', s =>
      platform.keepAwake(s === 'active' && settings.keepAwake),
    );
    return () => {
      sub.remove();
      platform.keepAwake(false);
    };
  }, [settings.keepAwake]);
  const save = (tool: string, expression: string, result: string) => {
    if (!settings.history) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool,
      expression,
      result,
      date: new Date().toISOString(),
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 1000);
      writeJSON('history', next).catch(() => toast('Unable to save history'));
      return next;
    });
  };
  const tool = toolById(page),
    title =
      (
        {
          tools: 'All tools',
          settings: 'Settings',
          appearance: 'Appearance',
          favorites: 'Favourite tools',
          history: 'History',
          help: 'Help & guide',
          privacy: 'Privacy & data',
        } as Record<string, string>
      )[page] || tool.title;
  const main = [
    'calculator',
    'scientific',
    'tools',
    'history',
    'settings',
  ].includes(page);
  let screen: React.ReactNode;
  if (page === 'calculator' || page === 'scientific')
    screen = (
      <Calculator
        key={session}
        initial={reuse}
        scientific={page === 'scientific'}
      />
    );
  else if (page === 'tools') screen = <AllTools />;
  else if (page === 'currency') screen = <Currency />;
  else if (page === 'units') screen = <UnitConverter />;
  else if (page === 'world') screen = <WorldTime />;
  else if (page === 'settings') screen = <Settings />;
  else if (page === 'appearance') screen = <Appearance />;
  else if (page === 'favorites') screen = <Favorites />;
  else if (page === 'history')
    screen = (
      <History
        reuse={(s, t) => {
          nav.current.push(page);
          setReuse(s);
          setSession(v => v + 1);
          setPage(t);
        }}
      />
    );
  else if (page === 'help' || page === 'privacy')
    screen = <Help privacy={page === 'privacy'} />;
  else screen = <FormTool key={page} tool={tool} />;
  if (!ready)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={settings.accent} size="large" />
        <Text style={{ color: colors.text, marginTop: 16 }}>
          Everyday Calculator
        </Text>
      </SafeAreaView>
    );
  return (
    <AppContext.Provider
      value={{
        colors,
        settings,
        update,
        go,
        save,
        history,
        setHistory: changeHistory,
        toast,
      }}
    >
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        <StatusBar
          barStyle={colors.dark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.bg}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            height: 60,
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
        >
          <IconButton
            name="Menu"
            label="Open navigation menu"
            onPress={() => setMenuOpen(true)}
          />
          {!main && (
            <IconButton
              name="ArrowLeft"
              label="Go back"
              onPress={() => {
                setPage(nav.current.pop() || 'tools');
                setSession(s => s + 1);
              }}
            />
          )}
          <Label bold size={20} style={{ flex: 1 }}>
            {title}
          </Label>
          {tools.some(t => t.id === page) && (
            <IconButton
              name="Star"
              color={
                settings.favorites.includes(page)
                  ? settings.accent
                  : colors.muted
              }
              label="Toggle favourite"
              onPress={() =>
                update({
                  favorites: settings.favorites.includes(page)
                    ? settings.favorites.filter(id => id !== page)
                    : [...settings.favorites, page],
                })
              }
            />
          )}
          <IconButton
            name={page === 'settings' ? 'CircleHelp' : 'Settings2'}
            label={page === 'settings' ? 'Help' : 'Settings'}
            onPress={() => go(page === 'settings' ? 'help' : 'settings')}
          />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {screen}
        </KeyboardAvoidingView>
        {!!message && (
          <Pressable
            onPress={() => setMessage('')}
            accessibilityRole="alert"
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: 80,
              zIndex: 10,
              padding: 16,
              borderRadius: 14,
              backgroundColor: colors.dark ? '#E9EFFA' : '#263650',
              elevation: 6,
            }}
          >
            <Text
              style={{
                color: colors.dark ? '#152139' : 'white',
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
          </Pressable>
        )}
        <AdBanner />
        <SideMenu
          visible={menuOpen}
          current={page}
          close={() => setMenuOpen(false)}
          select={go}
        />
      </SafeAreaView>
    </AppContext.Provider>
  );
}
