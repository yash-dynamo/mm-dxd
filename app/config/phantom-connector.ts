import { injected } from 'wagmi/connectors';

/**
 * Custom Phantom connector for wagmi v2
 * Since phantom-wagmi-connector is not compatible with wagmi v2,
 * we use wagmi v2's injected connector with a custom target
 * that matches the logic from the original phantom-wagmi-connector package
 */
export function phantom() {
  return injected({
    target() {
      function getReady(ethereum?: any) {
        const isPhantom = !!ethereum?.isPhantom;
        if (!isPhantom) return undefined;
        return ethereum;
      }

      if (typeof window === 'undefined') return undefined;

      const phantom = (window as any).phantom;
      const ethereum = phantom?.ethereum;

      if (!ethereum) return undefined;

      // Handle provider arrays (multi-injected scenario)
      if (ethereum.providers) {
        return ethereum.providers.find(getReady);
      }

      return getReady(ethereum);
    },
    shimDisconnect: true,
  });
}
