import React, { useState } from 'react';
import { Smartphone, CheckCircle, X, ExternalLink, Info } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'settings' | 'button' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [modalState, setModalState] = useState<'none' | 'already-installed' | 'instructions'>('none');

  const handleClick = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. If the app is already installed and standalone, show friendly message
    if (isInstalled) {
      setModalState('already-installed');
      return;
    }

    // 2. If the native install prompt is ready (Android/Chromium/Desktop), trigger it
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // If user dismissed or cancelled, provide instructions if desired
      }
      return;
    }

    // 3. Fallback: Browser does not support native prompt or iOS Safari
    setModalState('instructions');
  };

  const closeModal = () => setModalState('none');

  // RENDER MODALS
  const renderModals = () => {
    if (modalState === 'already-installed') {
      return (
        <div
          id="pwa-already-installed-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-4">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Eagle Business Manager
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Eagle Business Manager is already installed on this device.
            </p>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              You can launch it directly from your home screen or apps menu for high-speed offline access.
            </p>
            <button
              id="close-pwa-installed-modal-btn"
              onClick={closeModal}
              className="mt-5 w-full rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition active:scale-98 cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    if (modalState === 'instructions') {
      return (
        <div
          id="pwa-install-instructions-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Download Our App Here
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Eagle Business Manager WebApp / PWA
                  </p>
                </div>
              </div>
              <button
                id="close-pwa-instructions-btn"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                Install Eagle Business Manager on your phone for a faster app-like experience.
              </p>

              {isIOS ? (
                <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider">
                    Instructions for iPhone / iPad (Safari):
                  </p>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">1</span>
                    <p>In Safari, tap the <span className="font-bold text-slate-900 dark:text-white">Share</span> button (square with an arrow pointing up).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">2</span>
                    <p>Scroll down in the share sheet and tap <span className="font-bold text-slate-900 dark:text-white">Add to Home Screen</span>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">3</span>
                    <p>Tap <span className="font-bold text-slate-900 dark:text-white">Add</span> in the top-right corner to finish.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider">
                    Instructions for Android / Chrome / Edge:
                  </p>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">1</span>
                    <p>Open your browser menu (tap the <span className="font-bold text-slate-900 dark:text-white">three dots ⋮</span> in Chrome or Edge).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">2</span>
                    <p>Choose <span className="font-bold text-slate-900 dark:text-white">Install App</span> or <span className="font-bold text-slate-900 dark:text-white">Add to Home Screen</span> when available.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">3</span>
                    <p>Confirm by tapping <span className="font-bold text-slate-900 dark:text-white">Install</span> to place the Eagle Business Manager icon on your home screen.</p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg">
                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Runs securely in standalone mode with full offline caching and instant receipt generation.</span>
              </div>
            </div>

            <button
              id="got-it-pwa-instructions-btn"
              onClick={closeModal}
              className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition active:scale-98 cursor-pointer shadow-sm"
            >
              Got It
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // 1. BANNER VARIANT (e.g., Dashboard or Marketing Callout)
  if (variant === 'banner') {
    return (
      <>
        <div
          id="pwa-download-banner"
          className={`mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-4 sm:p-5 text-white shadow-md ${className}`}
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
              <span className="text-xl">📲</span>
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold tracking-tight">
                Get Eagle Business Manager On Your Device
              </p>
              <p className="text-xs text-blue-100 mt-0.5">
                Install as a lightweight PWA for ultra-fast barcode scanning, instant receipts & offline sales.
              </p>
            </div>
          </div>
          <button
            id="pwa-banner-download-btn"
            type="button"
            onClick={handleClick}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-blue-900 shadow hover:bg-blue-50 transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>📲 DOWNLOAD OUR APP HERE</span>
          </button>
        </div>
        {renderModals()}
      </>
    );
  }

  // 2. SETTINGS VARIANT
  if (variant === 'settings') {
    return (
      <>
        <button
          id="pwa-settings-download-btn"
          type="button"
          onClick={handleClick}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer ${className}`}
        >
          <span>📲 DOWNLOAD OUR APP HERE</span>
        </button>
        {renderModals()}
      </>
    );
  }

  // 3. FULL BUTTON VARIANT
  if (variant === 'button') {
    return (
      <>
        <button
          id="pwa-standard-download-btn"
          type="button"
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer ${className}`}
        >
          <span>📲 DOWNLOAD OUR APP HERE</span>
        </button>
        {renderModals()}
      </>
    );
  }

  // 4. COMPACT / NAV VARIANT (Default)
  // Clean, high-contrast, strictly says "📲 DOWNLOAD OUR APP HERE"
  return (
    <>
      <button
        id="pwa-nav-download-btn"
        type="button"
        onClick={handleClick}
        title="📲 DOWNLOAD OUR APP HERE"
        className={`flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold shadow-sm hover:shadow active:scale-95 transition cursor-pointer whitespace-nowrap ${className}`}
      >
        <span>📲 DOWNLOAD OUR APP HERE</span>
      </button>
      {renderModals()}
    </>
  );
};
