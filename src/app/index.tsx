import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryList } from '@/components/HistoryList';
import { ProgramRules } from '@/components/ProgramRules';
import { ProgressChart } from '@/components/ProgressChart';
import { RestTimerOverlay } from '@/components/RestTimerOverlay';
import { WeightTiles } from '@/components/WeightTiles';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useLayout } from '@/hooks/useLayout';
import { useTracker } from '@/hooks/useTracker';
import { curReps, fmtDate, fmtW, LIFTS, mmss, nextSet, other, remaining, REST, type LiftKey } from '@/lib/program';
import { colors, fonts } from '@/theme';

export default function TrackerScreen() {
  const { data, now, loadError, actions } = useTracker();
  const [timerBig, setTimerBig] = useState(false);
  const insets = useSafeAreaInsets();
  const { wide, gutter, type } = useLayout();

  const n = data.sessions.length;
  const left = remaining(data, now);
  const running = !!data.timerEnd;
  const ready = left <= 0;
  const reps = curReps(data);
  const ns = nextSet(data);

  // Buzz once when a running rest period hits zero.
  const wasReady = useRef(ready);
  useEffect(() => {
    if (ready && !wasReady.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasReady.current = ready;
  }, [ready]);

  const toggleTimer = () => {
    if (!data.timerEnd) setTimerBig(true);
    actions.toggleTimer();
  };
  const resetTimer = () => {
    setTimerBig(false);
    actions.resetTimer();
  };
  const onTapSet = (k: LiftKey, i: number) => {
    const checking = reps[k][i] == null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    actions.tapSet(k, i);
    if (checking) setTimerBig(true);
  };
  const confirmReset = () =>
    Alert.alert('Reset all data?', 'This erases every logged session and resets all weights. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase everything', style: 'destructive', onPress: actions.reset },
    ]);

  return (
    // Insets pad the outer view (not the scroll content) so nothing scrolls under the status or navigation bar.
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingHorizontal: gutter, paddingTop: 24, paddingBottom: 48 }]}
        keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={[s.h1, { fontSize: type(64), lineHeight: type(62) }]}>5×5</Text>
          <Text style={s.headerLine}>
            {n
              ? `${n} session${n > 1 ? 's' : ''} logged · last on ${fmtDate(data.sessions[n - 1].date)}`
              : 'No sessions yet. Start with Workout A.'}
          </Text>
          {loadError && (
            <Text style={s.error}>
              {`Couldn't load your saved data, so changes won't be saved. ${loadError.message}`}
            </Text>
          )}
        </View>

        <View style={[s.split, wide && s.splitWide]}>
          <View style={wide ? s.main : undefined}>
            <WorkoutCard
              data={data}
              reps={reps}
              other={other(data.next)}
              rest={{
                bg: ready ? colors.go : colors.dark,
                label: ready ? 'GO · NEXT SET' : running ? 'RESTING' : 'REST TIMER',
                time: mmss(left),
                action: running ? 'Open' : ready || left === REST ? 'Start' : 'Resume',
              }}
              onTapSet={onTapSet}
              onTimerPress={() => (data.timerEnd ? setTimerBig(true) : toggleTimer())}
              onTimerReset={resetTimer}
              onFinish={actions.finish}
              onSwitch={actions.switchWorkout}
            />
          </View>
          <View style={wide ? s.side : undefined}>
            <WeightTiles data={data} onSetWeight={actions.setWeight} />
          </View>
        </View>

        <ProgressChart data={data} onToggle={actions.toggleLift} />

        <View style={[s.split, wide && s.splitWide]}>
          <View style={wide ? s.main : undefined}>
            <HistoryList sessions={data.sessions} onUndo={actions.undo} />
          </View>
          <View style={wide ? s.side : undefined}>
            <ProgramRules onReset={confirmReset} />
          </View>
        </View>
      </ScrollView>

      <RestTimerOverlay
        visible={timerBig}
        bg={ready ? colors.go : colors.dark}
        label={ready ? 'GO' : running ? 'REST' : 'PAUSED'}
        time={mmss(left)}
        upNext={ns ? `Next: ${LIFTS[ns.k].name} set ${ns.i + 1} · ${fmtW(data.lifts[ns.k].w)} lb` : 'All sets done. Finish the workout.'}
        hasNextSet={!!ns}
        action={running ? 'Pause' : ready ? 'Restart' : 'Resume'}
        onHide={() => setTimerBig(false)}
        onSetDone={() => ns && onTapSet(ns.k, ns.i)}
        onToggle={toggleTimer}
        onAddTime={actions.addTime}
        onReset={resetTimer}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: 24, width: '100%', maxWidth: 1120, alignSelf: 'center' },
  header: { borderBottomWidth: 3, borderBottomColor: colors.ink, paddingBottom: 16, gap: 8 },
  h1: { fontFamily: fonts.black, letterSpacing: -1.9, color: colors.ink },
  headerLine: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  split: { gap: 24 },
  splitWide: { flexDirection: 'row', alignItems: 'flex-start' },
  main: { flex: 3, minWidth: 0 },
  side: { flex: 2, minWidth: 0 },
});
