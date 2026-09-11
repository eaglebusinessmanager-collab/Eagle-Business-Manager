import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, ScanLine, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode or QR Code',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-scanner';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraError(null);
    setIsScanning(true);

    const startScanner = async () => {
      try {
        // Wait for container element in DOM
        await new Promise((resolve) => setTimeout(resolve, 150));
        const element = document.getElementById(scannerContainerId);
        if (!element || !isMounted) return;

        const html5QrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) {
              onScan(decodedText);
              handleClose();
            }
          },
          () => {
            // Ignore scan parse frame errors
          }
        );
      } catch (err: any) {
        console.warn('Barcode camera scanner error:', err);
        if (isMounted) {
          setCameraError(
            err.message?.includes('Permission')
              ? 'Camera permission was denied. Please allow camera access or enter the code manually below.'
              : 'Could not access camera device directly in this frame. You can enter or paste the barcode/SKU below.'
          );
        }
      } finally {
        if (isMounted) setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
          .then(() => {
            try {
              html5QrCodeRef.current?.clear();
            } catch (e) {}
          });
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .catch(() => {})
        .then(() => {
          try {
            html5QrCodeRef.current?.clear();
          } catch (e) {}
          onClose();
        });
    } else {
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <ScanLine className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-[10px] text-slate-400">Point your camera at the barcode or QR label</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div className="relative min-h-[260px] rounded-2xl bg-slate-950 overflow-hidden flex flex-col items-center justify-center text-white border border-slate-800">
          <div id={scannerContainerId} className="w-full h-full" />

          {cameraError && (
            <div className="absolute inset-0 p-4 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <p className="text-xs font-medium text-slate-300 max-w-xs">{cameraError}</p>
              <span className="text-[11px] text-blue-400 font-semibold">
                Use the manual input field below to look up by Barcode or SKU.
              </span>
            </div>
          )}

          {isScanning && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 space-y-2">
              <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-200">Initializing camera lens...</p>
            </div>
          )}
        </div>

        {/* Manual Barcode / SKU Fallback Form */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Or Type / Paste Barcode or SKU Code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. EL-TV-4301 or 79456201"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
