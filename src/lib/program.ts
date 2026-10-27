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
  type: WorkoutType;
  entries: SessionEntry[];
  before: Record<LiftKey, LiftState>;
};

export type TrackerData = {
  lifts: Record<LiftKey, LiftState>;
  next: WorkoutType;
  sessions: Session[];
  reps: Reps;
  hidden: Partial<Record<LiftKey, boolean>>;
  /** Epoch ms when the running rest timer ends, or null when paused/idle. */
  timerEnd: number | null;
  /** Seconds left when paused. */
  timerLeft: number;
};

export const other = (t: WorkoutType): WorkoutType => (t === 'A' ? 'B' : 'A');

export function emptyReps(type: WorkoutType): Reps {
  const r: Reps = {};
  PROGRAM[type].forEach((k) => {
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
    reps: emptyReps('A'),
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

/** The in-progress reps for the next workout, rebuilt if stored reps don't match its lifts. */
export function curReps(d: TrackerData): Record<LiftKey, (number | null)[]> {
  const ks = PROGRAM[d.next];
  const ok = d.reps && ks.every((k) => Array.isArray(d.reps[k]));
  return (ok ? d.reps : emptyReps(d.next)) as Record<LiftKey, (number | null)[]>;
}

export function nextSet(d: TrackerData): { k: LiftKey; i: number } | null {
  const reps = curReps(d);
  for (const k of PROGRAM[d.next]) {
    const i = reps[k].findIndex((v) => v == null);
    if (i >= 0) return { k, i };
  }
  return null;
}

export function remaining(d: TrackerData, now: number): number {
  if (d.timerEnd) return Math.max(0, Math.ceil((d.timerEnd - now) / 1000));
  return typeof d.timerLeft === 'number' ? d.timerLeft : REST;
}

/** Toggle a set; checking one off also (re)starts the rest timer. */
export function tapSet(d: TrackerData, k: LiftKey, i: number, now: number): TrackerData {
  const reps = clone(curReps(d));
  const nv = reps[k][i] == null ? 5 : null;
  reps[k][i] = nv;
  return { ...d, reps, ...(nv != null ? { timerEnd: now + REST * 1000 } : null) };
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

export function addTime(d: TrackerData, now: number): TrackerData {
  return d.timerEnd
    ? { ...d, timerEnd: Math.max(d.timerEnd, now) + 30000 }
    : { ...d, timerLeft: remaining(d, now) + 30 };
}

/** Log the current workout, apply progression / deload, and advance to the other workout. */
export function finish(d: TrackerData, id: string, now: Date = new Date()): TrackerData {
  const type = d.next;
  const reps = curReps(d);
  const before = clone(d.lifts);
  const lifts = clone(d.lifts);
  const entries: SessionEntry[] = PROGRAM[type].map((k) => {
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
  const nxt = other(type);
  return {
    ...d,
    lifts,
    sessions: d.sessions.concat([{ id, date: now.toISOString(), type, entries, before }]),
    next: nxt,
    reps: emptyReps(nxt),
    timerEnd: null,
    timerLeft: REST,
  };
}

export function undo(d: TrackerData): TrackerData {
  const last = d.sessions[d.sessions.length - 1];
  if (!last) return d;
  return { ...d, lifts: last.before, next: last.type, sessions: d.sessions.slice(0, -1), reps: emptyReps(last.type) };
}
