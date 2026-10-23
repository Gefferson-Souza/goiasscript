'use client';
import { useEffect, useState } from 'react';
import { browserStorage } from '../browser-storage.ts';
import { readProgress } from './progress.ts';

// Lê só depois de montar: o servidor não conhece o armazenamento do aluno e o HTML precisa bater na hidratação.
export function useCompletedLessons(): readonly string[] {
  const [completed, setCompleted] = useState<readonly string[]>([]);
  useEffect(() => {
    setCompleted(readProgress(browserStorage()).completed);
  }, []);
  return completed;
}
