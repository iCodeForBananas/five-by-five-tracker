import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TrackerData } from '@/lib/program';
import { emptyStored, fromStored, migrate, SCHEMA_VERSION, type StoredData } from './schema';
import type { Preferences, ProgramState, TimerState, WorkoutRepository } from './WorkoutRepository';

const KEY = 'five-by-five-tracker';
/** Key used by schema v1 (the original prototype format). */
const LEGACY_KEY = 'five-by-five-tracker-v1';

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

/** On-device implementation: one versioned JSON document in AsyncStorage. */
export class AsyncStorageWorkoutRepository implements WorkoutRepository {
  private doc: Promise<StoredData> | null = null;
  /** Serialises writes so read-modify-write updates never interleave. */
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: Storage = AsyncStorage) {}

  async load(): Promise<TrackerData> {
    this.doc = this.read();
    return fromStored(await this.doc);
  }

  saveProgram(program: ProgramState) {
    return this.update((d) => ({ ...d, program }));
  }

  saveDraft(reps: TrackerData['reps']) {
    return this.update((d) => ({ ...d, draft: { reps } }));
  }

  savePreferences(preferences: Preferences) {
    return this.update((d) => ({ ...d, preferences }));
  }

  saveTimer(timer: TimerState) {
    return this.update((d) => ({ ...d, timer }));
  }

  recordSession(session: TrackerData['sessions'][number], program: ProgramState) {
    return this.update((d) => ({
      ...d,
      program,
      sessions: [...d.sessions.filter((s) => s.id !== session.id), session],
    }));
  }

  removeSession(sessionId: string, program: ProgramState) {
    return this.update((d) => ({ ...d, program, sessions: d.sessions.filter((s) => s.id !== sessionId) }));
  }

  clear() {
    return this.update(() => emptyStored());
  }

  private async read(): Promise<StoredData> {
    const raw = (await this.storage.getItem(KEY)) ?? (await this.storage.getItem(LEGACY_KEY));
    if (!raw) return emptyStored();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return emptyStored();
    }
    // Throws UnsupportedSchemaError for data from a newer build; load() rejects and nothing is written.
    const doc = migrate(parsed) ?? emptyStored();
    const fromOlder = (parsed as { schemaVersion?: number }).schemaVersion !== SCHEMA_VERSION;
    if (fromOlder) {
      await this.storage.setItem(KEY, JSON.stringify(doc));
      await this.storage.removeItem(LEGACY_KEY);
    }
    return doc;
  }

  private update(fn: (doc: StoredData) => StoredData): Promise<void> {
    const run = async () => {
      if (!this.doc) this.doc = this.read();
      const next: StoredData = { ...fn(await this.doc), schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() };
      this.doc = Promise.resolve(next);
      await this.storage.setItem(KEY, JSON.stringify(next));
    };
    const p = this.queue.then(run);
    this.queue = p.catch(() => {});
    return p;
  }
}
