import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryList } from '@/components/HistoryList';
import { ProgressChart } from '@/components/ProgressChart';
import { RestTimerBar } from '@/components/RestTimerBar';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useLayout } from '@/hooks/useLayout';
import { useTracker } from '@/hooks/useTracker';
import { curReps, fmtDate, remaining, type LiftKey } from '@/lib/program';
import { colors, fonts } from '@/theme';

export default function TrackerScreen() {
  const { data, now, loadError, actions } = useTracker();
  const insets = useSafeAreaInsets();
  const { gutter, type } = useLayout();

  const n = data.sessions.length;
  const left = remaining(data, now);
  const running = !!data.timerEnd;
  const ready = running && left <= 0;
  const reps = curReps(data);

  // Buzz once when a running rest period hits zero.
  const wasReady = useRef(ready);
  useEffect(() => {
    if (ready && !wasReady.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasReady.current = ready;
  }, [ready]);

  // Only counts the set; the rest timer is started from its own button.
  const onCount = (k: LiftKey, delta: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    actions.countSet(k, delta);
  };
  const confirmReset = () =>
    Alert.alert('Reset all data?', 'This erases every logged session and resets all weights. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase everything', style: 'destructive', onPress: actions.reset },
    ]);

  return (
    // Insets pad the outer view (not the scroll content) so nothing scrolls under the status or navigation bar.
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={[s.timerWrap, { paddingHorizontal: gutter }]}>
        <View style={s.timerInner}>
          <RestTimerBar left={left} running={running} onToggle={actions.toggleTimer} onReset={actions.resetTimer} />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[s.content, { paddingHorizontal: gutter, paddingTop: 24, paddingBottom: 48 }]}
        keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={[s.h1, { fontSize: type(64), lineHeight: type(62) }]}>5×5</Text>
          <Text style={s.headerLine}>
            {n
              ? `${n} session${n > 1 ? 's' : ''} logged · last on ${fmtDate(data.sessions[n - 1].date)}`
              : 'No sessions yet. Tap a lift after each set.'}
          </Text>
          {loadError && (
            <Text style={s.error}>
              {`Couldn't load your saved data, so changes won't be saved. ${loadError.message}`}
            </Text>
          )}
        </View>

        <WorkoutCard data={data} reps={reps} now={now} onCount={onCount} onSetWeight={actions.setWeight} onFinish={actions.finish} />

        <ProgressChart data={data} onToggle={actions.toggleLift} />

        <HistoryList sessions={data.sessions} onUndo={actions.undo} onReset={confirmReset} />
      </ScrollView>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  timerWrap: { paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.bg },
  timerInner: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  content: { gap: 24, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { borderBottomWidth: 3, borderBottomColor: colors.ink, paddingBottom: 16, gap: 8 },
  h1: { fontFamily: fonts.black, letterSpacing: -1.9, color: colors.ink },
  headerLine: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
});
