import { randomUUID } from 'expo-crypto';
import { useEffect, useMemo, useRef, useState } from 'react';

import * as P from '@/lib/program';
import { useWorkoutRepository, type WorkoutRepository } from '@/services';

const program = (d: P.TrackerData) => ({ lifts: d.lifts, next: d.next });
const timer = (d: P.TrackerData) => ({ timerEnd: d.timerEnd, timerLeft: d.timerLeft });

/**
 * App state plus intent-level actions. Each action applies a pure transition from lib/program
 * and persists exactly the slices it changed through the WorkoutRepository.
 */
export function useTracker() {
  const repo = useWorkoutRepository();
  const [data, setData] = useState<P.TrackerData>(P.fresh);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Latest data for actions; only written alongside setData so it never lags a transition.
  const dataRef = useRef(data);

  useEffect(() => {
    let live = true;
    repo
      .load()
      .then((d) => {
        if (!live) return;
        dataRef.current = d;
        setNow(Date.now());
        setData(d);
      })
      .catch((e: Error) => {
        console.warn('Failed to load workout data', e);
        if (live) setLoadError(e);
      })
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [repo]);

  // Actions refresh `now` themselves, so this only needs to keep ticking.
  useEffect(() => {
    if (!data.timerEnd) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [data.timerEnd]);

  const actions = useMemo(() => {
    /** Apply a transition, then run its persistence calls against the repository. */
    const apply = (
      fn: (d: P.TrackerData, now: number) => P.TrackerData,
      persist: (r: WorkoutRepository, next: P.TrackerData, prev: P.TrackerData) => Promise<unknown>[],
    ) => {
      const t = Date.now();
      const prev = dataRef.current;
      const next = fn(prev, t);
      dataRef.current = next;
      setNow(t);
      setData(next);
      Promise.all(persist(repo, next, prev)).catch((e) => console.warn('Failed to save workout data', e));
    };

    return {
      tapSet: (k: P.LiftKey, i: number) =>
        apply(
          (d) => P.tapSet(d, k, i),
          (r, n) => [r.saveDraft(n.reps)],
        ),
      finish: () =>
        apply(
          (d) => P.finish(d, randomUUID()),
          (r, n) => [r.recordSession(n.sessions[n.sessions.length - 1], program(n)), r.saveDraft(n.reps), r.saveTimer(timer(n))],
        ),
      undo: () =>
        apply(P.undo, (r, n, p) => {
          const last = p.sessions[p.sessions.length - 1];
          return last ? [r.removeSession(last.id, program(n)), r.saveDraft(n.reps)] : [];
        }),
      switchWorkout: () =>
        apply(
          (d) => ({ ...d, next: P.other(d.next), reps: P.emptyReps(P.other(d.next)) }),
          (r, n) => [r.saveProgram(program(n)), r.saveDraft(n.reps)],
        ),
      setWeight: (k: P.LiftKey, w: number) =>
        apply(
          (d) => ({ ...d, lifts: { ...d.lifts, [k]: { ...d.lifts[k], w } } }),
          (r, n) => [r.saveProgram(program(n))],
        ),
      toggleLift: (k: P.LiftKey) =>
        apply(
          (d) => ({ ...d, hidden: { ...d.hidden, [k]: !d.hidden[k] } }),
          (r, n) => [r.savePreferences({ hidden: n.hidden })],
        ),
      toggleTimer: () => apply(P.toggleTimer, (r, n) => [r.saveTimer(timer(n))]),
      resetTimer: () => apply(P.resetTimer, (r, n) => [r.saveTimer(timer(n))]),
      addTime: () => apply(P.addTime, (r, n) => [r.saveTimer(timer(n))]),
      reset: () => apply(() => P.fresh(), (r) => [r.clear()]),
    };
  }, [repo]);

  return { data, loaded, loadError, now, actions };
}
