import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Sparkles, Volume2, Search } from 'lucide-react';
import { playScanBeep } from '../../utils/barcode';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  title?: string;
  subtitle?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode or QR Code',
  subtitle = 'Position the code inside the viewfinder box',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'eagle-camera-scanner-view';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraError(null);

    // Wait for DOM element
    const timer = setTimeout(async () => {
      const el = document.getElementById(containerId);
      if (!el || !isMounted) return;

      try {
        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.3333,
          },
          (decodedText) => {
            if (isMounted) {
              playScanBeep(true);
              onScanSuccess(decodedText);
              // Auto close on positive scan
              handleClose();
            }
          },
          () => {
            // Frame parse error (expected when no barcode in view)
          }
        );

        if (isMounted) setIsScanning(true);
      } catch (err: any) {
        console.warn('Camera start error:', err);
        if (isMounted) {
          setCameraError(
            'Unable to access camera. Please allow camera permissions or enter the code manually below.'
          );
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // Ignored
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playScanBeep(true);
    onScanSuccess(manualCode.trim());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative mt-4 rounded-2xl overflow-hidden bg-black min-h-[250px] flex items-center justify-center">
          <div id={containerId} className="w-full h-full" />

          {/* Scanner Overlay Guide */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="w-64 h-44 border-2 border-blue-500/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative flex items-center justify-center">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-0.5 -ml-0.5" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-0.5 -mr-0.5" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-0.5 -ml-0.5" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-0.5 -mr-0.5" />
                <div className="w-full h-0.5 bg-blue-500/70 shadow-sm animate-pulse" />
              </div>
              <p className="text-[10px] font-bold text-white/90 drop-shadow-md mt-3 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                Scanning 1D Barcode & QR Code
              </p>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-white space-y-2">
              <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-200 leading-relaxed max-w-xs mx-auto">
                {cameraError}
              </p>
            </div>
          )}
        </div>

        {/* Manual Barcode Entry Fallback */}
        <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Or Enter / Paste Code Manually:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type Barcode, SKU, or Product ID..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-sm"
            >
              Lookup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
