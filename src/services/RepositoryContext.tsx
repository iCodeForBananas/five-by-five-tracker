import { createContext, useContext, type ReactNode } from 'react';

import type { WorkoutRepository } from './WorkoutRepository';

const RepositoryContext = createContext<WorkoutRepository | null>(null);

export function RepositoryProvider({ repository, children }: { repository: WorkoutRepository; children: ReactNode }) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useWorkoutRepository(): WorkoutRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error('useWorkoutRepository must be used inside <RepositoryProvider>');
  return repo;
}
