import type { LiftKey, LiftState, Reps, Session, TrackerData, WorkoutType } from '@/lib/program';

/** Working weights, miss streaks, and which workout is next. Synced data. */
export type ProgramState = { lifts: Record<LiftKey, LiftState>; next: WorkoutType };

/** Display preferences (lifts hidden on the chart). */
export type Preferences = { hidden: Partial<Record<LiftKey, boolean>> };

/** Rest timer state. Device-local by nature; a remote backend may keep it local only. */
export type TimerState = { timerEnd: number | null; timerLeft: number };

/**
 * Every read and write the app makes against persisted workout data.
 *
 * The UI never talks to storage directly: it calls useTracker() actions, which call this
 * interface. To move to a backend (e.g. Supabase), add another implementation and return it
 * from createWorkoutRepository() in ./index.ts. Methods are async-only so network-backed
 * implementations fit the same shape; writes resolve once the change is durably stored.
 */
export interface WorkoutRepository {
  /** Load the full app state, migrating older stored formats if needed. */
  load(): Promise<TrackerData>;

  saveProgram(program: ProgramState): Promise<void>;

  /** Persist the in-progress (unfinished) workout's reps. */
  saveDraft(reps: Reps): Promise<void>;

  savePreferences(prefs: Preferences): Promise<void>;

  saveTimer(timer: TimerState): Promise<void>;

  /** Record a finished session together with the resulting program state, atomically. */
  recordSession(session: Session, program: ProgramState): Promise<void>;

  /** Delete a session (undo) and restore the program state, atomically. */
  removeSession(sessionId: string, program: ProgramState): Promise<void>;

  /** Erase all data. */
  clear(): Promise<void>;
}
