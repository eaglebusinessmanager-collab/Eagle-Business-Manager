import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Volume2,
  VolumeX,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { InAppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';
import { soundEngine } from '../../utils/audio';

interface NotificationPopupProps {
  onNavigate?: (view: string) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ onNavigate }) => {
  const [activeNotification, setActiveNotification] = useState<InAppNotification | null>(null);
  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted());
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Subscribe to live push notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setActiveNotification(notification);
      setProgress(100);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!activeNotification) return;

    // Normal notifications auto-dismiss after 10 seconds, urgent stays until closed
    if (activeNotification.priority === 'urgent') return;

    const duration = 9000;
    const interval = 100;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setActiveNotification(null);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeNotification]);

  const toggleSound = () => {
    const nextState = !isMuted;
    soundEngine.setMuted(nextState);
    setIsMuted(nextState);
    if (!nextState) {
      soundEngine.playChime();
    }
  };

  const handleAction = () => {
    if (!activeNotification) return;
    notificationService.markAsRead(activeNotification.id);
    if (activeNotification.actionView && onNavigate) {
      onNavigate(activeNotification.actionView);
    } else if (activeNotification.link) {
      if (activeNotification.link.startsWith('http')) {
        window.open(activeNotification.link, '_blank');
      } else if (onNavigate) {
        onNavigate(activeNotification.link);
      }
    }
    setActiveNotification(null);
  };

  const handleDismiss = () => {
    if (activeNotification) {
      notificationService.markAsRead(activeNotification.id);
    }
    setActiveNotification(null);
  };

  if (!activeNotification) return null;

  const getTypeStyles = () => {
    switch (activeNotification.type) {
      case 'alert':
        return {
          bg: 'bg-rose-950/95 border-rose-500/50 text-white',
          badge: 'bg-rose-500 text-white',
          icon: AlertCircle,
          ring: 'ring-rose-500/30',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/95 border-amber-500/50 text-white',
          badge: 'bg-amber-500 text-white',
          icon: AlertTriangle,
          ring: 'ring-amber-500/30',
        };
      case 'success':
        return {
          bg: 'bg-emerald-950/95 border-emerald-500/50 text-white',
          badge: 'bg-emerald-500 text-white',
          icon: CheckCircle2,
          ring: 'ring-emerald-500/30',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 border-blue-500/50 text-white',
          badge: 'bg-blue-500 text-white',
          icon: Info,
          ring: 'ring-blue-500/30',
        };
    }
  };

  const style = getTypeStyles();
  const IconComponent = style.icon;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl p-4 sm:p-5 ${style.bg} ring-4 ${style.ring}`}
      >
        {/* Top Progress bar */}
        {activeNotification.priority !== 'urgent' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-blue-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start gap-3.5">
          {/* Animated Icon badge */}
          <div className={`p-2.5 rounded-2xl ${style.badge} shadow-lg shrink-0 animate-bounce`}>
            <Bell className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-white/90">
                  {activeNotification.priority === 'urgent' ? '🚨 URGENT NOTICE' : 'PUSH NOTIFICATION'}
                </span>
                {activeNotification.targetBusinessName && (
                  <span className="text-[10px] text-slate-300 truncate max-w-[120px]">
                    to {activeNotification.targetBusinessName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleSound}
                  title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h4 className="text-sm font-extrabold text-white mt-1.5 leading-snug">
              {activeNotification.title}
            </h4>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed line-clamp-3">
              {activeNotification.message}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
              {(activeNotification.actionView || activeNotification.link) && (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                >
                  <span>{activeNotification.actionLabel || 'View Now'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
