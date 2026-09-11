import { InAppNotification } from '../types';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { soundEngine } from '../utils/audio';

type NotificationListener = (notification: InAppNotification) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private historyListeners: Set<(notifications: InAppNotification[]) => void> = new Set();
  private lastNotifiedId: string | null = null;
  private unsubscribeFirestore: Unsubscribe | null = null;
  private channel: BroadcastChannel | null = null;

  public subscribeToHistory(listener: (notifications: InAppNotification[]) => void): () => void {
    this.historyListeners.add(listener);
    listener(this.getStoredNotifications());
    return () => {
      this.historyListeners.delete(listener);
    };
  }

  private notifyHistoryChange(): void {
    const data = this.getStoredNotifications();
    this.historyListeners.forEach((fn) => {
      try {
        fn(data);
      } catch {}
    });
  }

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('eagle_push_notifications');
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
              this.handleIncomingNotification(event.data.notification, false);
            }
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }

      // Also listen to storage events as cross-tab fallback
      window.addEventListener('storage', (e) => {
        if (e.key === 'eagle_latest_push' && e.newValue) {
          try {
            const notif = JSON.parse(e.newValue);
            this.handleIncomingNotification(notif, false);
          } catch {}
        }
      });
    }
  }

  /**
   * Request native browser notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe React components (e.g. Popup listener) to incoming live notifications
   */
  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start listening for notifications targeting this business/user
   */
  public startListening(userId?: string, businessId?: string): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    if (isFirebaseConfigured() && db) {
      try {
        const notifsRef = collection(db, 'notifications');
        // Listen to all notifications where target is 'all' or this user/business
        this.unsubscribeFirestore = onSnapshot(notifsRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data() as InAppNotification;
              // Check if relevant to this user/business
              const isRelevant =
                data.userId === 'all' ||
                (userId && data.userId === userId) ||
                (businessId && (data.targetBusinessId === businessId || data.userId === businessId));

              // If it was created within the last 2 minutes, and not already notified
              const notifTime = new Date(data.createdAt).getTime();
              const isRecent = Date.now() - notifTime < 120000;

              if (isRelevant && isRecent && data.id !== this.lastNotifiedId) {
                this.handleIncomingNotification(data, true);
              }
            }
          });
        }, (error) => {
          console.warn('Firestore notification stream fallback:', error);
        });
      } catch (err) {
        console.warn('Notification listener setup error:', err);
      }
    }
  }

  public stopListening(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
  }

  /**
   * Handle incoming push: Sound + Native Browser Notification + UI Popup dispatch
   */
  public handleIncomingNotification(notification: InAppNotification, broadcast: boolean = true): void {
    if (this.lastNotifiedId === notification.id) return;
    this.lastNotifiedId = notification.id;

    // 1. Play synthesized audio
    const sound = notification.sound || 'chime';
    soundEngine.playSound(sound);

    // 2. Trigger native browser push notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: notification.id,
        });
      } catch (e) {
        console.warn('Native notification trigger error:', e);
      }
    }

    // 3. Broadcast to other open tabs
    if (broadcast) {
      if (this.channel) {
        this.channel.postMessage({ type: 'PUSH_NOTIFICATION', notification });
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('eagle_latest_push', JSON.stringify(notification));
      }
    }

    // 4. Dispatch to active UI listeners (popups, toasts, badge counters)
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (e) {
        console.error('Error dispatching notification:', e);
      }
    });

    // 5. Store locally so it shows in Notification Center
    this.saveNotificationLocally(notification);
  }

  /**
   * Send a Push Notification (Admin or System action)
   */
  public async sendPushNotification(notificationData: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): Promise<InAppNotification> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notification: InAppNotification = {
      ...notificationData,
      id,
      read: false,
      createdAt: new Date().toISOString(),
      sound: notificationData.sound || 'chime',
    };

    // Save to Firestore if available
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'notifications', id), notification);
      } catch (e) {
        console.warn('Firebase notification write fallback:', e);
      }
    }

    // Broadcast immediately locally and across tabs
    this.handleIncomingNotification(notification, true);

    return notification;
  }

  public getStoredNotifications(): InAppNotification[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem('eagle_in_app_notifications');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveNotificationLocally(notification: InAppNotification): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const existing = this.getStoredNotifications();
      const filtered = existing.filter((n) => n.id !== notification.id);
      filtered.unshift(notification);
      localStorage.setItem('eagle_in_app_notifications', JSON.stringify(filtered.slice(0, 50)));
      this.notifyHistoryChange();
    } catch (e) {
      console.warn('Failed to save notification locally:', e);
    }
  }

  public markAsRead(id: string): void {
    const existing = this.getStoredNotifications();
    const updated = existing.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem('eagle_in_app_notifications', JSON.stringify(updated));
    this.notifyHistoryChange();

    if (isFirebaseConfigured() && db) {
      try {
        updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
      } catch {}
    }
  }

  public markAllAsRead(): void {
    const existing = this.getStoredNotifications();
    const updated = existing.map((n) => ({ ...n, read: true }));
    localStorage.setItem('eagle_in_app_notifications', JSON.stringify(updated));
    this.notifyHistoryChange();
  }

  public clearAll(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('eagle_in_app_notifications');
      this.notifyHistoryChange();
    }
  }
}

export const notificationService = new NotificationService();
