// Program rules and pure state transitions for the 5×5 tracker.
// Ported from the original HTML prototype; keep behaviour in sync with README "Program rules".

export type LiftKey = 'squat' | 'bench' | 'row' | 'ohp' | 'deadlift';
export type WorkoutType = 'A' | 'B';

export const KEYS: LiftKey[] = ['squat', 'bench', 'row', 'ohp', 'deadlift'];

export const LIFTS: Record<LiftKey, { name: string; sets: number; inc: number; color: string }> = {
  squat: { name: 'Squat', sets: 5, inc: 5, color: '#1F5FBF' },
  bench: { name: 'Bench Press', sets: 5, inc: 5, color: '#D9480F' },
  row: { name: 'Barbell Row', sets: 5, inc: 5, color: '#0B7A5E' },
  ohp: { name: 'Overhead Press', sets: 5, inc: 5, color: '#8A4FD0' },
  deadlift: { name: 'Deadlift', sets: 1, inc: 10, color: '#2B2D31' },
};

export const PROGRAM: Record<WorkoutType, LiftKey[]> = {
  A: ['squat', 'bench', 'row'],
  B: ['squat', 'ohp', 'deadlift'],
};

export const REST = 120;
const PLATES = [45, 35, 25, 10, 5, 2.5];
const BAR = 45;

export type LiftState = { w: number; fails: number };
/** Reps per set; null = not yet done. */
export type Reps = Partial<Record<LiftKey, (number | null)[]>>;

export type SessionEntry = { k: LiftKey; w: number; reps: number[]; ok: boolean; note: string };
export type Session = {
  /** Stable unique id (UUID) so sessions can be synced/deduplicated across devices. */
  id: string;
  date: string;
  /** Only on sessions logged when the app enforced Workout A/B; newer sessions log any mix of lifts. */
  type?: WorkoutType;
  entries: SessionEntry[];
  before: Record<LiftKey, LiftState>;
};

export type TrackerData = {
  lifts: Record<LiftKey, LiftState>;
  /** Legacy A/B pointer. Still stored for compatibility; the UI no longer uses it. */
  next: WorkoutType;
  sessions: Session[];
  reps: Reps;
  hidden: Partial<Record<LiftKey, boolean>>;
  /** Epoch ms when the running rest timer ends, or null when paused/idle. */
  timerEnd: number | null;
  /** Seconds left when paused. */
  timerLeft: number;
};

export function emptyReps(): Reps {
  const r: Reps = {};
  KEYS.forEach((k) => {
    r[k] = Array.from({ length: LIFTS[k].sets }, () => null);
  });
  return r;
}

export function fresh(): TrackerData {
  return {
    lifts: {
      squat: { w: 45, fails: 0 },
      bench: { w: 45, fails: 0 },
      row: { w: 65, fails: 0 },
      ohp: { w: 45, fails: 0 },
      deadlift: { w: 95, fails: 0 },
    },
    next: 'A',
    sessions: [],
    reps: emptyReps(),
    hidden: {},
    timerEnd: null,
    timerLeft: REST,
  };
}

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function fmtW(w: unknown): string {
  const n = num(w);
  return n % 1 ? n.toFixed(1) : String(n);
}

export function plates(w: number): string {
  let side = (num(w) - BAR) / 2;
  if (side <= 0) return 'Empty bar';
  const out: number[] = [];
  for (const p of PLATES) {
    while (side >= p - 1e-9) {
      out.push(p);
      side -= p;
    }
  }
  return out.join(' + ') + ' per side';
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

/** In-progress reps for every lift. Lifts missing from the stored draft (e.g. an old A/B draft) start empty. */
export function curReps(d: TrackerData): Record<LiftKey, (number | null)[]> {
  const out = {} as Record<LiftKey, (number | null)[]>;
  for (const k of KEYS) {
    const r = d.reps?.[k];
    out[k] = Array.isArray(r) && r.length === LIFTS[k].sets ? r : Array.from({ length: LIFTS[k].sets }, () => null);
  }
  return out;
}

/** Sets counted so far for a lift in the current workout. */
export function setCount(reps: (number | null)[]): number {
  return reps.filter((v) => v != null).length;
}

/** The most recent logged entry for a lift, with the date of its session. */
export function lastDone(d: TrackerData, k: LiftKey): (SessionEntry & { date: string }) | null {
  for (let i = d.sessions.length - 1; i >= 0; i--) {
    const e = d.sessions[i].entries.find((x) => x.k === k);
    if (e) return { ...e, date: d.sessions[i].date };
  }
  return null;
}

export function remaining(d: TrackerData, now: number): number {
  if (d.timerEnd) return Math.max(0, Math.ceil((d.timerEnd - now) / 1000));
  return typeof d.timerLeft === 'number' ? d.timerLeft : REST;
}

/** Count one more set done for a lift (+1), or take one back (-1). Clamped to 0..sets. */
export function countSet(d: TrackerData, k: LiftKey, delta: 1 | -1): TrackerData {
  const reps = clone(curReps(d));
  const n = Math.min(LIFTS[k].sets, Math.max(0, setCount(reps[k]) + delta));
  reps[k] = reps[k].map((_, i) => (i < n ? 5 : null));
  return { ...d, reps };
}

/** Pause a running timer, or start/resume a paused one (restarting from REST if it ran out). */
export function toggleTimer(d: TrackerData, now: number): TrackerData {
  if (d.timerEnd) return { ...d, timerLeft: remaining(d, now), timerEnd: null };
  const left = remaining(d, now);
  return { ...d, timerEnd: now + (left <= 0 ? REST : left) * 1000 };
}

export function resetTimer(d: TrackerData): TrackerData {
  return { ...d, timerEnd: null, timerLeft: REST };
}

/**
 * Log whichever lifts have at least one set counted and apply progression / deload to those.
 * Lifts you didn't touch are left alone. No-op when nothing was counted.
 */
export function finish(d: TrackerData, id: string, now: Date = new Date()): TrackerData {
  const reps = curReps(d);
  const done = KEYS.filter((k) => setCount(reps[k]) > 0);
  if (!done.length) return d;
  const before = clone(d.lifts);
  const lifts = clone(d.lifts);
  const entries: SessionEntry[] = done.map((k) => {
    const r = reps[k].map((v) => (v == null ? 0 : v));
    const ok = r.every((v) => v >= 5);
    const w = num(lifts[k].w);
    let note: string;
    if (ok) {
      lifts[k].w = w + LIFTS[k].inc;
      lifts[k].fails = 0;
      note = '+' + LIFTS[k].inc + ' lb next';
    } else {
      lifts[k].fails = (lifts[k].fails || 0) + 1;
      if (lifts[k].fails >= 3) {
        lifts[k].w = Math.max(BAR, Math.floor((w * 0.9) / 5) * 5);
        lifts[k].fails = 0;
        note = 'Deload to ' + fmtW(lifts[k].w);
      } else note = 'Repeat weight';
    }
    return { k, w, reps: r, ok, note };
  });
  return {
    ...d,
    lifts,
    sessions: d.sessions.concat([{ id, date: now.toISOString(), entries, before }]),
    reps: emptyReps(),
    timerEnd: null,
    timerLeft: REST,
  };
}

export function undo(d: TrackerData): TrackerData {
  const last = d.sessions[d.sessions.length - 1];
  if (!last) return d;
  return { ...d, lifts: last.before, sessions: d.sessions.slice(0, -1), reps: emptyReps() };
}
