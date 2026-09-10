import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { offlineSync, SyncState } from '../../services/offlineSync';

export const OfflineIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(offlineSync.getState());
  const [pendingCount, setPendingCount] = useState<number>(offlineSync.getPendingCount());
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = () => {
    offlineSync.triggerSync();
  };

  // Render status badge configuration
  const getBadgeConfig = () => {
    switch (syncState) {
      case 'offline-local':
        return {
          icon: <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-300" />,
          label: 'Offline — Saved locally',
          bg: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500/40',
          pulse: true,
        };
      case 'syncing':
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 shrink-0 text-blue-200 animate-spin" />,
          label: 'Syncing...',
          bg: 'bg-blue-600 text-white border-blue-500/40',
          pulse: false,
        };
      case 'sync-complete':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-200" />,
          label: 'Sync complete',
          bg: 'bg-emerald-600 text-white border-emerald-500/40',
          pulse: false,
        };
      case 'online-synced':
      default:
        return {
          icon: <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-400" />,
          label: 'Online — Synced',
          bg: 'bg-slate-900/90 text-slate-200 border-slate-700/60 dark:bg-slate-800/90',
          pulse: false,
        };
    }
  };

  const config = getBadgeConfig();

  // If online and synced, we show a clean compact status indicator in bottom left or when clicked
  return (
    <div
      className={`fixed bottom-20 sm:bottom-4 left-4 z-50 transition-all duration-300 ${
        syncState === 'offline-local' ? 'animate-bounce-subtle' : ''
      }`}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg text-[11px] font-bold cursor-pointer backdrop-blur-md select-none transition-transform active:scale-95 ${config.bg}`}
      >
        {config.icon}
        <span className="tracking-tight">{config.label}</span>

        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {pendingCount} pending
          </span>
        )}

        {syncState === 'offline-local' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManualSync();
            }}
            title="Retry Connection & Sync"
            className="ml-1 p-0.5 rounded-full hover:bg-white/20"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="absolute bottom-10 left-0 w-64 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
            <span>Offline-First Engine</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              Active
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            All records, sales, customers, receipts, and notes are safely stored in your browser's persistent storage. Changes automatically sync to Firebase when online.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">Pending Sync Items:</span>
            <span className="font-mono font-bold">{pendingCount}</span>
          </div>
          {syncState === 'offline-local' && (
            <button
              onClick={handleManualSync}
              className="w-full mt-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition"
            >
              Test Connection & Sync
            </button>
          )}
        </div>
      )}
    </div>
  );
};
