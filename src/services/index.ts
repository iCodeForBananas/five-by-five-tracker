import { AsyncStorageWorkoutRepository } from './AsyncStorageWorkoutRepository';
import type { WorkoutRepository } from './WorkoutRepository';

export type { Preferences, ProgramState, TimerState, WorkoutRepository } from './WorkoutRepository';
export { RepositoryProvider, useWorkoutRepository } from './RepositoryContext';

/** The single place that picks the storage backend. Swap the implementation here. */
export function createWorkoutRepository(): WorkoutRepository {
  return new AsyncStorageWorkoutRepository();
}
