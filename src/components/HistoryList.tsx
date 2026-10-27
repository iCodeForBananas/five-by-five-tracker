import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmtDate, fmtW, LIFTS, type Session } from '@/lib/program';
import { useLayout } from '@/hooks/useLayout';
import { colors, fonts } from '@/theme';

type Props = { sessions: Session[]; onUndo: () => void };

export function HistoryList({ sessions, onUndo }: Props) {
  const recent = sessions.slice().reverse().slice(0, 30);
  const { compact, cardPad, type } = useLayout();
  return (
    <View style={[s.card, { padding: cardPad }]} accessibilityLabel="History">
      <View style={s.head}>
        <Text style={[s.title, { fontSize: type(28) }]}>History</Text>
        {sessions.length > 0 && (
          <Pressable onPress={onUndo} style={s.undo} accessibilityRole="button">
            <Text style={s.undoText}>Undo last session</Text>
          </Pressable>
        )}
      </View>
      {sessions.length === 0 && <Text style={s.empty}>Finished sessions show up here.</Text>}
      {recent.map((ss) => (
        <View key={ss.id} style={compact ? s.rowStacked : s.row}>
          <View style={compact ? s.when : s.whenFixed}>
            <Text style={s.date}>{fmtDate(ss.date)}</Text>
            <Text style={s.muted}>Workout {ss.type}</Text>
          </View>
          <View style={s.entries}>
            {ss.entries.map((e) => (
              <View key={e.k} style={s.entry}>
                <View style={s.entryLine}>
                  <Text style={[s.cell, s.liftName]} numberOfLines={1}>
                    {LIFTS[e.k].name}
                  </Text>
                  <Text style={[s.mono, s.weightCol]}>{fmtW(e.w)} lb</Text>
                  <Text style={[s.mono, s.monoMuted, s.repsCol]}>{e.reps.join('/')}</Text>
                </View>
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
  card: { backgroundColor: colors.card, borderRadius: 16 },
  head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
  title: { fontFamily: fonts.black, letterSpacing: -0.3, color: colors.ink },
  undo: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.lineStrong, justifyContent: 'center' },
  undoText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, paddingVertical: 12 },
  row: { flexDirection: 'row', gap: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  rowStacked: { gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  whenFixed: { width: 120 },
  when: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  date: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  entries: { flex: 1, minWidth: 0, gap: 8 },
  entry: { gap: 2 },
  entryLine: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  liftName: { flex: 1, minWidth: 0 },
  weightCol: { flexShrink: 0 },
  repsCol: { flexShrink: 0, minWidth: 76, textAlign: 'right' },
  cell: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  mono: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.ink },
  monoMuted: { fontFamily: fonts.mono, color: colors.muted },
  note: { fontFamily: fonts.semibold, fontSize: 14 },
});
