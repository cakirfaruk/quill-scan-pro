import { useState, useEffect } from 'react';

export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export interface NetworkInfo {
  effectiveType: ConnectionType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  isSlowConnection: boolean;
  shouldPreload: boolean;
}

/**
 * Network Information API hook
 * Monitors network conditions and provides recommendations for preloading
 */
export function useNetworkInfo(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    isSlowConnection: false,
    shouldPreload: true,
  });

  useEffect(() => {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (!connection) {
      console.log('📡 Network Information API not available - assuming fast connection');
      return;
    }

    const updateNetworkInfo = () => {
      const effectiveType = connection.effectiveType || '4g';
      const downlink = connection.downlink || 10;
      const rtt = connection.rtt || 50;
      const saveData = connection.saveData || false;
      
      // Determine if connection is slow
      const isSlowConnection = 
        effectiveType === 'slow-2g' || 
        effectiveType === '2g' || 
        effectiveType === '3g' ||
        saveData ||
        downlink < 1.5; // Less than 1.5 Mbps

      // Should we preload? Only on fast connections
      const shouldPreload = !isSlowConnection;

      const newInfo: NetworkInfo = {
        effectiveType,
        downlink,
        rtt,
        saveData,
        isSlowConnection,
        shouldPreload,
      };

      setNetworkInfo(newInfo);

      // Log network changes
      console.log('📡 Network status:', {
        type: effectiveType,
        speed: `${downlink} Mbps`,
        latency: `${rtt}ms`,
        saveData,
        preload: shouldPreload ? '✅ Enabled' : '❌ Disabled (slow connection)'
      });
    };

    // Initial check
    updateNetworkInfo();

    // Listen for network changes
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return networkInfo;
}

/**
 * Simple hook to check if preloading should be enabled
 */
export function useShouldPreload(): boolean {
  const { shouldPreload } = useNetworkInfo();
  return shouldPreload;
}
