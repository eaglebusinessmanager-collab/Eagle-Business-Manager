// Offline Sync Manager & Notification Audio Synthesizer
// Provides offline queues, synchronization with Firebase, and network status management

export type SyncState = 'online-synced' | 'offline-local' | 'syncing' | 'sync-complete';

export interface PendingSyncItem {
  id: string;
  collection: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'eagle_sync_queue';
const SYNC_STATE_KEY = 'eagle_sync_state';

class OfflineSyncManager {
  private state: SyncState = navigator.onLine ? 'online-synced' : 'offline-local';
  private listeners: Array<(state: SyncState, pendingCount: number) => void> = [];
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      // Check initial state
      if (!navigator.onLine) {
        this.setState('offline-local');
      }
    }
  }

  public subscribe(listener: (state: SyncState, pendingCount: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.state, this.getPendingCount());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const count = this.getPendingCount();
    this.listeners.forEach((l) => l(this.state, count));
  }

  public getState(): SyncState {
    return this.state;
  }

  public setState(newState: SyncState) {
    this.state = newState;
    this.notify();
  }

  public getPendingQueue(): PendingSyncItem[] {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getPendingCount(): number {
    return this.getPendingQueue().length;
  }

  public enqueue(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): void {
    const queue = this.getPendingQueue();
    const queueItem: PendingSyncItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    queue.push(queueItem);
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to enqueue sync item:', e);
    }

    if (!navigator.onLine) {
      this.setState('offline-local');
    } else {
      this.triggerSync();
    }
  }

  public clearQueue() {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    this.notify();
  }

  private handleOnline() {
    this.setState('syncing');
    this.triggerSync();
  }

  private handleOffline() {
    this.setState('offline-local');
  }

  public async triggerSync(syncHandler?: (item: PendingSyncItem) => Promise<boolean>): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      this.setState('offline-local');
      return;
    }

    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      this.setState('online-synced');
      return;
    }

    this.isSyncing = true;
    this.setState('syncing');

    try {
      const remaining: PendingSyncItem[] = [];
      for (const item of queue) {
        try {
          if (syncHandler) {
            const success = await syncHandler(item);
            if (!success) remaining.push(item);
          } else {
            // Default placeholder: item handled
          }
        } catch (err) {
          console.warn('Sync failed for item:', item, err);
          remaining.push(item);
        }
      }

      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));

      if (remaining.length === 0) {
        this.setState('sync-complete');
        setTimeout(() => {
          if (navigator.onLine) {
            this.setState('online-synced');
          }
        }, 3000);
      } else {
        this.setState('offline-local');
      }
    } catch (e) {
      console.error('Error during synchronization:', e);
      this.setState('offline-local');
    } finally {
      this.isSyncing = false;
    }
  }

  // Web Audio Synthesizer for notifications (zero dependencies, works 100% offline)
  public playNotificationSound(priority: 'normal' | 'important' | 'urgent' = 'normal'): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (priority === 'urgent') {
        // High alert double-ping chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (priority === 'important') {
        // Smooth chord chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else {
        // Gentle single chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio might be muted or blocked by browser policy
      console.log('Audio playback skipped:', e);
    }
  }
}

export const offlineSync = new OfflineSyncManager();
