// IndexedDB wrapper for offline data storage
const DB_NAME = 'offline-data';
const DB_VERSION = 2;
const STORES = {
  messages: 'messages',
  posts: 'posts',
  profiles: 'profiles',
  analyses: 'analyses',
  conversations: 'conversations',
  comments: 'comments',
  'offline-queue': 'offline-queue',
};

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            
            // Add additional indexes for specific stores
            if (storeName === 'posts') {
              store.createIndex('user_id', 'user_id', { unique: false });
            }
            if (storeName === 'messages') {
              store.createIndex('conversation_key', 'conversation_key', { unique: false });
            }
            if (storeName === 'conversations') {
              store.createIndex('user_id', 'user_id', { unique: false });
            }
          }
        });
      };
    });
  }

  async save(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get items older than a certain timestamp
  async getOlderThan(storeName: string, timestamp: number): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(timestamp);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get items by index
  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Save multiple items at once
  async saveMany(storeName: string, items: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      items.forEach(item => {
        store.put({ ...item, timestamp: Date.now() });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Count items in a store
  async count(storeName: string): Promise<number> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cache settings from localStorage
  private getCacheSettings() {
    const defaults = {
      maxSize: 50 * 1024 * 1024, // 50 MB in bytes
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      autoCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours in ms
    };

    try {
      const saved = localStorage.getItem('cache-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          maxSize: (parsed.maxSize || 50) * 1024 * 1024, // Convert MB to bytes
          maxAge: (parsed.maxAge || 7) * 24 * 60 * 60 * 1000, // Convert days to ms
          autoCleanup: parsed.autoCleanup ?? true,
          cleanupInterval: (parsed.cleanupInterval || 24) * 60 * 60 * 1000, // Convert hours to ms
        };
      }
    } catch (error) {
      console.error('Error loading cache settings:', error);
    }

    return defaults;
  }

  // Estimate total cache size
  async estimateSize(): Promise<number> {
    if (!this.db) await this.init();
    
    let totalSize = 0;
    
    for (const storeName of Object.values(STORES)) {
      const items = await this.getAll(storeName);
      // Rough estimate: JSON string length * 2 bytes per character
      const storeSize = JSON.stringify(items).length * 2;
      totalSize += storeSize;
    }
    
    return totalSize;
  }

  // Check if cache size exceeds limit and cleanup if needed
  async enforceSizeLimit(): Promise<void> {
    const settings = this.getCacheSettings();
    const currentSize = await this.estimateSize();
    
    if (currentSize > settings.maxSize) {
      console.log(`Cache size (${currentSize}) exceeds limit (${settings.maxSize}), cleaning up...`);
      
      // Remove oldest items until we're under the limit
      for (const storeName of Object.values(STORES)) {
        const items = await this.getAll(storeName);
        const sortedItems = items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // Remove oldest 20% of items from this store
        const removeCount = Math.ceil(sortedItems.length * 0.2);
        for (let i = 0; i < removeCount; i++) {
          if (sortedItems[i]) {
            await this.delete(storeName, sortedItems[i].id);
          }
        }
        
        // Check if we're under the limit now
        const newSize = await this.estimateSize();
        if (newSize <= settings.maxSize) {
          break;
        }
      }
    }
  }

  // Clean up old data based on user settings
  async cleanup(): Promise<void> {
    const settings = this.getCacheSettings();
    const cutoffTime = Date.now() - settings.maxAge;

    for (const storeName of Object.values(STORES)) {
      const oldItems = await this.getOlderThan(storeName, cutoffTime);
      for (const item of oldItems) {
        await this.delete(storeName, item.id);
      }
    }

    // Also enforce size limit
    await this.enforceSizeLimit();
  }
}

export const offlineStorage = new OfflineStorage();

// Initialize on load
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error);
  
  // Setup cleanup interval based on user settings
  const setupCleanupInterval = () => {
    const settings = JSON.parse(localStorage.getItem('cache-settings') || '{}');
    const autoCleanup = settings.autoCleanup ?? true;
    const cleanupInterval = (settings.cleanupInterval || 24) * 60 * 60 * 1000;
    
    if (autoCleanup) {
      setInterval(() => {
        offlineStorage.cleanup().catch(console.error);
      }, cleanupInterval);
    }
  };

  setupCleanupInterval();

  // Listen for settings changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'cache-settings') {
      setupCleanupInterval();
    }
  });
}
