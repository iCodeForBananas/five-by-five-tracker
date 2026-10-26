import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { fresh, hydrate, type TrackerData } from '@/lib/program';

const KEY = 'five-by-five-tracker-v1';

/** Tracker data persisted to AsyncStorage, plus a clock that ticks while the rest timer runs. */
export function useTracker() {
  const [data, setData] = useState<TrackerData>(fresh);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Latest data for commit(); only written alongside setData so it never lags a transition.
  const dataRef = useRef(data);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const d = raw ? hydrate(JSON.parse(raw)) : null;
        if (d) {
          dataRef.current = d;
          setNow(Date.now());
          setData(d);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // commit() already refreshes `now`, so this only needs to keep ticking.
  useEffect(() => {
    if (!data.timerEnd) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [data.timerEnd]);

  /** Apply a state transition and persist the result. */
  const commit = useCallback((fn: (d: TrackerData, now: number) => TrackerData) => {
    const t = Date.now();
    const next = fn(dataRef.current, t);
    dataRef.current = next;
    setNow(t);
    setData(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return { data, loaded, now, commit };
}
