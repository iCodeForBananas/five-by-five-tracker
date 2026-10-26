import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fmtW, KEYS, LIFTS, num, shortDate, type LiftKey, type TrackerData } from '@/lib/program';
import { colors, fonts } from '@/theme';

type Props = { data: TrackerData; onSetWeight: (k: LiftKey, w: number) => void };

export function WeightTiles({ data, onSetWeight }: Props) {
  return (
    <View style={s.wrap} accessibilityLabel="Current weights">
      <Text style={s.heading}>WORKING WEIGHTS · LB · TAP TO EDIT</Text>
      {KEYS.map((k) => {
        const firstSession = data.sessions.find((ss) => ss.entries.some((e) => e.k === k));
        const first = firstSession?.entries.find((e) => e.k === k);
        const w = num(data.lifts[k].w);
        const f = data.lifts[k].fails || 0;
        let sub: string;
        if (firstSession && first) {
          const gain = w - num(first.w);
          sub = (gain > 0 ? '+' + fmtW(gain) + ' lb' : gain < 0 ? fmtW(gain) + ' lb' : 'No change') + ' since ' + shortDate(firstSession.date);
        } else sub = 'Not trained yet';
        if (f > 0) sub += ' · ' + f + ' miss' + (f > 1 ? 'es' : '');
        return <Tile key={k} k={k} w={w} sub={sub} onSet={(v) => onSetWeight(k, v)} />;
      })}
    </View>
  );
}

function Tile({ k, w, sub, onSet }: { k: LiftKey; w: number; sub: string; onSet: (w: number) => void }) {
  const L = LIFTS[k];
  // Text being typed; null when not editing so the field shows the stored weight.
  const [draft, setDraft] = useState<string | null>(null);

  const commitText = () => {
    if (draft == null) return;
    const v = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(v) && v >= 0) onSet(v);
    setDraft(null);
  };

  return (
    <View style={s.tile}>
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <View style={s.nameRow}>
          <View style={[s.dot, { backgroundColor: L.color }]} />
          <Text style={s.name}>{L.name}</Text>
        </View>
        <Text style={s.sub}>{sub}</Text>
      </View>
      <View style={s.controls}>
        <Pressable onPress={() => onSet(Math.max(0, w - 5))} style={s.step} accessibilityRole="button" accessibilityLabel={`Lower ${L.name} by 5 lb`}>
          <Text style={s.stepText}>−</Text>
        </Pressable>
        <TextInput
          value={draft ?? fmtW(w)}
          onChangeText={setDraft}
          onFocus={() => setDraft(fmtW(w))}
          onEndEditing={commitText}
          onSubmitEditing={commitText}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          accessibilityLabel={`${L.name} working weight in pounds`}
          style={s.input}
        />
        <Pressable onPress={() => onSet(w + 5)} style={s.step} accessibilityRole="button" accessibilityLabel={`Raise ${L.name} by 5 lb`}>
          <Text style={s.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  heading: { fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 1.5, color: colors.muted, marginBottom: 4 },
  tile: { backgroundColor: colors.card, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  step: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.semibold, fontSize: 22, color: colors.muted },
  input: { width: 76, height: 44, borderBottomWidth: 2, borderStyle: 'dashed', borderBottomColor: colors.lineStrong, fontFamily: fonts.monoBold, fontSize: 24, textAlign: 'center', color: colors.ink, padding: 0 },
});
