import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/store/useStore';
import axios from 'axios';

export function useApiStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const apiUrl = useSettingsStore((state) => state.apiUrl);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Extract base URL from API URL (remove /api suffix if present)
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      const healthUrl = `${baseUrl}/health`;
      
      const response = await axios.get(healthUrl, { timeout: 5000 });
      setIsConnected(response.status === 200);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    // Check connection on mount and when API URL changes
    checkConnection();

    // Check periodically every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isConnected, isChecking, checkConnection };
}
