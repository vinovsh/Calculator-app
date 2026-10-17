import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconButton, Label, useApp } from './UI';
const destinations = [
  ['calculator', 'Calculator', 'Calculator'],
  ['scientific', 'FlaskConical', 'Scientific calculator'],
  ['tools', 'LayoutGrid', 'All tools'],
  ['history', 'History', 'History'],
  ['settings', 'Settings2', 'Settings'],
] as const;
export function SideMenu({
  visible,
  current,
  close,
  select,
}: {
  visible: boolean;
  current: string;
  close: () => void;
  select: (page: string) => void;
}) {
  const { colors, settings } = useApp();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View
        style={{ flex: 1, flexDirection: 'row', backgroundColor: '#00000066' }}
      >
        <SafeAreaView
          accessibilityViewIsModal
          style={{ width: '84%', maxWidth: 360, backgroundColor: colors.card }}
        >
          <View
            style={{
              padding: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Icon name="Calculator" color={settings.accent} size={30} />
              <IconButton
                name="X"
                label="Close navigation menu"
                onPress={close}
              />
            </View>
            <Label bold size={23} style={{ marginTop: 12 }}>
              Everyday Calculator
            </Label>
            <Label muted size={13} style={{ marginTop: 6 }}>
              All your calculations in one place.
            </Label>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12, gap: 6 }}>
            {destinations.map(([id, icon, label]) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Navigate to ${label}`}
                accessibilityState={{ selected: current === id }}
                onPress={() => select(id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  minHeight: 56,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor:
                    current === id ? settings.accent + '18' : 'transparent',
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Icon
                  name={icon}
                  color={current === id ? settings.accent : colors.muted}
                />
                <Label
                  bold={current === id}
                  color={current === id ? settings.accent : colors.text}
                >
                  {label}
                </Label>
              </Pressable>
            ))}
            <View
              style={{
                height: 1,
                backgroundColor: colors.line,
                marginVertical: 10,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Navigate to Help & guide"
              onPress={() => select('help')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                minHeight: 56,
                padding: 14,
              }}
            >
              <Icon name="BookOpen" color={colors.muted} />
              <Label>Help & guide</Label>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss navigation menu"
          onPress={close}
          style={{ flex: 1 }}
        />
      </View>
    </Modal>
  );
}
