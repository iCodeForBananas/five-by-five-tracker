import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mmss, REST } from '@/lib/program';
import { useLayout } from '@/hooks/useLayout';
import { colors, fonts } from '@/theme';

type Props = {
  /** Seconds left on the clock. */
  left: number;
  /** True while counting down (including when it has hit 0:00 and not been reset). */
  running: boolean;
  /** Start, pause, or resume. Restarts from 2:00 when the clock has run out. */
  onToggle: () => void;
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

/**
 * Rest timer pinned to the top of the screen. Idle: the whole bar is one big Start button.
 * Once started it shows Pause (or Resume) and Reset.
 */
export function RestTimerBar({ left, running, onToggle, onReset }: Props) {
  const { type } = useLayout();
  const idle = !running && left === REST;
  const ready = running && left <= 0;
  const bg = ready ? colors.go : colors.dark;
  const label = idle ? 'REST TIMER' : ready ? 'GO · NEXT SET' : running ? 'RESTING' : 'PAUSED';
  const time = <Text style={[s.time, { fontSize: type(44), lineHeight: type(50) }]}>{mmss(left)}</Text>;

  if (idle) {
    return (
      <Pressable onPress={onToggle} style={[s.bar, { backgroundColor: bg }]} accessibilityRole="button" accessibilityLabel="Start 2 minute rest timer">
        <View style={s.text}>
          <Text style={s.label}>{label}</Text>
          {time}
        </View>
        <View style={s.primary}>
          <Text style={s.primaryText}>Tap to start</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[s.bar, { backgroundColor: bg }]} accessibilityRole="timer" accessibilityLabel="Rest timer">
      {running && <KeepAwake />}
      <View style={s.text}>
        <Text style={s.label}>{label}</Text>
        {time}
      </View>
      <Pressable onPress={onToggle} style={s.primary} accessibilityRole="button">
        <Text style={s.primaryText}>{ready ? 'Restart' : running ? 'Pause' : 'Resume'}</Text>
      </Pressable>
      <Pressable onPress={onReset} style={s.ghost} accessibilityRole="button" accessibilityLabel="Reset timer to 2:00">
        <Text style={s.ghostText}>Reset</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 18, paddingRight: 12, borderRadius: 16 },
  text: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.2, color: '#FFFFFF' },
  time: { fontFamily: fonts.monoBold, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  primary: { minWidth: 92, height: 52, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  ghost: { minWidth: 80, height: 52, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.bold, fontSize: 16, color: '#FFFFFF' },
});
