// src/hooks/useTutorialList.ts
import { useEffect, useState } from 'react';
import { fetchTutorials } from '../api/learning'; // Changed import name
import { Tutorial } from '../types';

export function useTutorialList() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchTutorials() // Changed function call
      .then(data => {
        // Ensure the data received is an array before setting state
        if (Array.isArray(data)) {
          setTutorials(data);
        } else {
          // Handle cases where the API might return unexpected data
          console.error("fetchTutorials did not return an array:", data);
          setError('Failed to load tutorials: Invalid data format');
          setTutorials([]); // Set to empty array to prevent map error in consuming components
        }
      })
      .catch((err) => setError(err.message || 'Failed to load tutorials'))
      .finally(() => setLoading(false));
  }, []);

  return { tutorials, loading, error };
}
