import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmtW, LIFTS, plates, PROGRAM, type LiftKey, type TrackerData, type WorkoutType } from '@/lib/program';
import { colors, fonts } from '@/theme';
import { Check, ResetIcon } from './Check';

type Props = {
  data: TrackerData;
  reps: Record<LiftKey, (number | null)[]>;
  other: WorkoutType;
  rest: { bg: string; label: string; time: string; action: string };
  onTapSet: (k: LiftKey, i: number) => void;
  onTimerPress: () => void;
  onTimerReset: () => void;
  onFinish: () => void;
  onSwitch: () => void;
};

export function WorkoutCard({ data, reps, other, rest, onTapSet, onTimerPress, onTimerReset, onFinish, onSwitch }: Props) {
  const ks = PROGRAM[data.next];
  const anyLogged = ks.some((k) => reps[k].some((v) => v != null));
  return (
    <View style={s.card} accessibilityLabel="Next workout">
      <View style={s.head}>
        <View>
          <Text style={s.eyebrow}>UP NEXT</Text>
          <Text style={s.title}>Workout {data.next}</Text>
          <Text style={s.sub}>{ks.map((k) => LIFTS[k].name).join(', ')}</Text>
        </View>
        <View style={[s.timer, { backgroundColor: rest.bg }]} accessibilityRole="timer" accessibilityLabel="Rest timer">
          <View style={{ minWidth: 96 }}>
            <Text style={s.timerLabel}>{rest.label}</Text>
            <Text style={s.timerTime}>{rest.time}</Text>
          </View>
          <Pressable onPress={onTimerPress} style={s.timerBtn} accessibilityRole="button">
            <Text style={s.timerBtnText}>{rest.action}</Text>
          </Pressable>
          <Pressable onPress={onTimerReset} style={s.timerReset} accessibilityRole="button" accessibilityLabel="Reset timer to 2:00">
            <ResetIcon color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {ks.map((k) => {
        const L = LIFTS[k];
        const w = data.lifts[k].w;
        const f = data.lifts[k].fails || 0;
        return (
          <View key={k} style={s.ex}>
            <View style={s.exInfo}>
              <View style={s.nameRow}>
                <View style={[s.dot, { backgroundColor: L.color }]} />
                <Text style={s.exName}>{L.name}</Text>
              </View>
              <Text style={s.weight}>
                {fmtW(w)} <Text style={s.scheme}>lb · {L.sets}×5</Text>
              </Text>
              <Text style={s.small}>{plates(w)}</Text>
              {f > 0 && <Text style={s.fail}>Missed {f} of 3 in a row at this weight</Text>}
            </View>
            <View style={s.sets}>
              {reps[k].map((v, i) => {
                const done = v != null && v >= 5;
                return (
                  <Pressable
                    key={i}
                    onPress={() => onTapSet(k, i)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={`${L.name} set ${i + 1}`}
                    style={[s.set, done ? s.setDone : null]}>
                    {done && <Check color="#FFFFFF" />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <View style={s.foot}>
        <Pressable onPress={onFinish} disabled={!anyLogged} style={[s.finish, !anyLogged && { opacity: 0.4 }]} accessibilityRole="button">
          <Text style={s.finishText}>Finish Workout {data.next}</Text>
        </Pressable>
        <Text style={s.help}>
          Tap a set to check it off and restart the rest timer. Tap again to uncheck. Unchecked sets count as missed.
        </Text>
        <Pressable onPress={onSwitch} style={s.switch} accessibilityRole="button">
          <Text style={s.switchText}>Do Workout {other} instead</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 20 },
  head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  eyebrow: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.4, color: colors.accent },
  title: { fontFamily: fonts.black, fontSize: 40, letterSpacing: -0.8, color: colors.ink, marginTop: 4 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingRight: 10, paddingLeft: 16, borderRadius: 12 },
  timerLabel: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.1, color: '#FFFFFF' },
  timerTime: { fontFamily: fonts.monoBold, fontSize: 32, lineHeight: 36, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  timerBtn: { minWidth: 76, height: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  timerBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  timerReset: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  ex: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
  exInfo: { flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  exName: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  weight: { fontFamily: fonts.monoBold, fontSize: 28, color: colors.ink, marginTop: 6 },
  scheme: { fontFamily: fonts.mono, fontSize: 14, color: colors.muted },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  fail: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent, marginTop: 4 },
  sets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  set: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  setDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  foot: { gap: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
  finish: { minHeight: 52, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  finishText: { fontFamily: fonts.bold, fontSize: 16, color: '#FFFFFF' },
  help: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  switch: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  switchText: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
});
