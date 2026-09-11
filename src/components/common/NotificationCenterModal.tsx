import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Play,
  Clock,
} from 'lucide-react';
import { InAppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';
import { soundEngine } from '../../utils/audio';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() =>
    notificationService.getPermissionStatus()
  );

  const loadNotifications = () => {
    setNotifications(notificationService.getStoredNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications history?')) {
      notificationService.clearAll();
      loadNotifications();
    }
  };

  const handleNotificationClick = (notif: InAppNotification) => {
    notificationService.markAsRead(notif.id);
    loadNotifications();
    if (notif.actionView && onNavigate) {
      onNavigate(notif.actionView);
      onClose();
    } else if (notif.link) {
      if (notif.link.startsWith('http')) {
        window.open(notif.link, '_blank');
      } else if (onNavigate) {
        onNavigate(notif.link);
        onClose();
      }
    }
  };

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionStatus(res);
  };

  const toggleMute = () => {
    const next = !isMuted;
    soundEngine.setMuted(next);
    setIsMuted(next);
    if (!next) {
      soundEngine.playChime();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                System broadcasts, alerts, and push messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Audio Sound Tester & Browser Notification Banner */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Test Chimes:</span>
            <button
              onClick={() => soundEngine.playChime()}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600"
            >
              Chime
            </button>
            <button
              onClick={() => soundEngine.playCash()}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600"
            >
              Cash
            </button>
            <button
              onClick={() => soundEngine.playAlert()}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
            >
              Alert
            </button>
          </div>

          {permissionStatus !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Enable Browser Push</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="text-xs mt-0.5">No notifications or broadcasts at this time.</p>
            </div>
          ) : (
            notifications.map((n) => {
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative ${
                    n.read
                      ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                      : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shrink-0 shadow-2xs mt-0.5">
                    {n.type === 'alert' ? (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    ) : n.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : n.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${n.read ? 'font-medium' : 'font-extrabold'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] mt-1 line-clamp-2 text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                      {(n.actionView || n.link) && (
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                          <span>{n.actionLabel || 'View'}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <CheckCheck className="h-4 w-4 text-blue-600" />
              <span>Mark all as read</span>
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 text-xs font-semibold transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear history</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
