import { useState, useEffect } from 'react';
import { useInfoClient } from './use-info-client';
import { Health } from '@/types/trading';

export function useHealth() {
  const { infoClient } = useInfoClient();
  const [health, setHealth] = useState<Health | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setIsLoading(true);
        const health = (await infoClient.getHealth({})) as Health;
        setHealth(health);
      } catch (error) {
        setError(error as string);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealth();
  }, [infoClient]);

  return {
    health,
    isLoading,
    error,
  };
}
