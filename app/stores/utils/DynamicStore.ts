export class DynamicStorage {
  private broadcastChannel: BroadcastChannel | null = null;
  private isInitialized = false;
  private storeReloaders: Map<string, () => void> = new Map();

  constructor() {
    // Initialize BroadcastChannel for cross-tab communication
    this.initializeBroadcastChannel();
  }

  private initializeBroadcastChannel(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel('hotstuff-storage');

      // Listen for messages from other tabs
      this.broadcastChannel.onmessage = (event) => {
        const { type, key, value } = event.data;

        if (type === 'STORAGE_CHANGE') {
          // Update the actual storage
          const storage = this.getCurrentStorage();
          if (storage && value !== null) {
            storage.setItem(key, value);
          } else if (storage) {
            storage.removeItem(key);
          }

          // Trigger store reload callback if registered
          const reloader = this.storeReloaders.get(key);
          if (reloader) {
            reloader();
          }

          // Also dispatch storage event for Zustand to catch
          window.dispatchEvent(
            new StorageEvent('storage', {
              key,
              newValue: value,
              storageArea: storage || localStorage,
            }),
          );
        }
      };

      this.isInitialized = true;
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error);
    }
  }

  private getCurrentStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const globalSettings = localStorage.getItem('hotstuff-global-settings');
      if (globalSettings) {
        const parsed = JSON.parse(globalSettings);
        return parsed.state?.persistTradingConnection ? localStorage : sessionStorage;
      }
    } catch (e) {
      console.error('Error getting current storage:', e);
    }
    return localStorage;
  }

  /**
   * Register a store reload callback for a specific key
   * Called when cross-tab updates are received
   */
  registerStoreReloader(key: string, reloader: () => void): void {
    this.storeReloaders.set(key, reloader);
  }

  /**
   * Unregister a store reload callback
   */
  unregisterStoreReloader(key: string): void {
    this.storeReloaders.delete(key);
  }

  getItem(key: string): string | null {
    const storage = this.getCurrentStorage();
    return storage ? storage.getItem(key) : null;
  }

  setItem(key: string, value: string): void {
    const storage = this.getCurrentStorage();
    if (storage) {
      storage.setItem(key, value);

      // Broadcast change to other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'STORAGE_CHANGE',
          key,
          value,
          timestamp: Date.now(),
        });
      }
    }
  }

  removeItem(key: string): void {
    const storage = this.getCurrentStorage();
    if (storage) {
      storage.removeItem(key);

      // Broadcast removal to other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'STORAGE_CHANGE',
          key,
          value: null,
          timestamp: Date.now(),
        });
      }
    }
  }
}

// Export singleton instance
export const dynamicStorage = new DynamicStorage();
