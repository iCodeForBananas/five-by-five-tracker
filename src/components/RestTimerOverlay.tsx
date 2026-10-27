import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';
import { Check } from './Check';

type Props = {
  visible: boolean;
  bg: string;
  label: string;
  time: string;
  upNext: string;
  hasNextSet: boolean;
  action: string;
  onHide: () => void;
  onSetDone: () => void;
  onToggle: () => void;
  onAddTime: () => void;
  onReset: () => void;
};

/** Keeps the screen on while mounted. Not useKeepAwake(): on web it throws if the wake lock never activated. */
function KeepAwake() {
  useEffect(() => {
    const tag = 'rest-timer';
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, []);
  return null;
}

/** Full-screen rest timer shown after a set is checked off. */
export function RestTimerOverlay(p: Props) {
  const { width, height } = useWindowDimensions();
  const big = Math.min(width * 0.36, height * 0.3);
  // Insets come from the app's provider: inside an Android Modal, SafeAreaView measures the modal window and can report zero.
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={p.visible} animationType="fade" onRequestClose={p.onHide} statusBarTranslucent>
      {p.visible && <KeepAwake />}
      <View
        style={[s.root, { backgroundColor: p.bg, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}
        accessibilityRole="timer"
        accessibilityLabel="Rest timer">
        <View style={s.top}>
          <Text style={s.label}>{p.label}</Text>
          <Pressable onPress={p.onHide} style={s.hide} accessibilityRole="button">
            <Text style={s.hideText}>Hide</Text>
          </Pressable>
        </View>
        <View style={s.center}>
          <Text style={[s.time, { fontSize: big, lineHeight: big * 1.1 }]} adjustsFontSizeToFit numberOfLines={1}>
            {p.time}
          </Text>
          <Text style={s.upNext}>{p.upNext}</Text>
        </View>
        <View style={s.bottom}>
          {p.hasNextSet && (
            <Pressable onPress={p.onSetDone} style={s.setDone} accessibilityRole="button">
              <Check size={30} color={colors.ink} />
              <Text style={s.setDoneText}>Set done</Text>
            </Pressable>
          )}
          <View style={s.row}>
            {[
              [p.action, p.onToggle],
              ['+30s', p.onAddTime],
              ['Reset', p.onReset],
            ].map(([t, fn]) => (
              <Pressable key={t as string} onPress={fn as () => void} style={s.ghost} accessibilityRole="button">
                <Text style={s.ghostText}>{t as string}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  top: { width: '100%', maxWidth: 760, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontFamily: fonts.monoBold, fontSize: 20, letterSpacing: 2.4, color: '#FFFFFF' },
  hide: { minHeight: 56, paddingHorizontal: 22, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center' },
  hideText: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' },
  center: { alignItems: 'center', gap: 8, width: '100%' },
  time: { fontFamily: fonts.monoBold, color: '#FFFFFF', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  upNext: { fontFamily: fonts.semibold, fontSize: 22, color: '#FFFFFF', opacity: 0.9, textAlign: 'center' },
  bottom: { width: '100%', maxWidth: 760, gap: 12 },
  setDone: { minHeight: 88, borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  setDoneText: { fontFamily: fonts.black, fontSize: 26, color: colors.ink },
  row: { flexDirection: 'row', gap: 12 },
  ghost: { flex: 1, minHeight: 80, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.bold, fontSize: 22, color: '#FFFFFF' },
});
