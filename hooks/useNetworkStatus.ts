import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Sync initial state immediately
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected !== false);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
