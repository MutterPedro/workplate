import React, { createContext, useContext } from "react";
import type { TaskRepository } from "./task-repository";
import { TauriTaskRepository } from "./task-repository";

const RepositoryContext = createContext<TaskRepository>(new TauriTaskRepository());

export function RepositoryProvider({
  repository,
  children,
}: {
  repository: TaskRepository;
  children: React.ReactNode;
}) {
  return (
    <RepositoryContext.Provider value={repository}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository(): TaskRepository {
  return useContext(RepositoryContext);
}
