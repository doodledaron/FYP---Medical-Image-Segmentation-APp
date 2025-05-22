// src/hooks/useTutorialList.ts
import { useEffect, useState } from 'react';
import { fetchTutorials } from '../api/learning';
import { Tutorial } from '../types';

export function useTutorialList(refreshTrigger?: any) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchTutorials()
      .then(data => {
        // Ensure the data received is an array before setting state
        if (Array.isArray(data)) {
          setTutorials(data);
        } else {
          console.error("fetchTutorials did not return an array:", data);
          setError('Failed to load tutorials: Invalid data format');
          setTutorials([]);
        }
      })
      .catch((err) => setError(err.message || 'Failed to load tutorials'))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  return { tutorials, loading, error };
}
