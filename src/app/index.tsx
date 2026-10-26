import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryList } from '@/components/HistoryList';
import { ProgramRules } from '@/components/ProgramRules';
import { ProgressChart } from '@/components/ProgressChart';
import { RestTimerOverlay } from '@/components/RestTimerOverlay';
import { WeightTiles } from '@/components/WeightTiles';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useTracker } from '@/hooks/useTracker';
import {
  curReps,
  finish,
  fmtDate,
  fmtW,
  fresh,
  LIFTS,
  mmss,
  nextSet,
  other,
  remaining,
  REST,
  tapSet,
  undo,
  type LiftKey,
} from '@/lib/program';
import { colors, fonts } from '@/theme';

export default function TrackerScreen() {
  const { data, now, commit } = useTracker();
  const [timerBig, setTimerBig] = useState(false);
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= 900;

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
    if (data.timerEnd) {
      commit((d, t) => ({ ...d, timerLeft: remaining(d, t), timerEnd: null }));
      return;
    }
    setTimerBig(true);
    commit((d, t) => {
      let l = remaining(d, t);
      if (l <= 0) l = REST;
      return { ...d, timerEnd: t + l * 1000 };
    });
  };
  const resetTimer = () => {
    setTimerBig(false);
    commit((d) => ({ ...d, timerEnd: null, timerLeft: REST }));
  };
  const addTime = () =>
    commit((d, t) =>
      d.timerEnd ? { ...d, timerEnd: Math.max(d.timerEnd, t) + 30000 } : { ...d, timerLeft: remaining(d, t) + 30 },
    );
  const onTapSet = (k: LiftKey, i: number) => {
    const checking = reps[k][i] == null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    commit((d, t) => tapSet(d, k, i, t));
    if (checking) setTimerBig(true);
  };
  const confirmReset = () =>
    Alert.alert('Reset all data?', 'This erases every logged session and resets all weights. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase everything', style: 'destructive', onPress: () => commit(() => fresh()) },
    ]);

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 48 }]}
        keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.h1}>5×5</Text>
          <Text style={s.headerLine}>
            {n
              ? `${n} session${n > 1 ? 's' : ''} logged · last on ${fmtDate(data.sessions[n - 1].date)}`
              : 'No sessions yet. Start with Workout A.'}
          </Text>
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
              onFinish={() => commit((d) => finish(d))}
              onSwitch={() => commit((d) => ({ ...d, next: other(d.next), reps: {} }))}
            />
          </View>
          <View style={wide ? s.side : undefined}>
            <WeightTiles
              data={data}
              onSetWeight={(k, w) => commit((d) => ({ ...d, lifts: { ...d.lifts, [k]: { ...d.lifts[k], w } } }))}
            />
          </View>
        </View>

        <ProgressChart data={data} onToggle={(k) => commit((d) => ({ ...d, hidden: { ...d.hidden, [k]: !d.hidden[k] } }))} />

        <View style={[s.split, wide && s.splitWide]}>
          <View style={wide ? s.main : undefined}>
            <HistoryList sessions={data.sessions} onUndo={() => commit(undo)} />
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
        onAddTime={addTime}
        onReset={resetTimer}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 24, width: '100%', maxWidth: 1120, alignSelf: 'center' },
  header: { borderBottomWidth: 3, borderBottomColor: colors.ink, paddingBottom: 16, gap: 8 },
  h1: { fontFamily: fonts.black, fontSize: 64, lineHeight: 62, letterSpacing: -1.9, color: colors.ink },
  headerLine: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  split: { gap: 24 },
  splitWide: { flexDirection: 'row', alignItems: 'flex-start' },
  main: { flex: 2, minWidth: 0 },
  side: { flex: 1, minWidth: 0 },
});
