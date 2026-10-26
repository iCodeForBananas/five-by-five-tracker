import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmtDate, fmtW, LIFTS, type Session } from '@/lib/program';
import { colors, fonts } from '@/theme';

type Props = { sessions: Session[]; onUndo: () => void };

export function HistoryList({ sessions, onUndo }: Props) {
  const recent = sessions.slice().reverse().slice(0, 30);
  return (
    <View style={s.card} accessibilityLabel="History">
      <View style={s.head}>
        <Text style={s.title}>History</Text>
        {sessions.length > 0 && (
          <Pressable onPress={onUndo} style={s.undo} accessibilityRole="button">
            <Text style={s.undoText}>Undo last session</Text>
          </Pressable>
        )}
      </View>
      {sessions.length === 0 && <Text style={s.empty}>Finished sessions show up here.</Text>}
      {recent.map((ss) => (
        <View key={ss.date} style={s.row}>
          <View style={{ width: 120 }}>
            <Text style={s.date}>{fmtDate(ss.date)}</Text>
            <Text style={s.muted}>Workout {ss.type}</Text>
          </View>
          <View style={s.entries}>
            {ss.entries.map((e) => (
              <View key={e.k} style={s.entry}>
                <Text style={[s.cell, { width: 130 }]}>{LIFTS[e.k].name}</Text>
                <Text style={[s.mono, { width: 72 }]}>{fmtW(e.w)} lb</Text>
                <Text style={[s.mono, s.monoMuted, { width: 110 }]}>{e.reps.join('/')}</Text>
                <Text style={[s.note, { color: e.ok ? colors.go : colors.accent }]}>{e.note}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
  title: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -0.3, color: colors.ink },
  undo: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.lineStrong, justifyContent: 'center' },
  undoText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, paddingVertical: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  date: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  entries: { flexGrow: 1, flexShrink: 1, flexBasis: 300, gap: 4 },
  entry: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, columnGap: 12, alignItems: 'baseline' },
  cell: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  mono: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.ink },
  monoMuted: { fontFamily: fonts.mono, color: colors.muted },
  note: { fontFamily: fonts.semibold, fontSize: 14 },
});
