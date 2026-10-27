// Versioned, JSON-serialisable storage format plus migrations from older versions.
// Bump SCHEMA_VERSION and add a step to MIGRATIONS whenever the stored shape changes.

import { fresh, KEYS, REST, type Reps, type Session, type TrackerData } from '@/lib/program';
import type { Preferences, ProgramState, TimerState } from './WorkoutRepository';

export const SCHEMA_VERSION = 2 as const;

export type StoredData = {
  schemaVersion: typeof SCHEMA_VERSION;
  /** ISO timestamp of the last write; useful for future sync conflict checks. */
  updatedAt: string;
  program: ProgramState;
  sessions: Session[];
  draft: { reps: Reps };
  preferences: Preferences;
  timer: TimerState;
};

export class UnsupportedSchemaError extends Error {
  constructor(public readonly version: number) {
    super(`Stored data uses schema v${version}, newer than this app supports (v${SCHEMA_VERSION}).`);
  }
}

export function toStored(d: TrackerData, updatedAt = new Date().toISOString()): StoredData {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt,
    program: { lifts: d.lifts, next: d.next },
    sessions: d.sessions,
    draft: { reps: d.reps },
    preferences: { hidden: d.hidden },
    timer: { timerEnd: d.timerEnd, timerLeft: d.timerLeft },
  };
}

export function fromStored(s: StoredData): TrackerData {
  return {
    lifts: s.program.lifts,
    next: s.program.next,
    sessions: s.sessions,
    reps: s.draft.reps,
    hidden: s.preferences.hidden,
    timerEnd: s.timer.timerEnd,
    timerLeft: s.timer.timerLeft,
  };
}

export const emptyStored = (): StoredData => toStored(fresh());

type AnyDoc = Record<string, any>;

/** Each entry upgrades a document from version `key` to `key + 1`. */
const MIGRATIONS: Record<number, (doc: AnyDoc) => AnyDoc> = {
  // v1: the original flat prototype format (no schemaVersion field, sessions without ids).
  1: (d) => ({
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    program: { lifts: d.lifts, next: d.next },
    sessions: (Array.isArray(d.sessions) ? d.sessions : []).map((s: AnyDoc, i: number) => ({
      ...s,
      id: s.id ?? `legacy-${i}-${s.date}`,
    })),
    draft: { reps: d.reps ?? {} },
    preferences: { hidden: d.hidden ?? {} },
    timer: { timerEnd: d.timerEnd ?? null, timerLeft: d.timerLeft ?? REST },
  }),
};

/**
 * Upgrade any stored document to the current schema and fill missing fields with defaults.
 * Returns null for unrecognisable data; throws UnsupportedSchemaError for a newer schema
 * (so an older app build never overwrites data written by a newer one).
 */
export function migrate(raw: unknown): StoredData | null {
  if (!raw || typeof raw !== 'object') return null;
  let doc = raw as AnyDoc;
  let version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 1;
  if (version > SCHEMA_VERSION) throw new UnsupportedSchemaError(version);
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    doc = step(doc);
    version = doc.schemaVersion;
  }
  return normalize(doc);
}

function normalize(doc: AnyDoc): StoredData | null {
  const base = emptyStored();
  const program = doc.program ?? {};
  if (!program.lifts || (program.next !== 'A' && program.next !== 'B')) return null;
  const lifts = { ...base.program.lifts };
  for (const k of KEYS) if (program.lifts[k]) lifts[k] = { ...lifts[k], ...program.lifts[k] };
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : base.updatedAt,
    program: { lifts, next: program.next },
    sessions: Array.isArray(doc.sessions) ? doc.sessions : [],
    draft: { reps: doc.draft?.reps ?? {} },
    preferences: { hidden: doc.preferences?.hidden ?? {} },
    timer: {
      timerEnd: typeof doc.timer?.timerEnd === 'number' ? doc.timer.timerEnd : null,
      timerLeft: typeof doc.timer?.timerLeft === 'number' ? doc.timer.timerLeft : REST,
    },
  };
}
