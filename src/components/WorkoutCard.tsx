import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fmtDate, fmtW, KEYS, LIFTS, lastDone, plates, setCount, type LiftKey, type TrackerData } from '@/lib/program';
import { useLayout } from '@/hooks/useLayout';
import { colors, fonts } from '@/theme';
import { Check } from './Check';

type Props = {
  data: TrackerData;
  reps: Record<LiftKey, (number | null)[]>;
  onCount: (k: LiftKey, delta: 1 | -1) => void;
  onSetWeight: (k: LiftKey, w: number) => void;
  onFinish: () => void;
};

/** Every lift, what you did last time, and a tap counter for today's sets. Do any lifts in any order. */
export function WorkoutCard({ data, reps, onCount, onSetWeight, onFinish }: Props) {
  const { cardPad, type } = useLayout();
  const touched = KEYS.filter((k) => setCount(reps[k]) > 0).length;
  return (
    <View style={[s.card, { padding: cardPad }]} accessibilityLabel="Today's workout">
      <View>
        <Text style={s.eyebrow}>TODAY</Text>
        <Text style={[s.title, { fontSize: type(36) }]}>Lifts</Text>
        <Text style={s.sub}>Tap a lift each time you finish a set.</Text>
      </View>

      {KEYS.map((k) => {
        const L = LIFTS[k];
        const w = data.lifts[k].w;
        const f = data.lifts[k].fails || 0;
        const last = lastDone(data, k);
        const n = setCount(reps[k]);
        const full = n >= L.sets;
        return (
          <View key={k} style={s.ex}>
            <View style={s.exInfo}>
              <View style={s.nameRow}>
                <View style={[s.dot, { backgroundColor: L.color }]} />
                <Text style={s.exName}>{L.name}</Text>
              </View>
              <View style={s.weightRow}>
                <WeightInput name={L.name} w={w} size={type(26)} onSet={(v) => onSetWeight(k, v)} />
                <Text style={s.scheme}>lb · {L.sets}×5</Text>
              </View>
              <Text style={s.last}>
                {last
                  ? `Last: ${fmtW(last.w)} lb · ${last.reps.join('/')} · ${fmtDate(last.date)}`
                  : 'Last: not done yet'}
              </Text>
              <Text style={s.small}>{plates(w)}</Text>
              {f > 0 && <Text style={s.fail}>Missed {f} of 3 in a row at this weight</Text>}
            </View>
            <View style={s.counter}>
              {n > 0 && (
                <Pressable onPress={() => onCount(k, -1)} style={s.minus} accessibilityRole="button" accessibilityLabel={`Take back a ${L.name} set`}>
                  <Text style={s.minusText}>−</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => onCount(k, 1)}
                style={[s.tap, full && s.tapFull]}
                accessibilityRole="button"
                accessibilityLabel={`${L.name}: ${n} of ${L.sets} sets. Tap to count a set.`}>
                {full ? (
                  <Check size={30} color="#FFFFFF" />
                ) : (
                  <Text style={s.tapCount}>
                    {n}
                    <Text style={s.tapOf}>/{L.sets}</Text>
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={s.foot}>
        <Pressable onPress={onFinish} disabled={!touched} style={[s.finish, !touched && { opacity: 0.4 }]} accessibilityRole="button">
          <Text style={s.finishText}>{touched ? `Finish · log ${touched} lift${touched > 1 ? 's' : ''}` : 'Finish workout'}</Text>
        </Pressable>
        <Text style={s.help}>
          Only lifts with at least one set are logged. All sets done and the weight goes up next time; fewer counts as a miss.
        </Text>
      </View>
    </View>
  );
}

/** The working weight, edited in place: tap it, type a number, done. */
function WeightInput({ name, w, size, onSet }: { name: string; w: number; size: number; onSet: (w: number) => void }) {
  // Text being typed; null when not editing so the field shows the stored weight.
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft == null) return;
    const v = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(v) && v >= 0) onSet(v);
    setDraft(null);
  };
  return (
    <TextInput
      value={draft ?? fmtW(w)}
      onChangeText={setDraft}
      onFocus={() => setDraft(fmtW(w))}
      onEndEditing={commit}
      onSubmitEditing={commit}
      onBlur={commit}
      keyboardType="decimal-pad"
      returnKeyType="done"
      selectTextOnFocus
      accessibilityLabel={`${name} working weight in pounds`}
      style={[s.weightInput, { fontSize: size, width: size * 2.6 }]}
    />
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, gap: 20 },
  eyebrow: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.4, color: colors.accent },
  title: { fontFamily: fonts.black, letterSpacing: -0.8, color: colors.ink, marginTop: 4 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  ex: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
  exInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  exName: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  weightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  weightInput: { fontFamily: fonts.monoBold, color: colors.ink, padding: 0, borderBottomWidth: 2, borderStyle: 'dashed', borderBottomColor: colors.lineStrong },
  scheme: { fontFamily: fonts.mono, fontSize: 14, color: colors.muted },
  last: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 4 },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  fail: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent, marginTop: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  minus: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  minusText: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink, lineHeight: 26 },
  tap: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  tapFull: { backgroundColor: colors.go, borderColor: colors.go },
  tapCount: { fontFamily: fonts.monoBold, fontSize: 28, color: colors.ink, fontVariant: ['tabular-nums'] },
  tapOf: { fontFamily: fonts.mono, fontSize: 15, color: colors.muted },
  foot: { gap: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
  finish: { minHeight: 52, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  finishText: { fontFamily: fonts.bold, fontSize: 16, color: '#FFFFFF' },
  help: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
});
