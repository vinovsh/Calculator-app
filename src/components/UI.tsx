import React, { createContext, useContext, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Icons from 'lucide-react-native';
import { Settings, HistoryEntry } from '../core/storage';
import { formatNumber } from '../core/expression';
export const light = {
  bg: '#F6F8FC',
  card: '#FFFFFF',
  text: '#152139',
  muted: '#63728A',
  line: '#E4EAF3',
  key: '#FFFFFF',
  soft: '#EDF2FA',
  dark: false,
};
export const dark = {
  bg: '#101722',
  card: '#1A2534',
  text: '#F3F6FE',
  muted: '#A7B4C7',
  line: '#2C3B50',
  key: '#202D3E',
  soft: '#253448',
  dark: true,
};
export type Palette = typeof light;
export type AppContextType = {
  colors: Palette;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  go: (page: string) => void;
  save: (tool: string, expression: string, result: string) => void;
  history: HistoryEntry[];
  setHistory: (h: HistoryEntry[]) => void;
  toast: (message: string) => void;
};
export const AppContext = createContext<AppContextType>(null as any);
export const useApp = () => useContext(AppContext);
export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { colors } = useApp();
  const Component = (Icons as any)[name] || Icons.Calculator;
  return (
    <Component
      size={size}
      color={color || colors.text}
      strokeWidth={strokeWidth}
    />
  );
}
export function Label({
  children,
  muted = false,
  size = 15,
  bold = false,
  color,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
  bold?: boolean;
  color?: string;
  style?: any;
}) {
  const { colors } = useApp();
  return (
    <Text
      style={[
        {
          color: color || (muted ? colors.muted : colors.text),
          fontSize: size,
          fontWeight: bold ? '700' : '400',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useApp();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 22,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Action({
  title,
  onPress,
  icon,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { settings, colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        padding: 14,
        borderRadius: 15,
        backgroundColor: secondary ? colors.soft : settings.accent,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      })}
    >
      {icon && <Icon name={icon} color={secondary ? colors.text : '#FFFFFF'} />}
      <Label bold color={secondary ? colors.text : '#FFFFFF'}>
        {title}
      </Label>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  color,
}: {
  name: string;
  onPress: () => void;
  label: string;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 12,
        minWidth: 46,
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Input({
  label,
  value,
  onChange,
  text = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  text?: boolean;
  placeholder?: string;
}) {
  const { colors, settings } = useApp();
  return (
    <View style={{ gap: 8 }}>
      <Label muted size={13} bold>
        {label}
      </Label>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={text ? 'default' : 'decimal-pad'}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={300}
        selectionColor={settings.accent}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 14,
          minHeight: 54,
          paddingHorizontal: 15,
          paddingVertical: 12,
          color: colors.text,
          fontSize: 19,
          backgroundColor: colors.bg,
        }}
      />
    </View>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (s: string) => void;
}) {
  const { colors, settings } = useApp();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState('');
  return (
    <View style={{ gap: 8 }}>
      <Label muted size={13} bold>
        {label}
      </Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
        style={{
          minHeight: 52,
          borderColor: colors.line,
          borderWidth: 1,
          padding: 14,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          backgroundColor: colors.bg,
        }}
      >
        <Label style={{ flex: 1 }}>{value}</Label>
        <Icon name="ChevronDown" size={18} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#00000088',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              maxHeight: '80%',
              padding: 20,
              gap: 16,
            }}
          >
            <View style={styles.row}>
              <Label bold size={21} style={{ flex: 1 }}>
                {label}
              </Label>
              <IconButton
                name="X"
                label="Close selection"
                onPress={() => setOpen(false)}
              />
            </View>
            {options.length > 8 && (
              <Input label="Search" value={search} onChange={setSearch} text />
            )}
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={options.filter(o =>
                o.toLowerCase().includes(search.toLowerCase()),
              )}
              keyExtractor={s => s}
              ListEmptyComponent={<Label muted>No matching options</Label>}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: item === value }}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={{
                    minHeight: 54,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Label
                    style={{ flex: 1 }}
                    color={item === value ? settings.accent : undefined}
                  >
                    {item}
                  </Label>
                  {item === value && (
                    <Icon name="Check" color={settings.accent} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: 30, gap: 18 }}
    >
      {children}
    </ScrollView>
  );
}
export function ResultCard({
  label,
  value,
  unit,
  primary = false,
  raw = false,
}: {
  label: string;
  value: string;
  unit?: string;
  primary?: boolean;
  raw?: boolean;
}) {
  const { settings, colors } = useApp();
  return (
    <Card
      style={
        primary
          ? {
              backgroundColor: settings.accent + '12',
              borderColor: settings.accent + '40',
            }
          : undefined
      }
    >
      <Label muted size={13}>
        {label}
      </Label>
      <Label
        bold
        size={primary ? 30 : 23}
        color={primary ? settings.accent : colors.text}
        style={{ marginTop: 8 }}
      >
        {raw ? value : formatNumber(value, settings.decimals, settings.indian)}
        {unit ? ` ${unit}` : ''}
      </Label>
    </Card>
  );
}
export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
});
