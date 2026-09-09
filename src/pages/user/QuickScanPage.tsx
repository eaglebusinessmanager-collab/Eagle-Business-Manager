import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine,
  Camera,
  Search,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Printer,
  Eye,
  History,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Barcode as BarcodeIcon,
  QrCode,
  Tag,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { Product } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { playScanBeep, renderBarcodeSvg, printProductLabel } from '../../utils/barcode';
import { ProductLabelModal } from '../../components/common/ProductLabelModal';

interface QuickScanPageProps {
  onNavigate?: (view: string) => void;
}

interface ScanHistoryItem {
  id: string;
  code: string;
  product?: Product;
  timestamp: string;
  status: 'found' | 'not_found';
}

export const QuickScanPage: React.FC<QuickScanPageProps> = ({ onNavigate }) => {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCamera, setActiveCamera] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Stock Adjust Popover State
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockDelta, setStockDelta] = useState<number>(1);
  const [stockReason, setStockReason] = useState('Restock received');
  const [adjusting, setAdjusting] = useState(false);

  // Label print modal
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'eagle-quick-scan-viewfinder';
  const currency = business?.currency || 'UGX';

  const loadProducts = async () => {
    if (!business?.id) return;
    const items = await dbService.getProducts(business.id);
    setProducts(items);
  };

  useEffect(() => {
    loadProducts();
  }, [business?.id]);

  // Hardware Barcode Scanner Listener (USB / Bluetooth scanners emit rapid keystrokes ending with Enter)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside standard inputs
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleLookupCode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Start Camera Scanner
  useEffect(() => {
    let isMounted = true;

    if (!activeCamera) {
      stopCamera();
      return;
    }

    const timer = setTimeout(async () => {
      const el = document.getElementById(containerId);
      if (!el || !isMounted) return;

      try {
        if (scannerRef.current) {
          await stopCamera();
        }

        const html5Qr = new Html5Qrcode(containerId);
        scannerRef.current = html5Qr;

        await html5Qr.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 260, height: 190 },
            aspectRatio: 1.333,
          },
          (decoded) => {
            if (isMounted) {
              handleLookupCode(decoded);
              if (!continuousMode) {
                // Keep viewfinder alive or pause
              }
            }
          },
          () => {}
        );
      } catch (e) {
        console.warn('Quick scan camera error:', e);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [activeCamera, continuousMode, products]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
  };

  const handleLookupCode = (rawCode: string) => {
    if (!rawCode) return;
    const clean = rawCode.trim();

    // Check if code contains product URL query e.g. "?product=prod-001"
    let targetCode = clean;
    if (clean.includes('product=')) {
      const match = clean.match(/product=([^&#]+)/);
      if (match && match[1]) {
        targetCode = decodeURIComponent(match[1]);
      }
    }

    const found = products.find((p) => {
      const matchBarcode = p.barcode && p.barcode.toLowerCase() === targetCode.toLowerCase();
      const matchSku = p.sku && p.sku.toLowerCase() === targetCode.toLowerCase();
      const matchId = p.id.toLowerCase() === targetCode.toLowerCase();
      return matchBarcode || matchSku || matchId;
    });

    if (found) {
      playScanBeep(true);
      setScannedProduct(found);
      setMessage({
        type: 'success',
        text: `Identified: ${found.name} (${currency} ${found.sellingPrice.toLocaleString()})`,
      });

      // Add to session scan history
      setScanHistory((prev) => [
        {
          id: 'scan-' + Date.now(),
          code: clean,
          product: found,
          timestamp: new Date().toLocaleTimeString(),
          status: 'found',
        },
        ...prev.slice(0, 19),
      ]);
    } else {
      playScanBeep(false);
      setMessage({
        type: 'error',
        text: `No matching product found in inventory for code: "${clean}"`,
      });

      setScanHistory((prev) => [
        {
          id: 'scan-' + Date.now(),
          code: clean,
          timestamp: new Date().toLocaleTimeString(),
          status: 'not_found',
        },
        ...prev.slice(0, 19),
      ]);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleLookupCode(manualCode.trim());
    setManualCode('');
  };

  // Quick Stock Adjustment
  const handleQuickStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || !business?.id) return;
    setAdjusting(true);

    try {
      const newStock = Math.max(0, scannedProduct.currentStock + stockDelta);
      const updated = await dbService.adjustStock(
        business.id,
        scannedProduct.id,
        newStock,
        stockReason || 'Quick Scan stock adjustment',
        'Quick Scan Mode'
      );

      if (updated) {
        setScannedProduct(updated);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setMessage({
          type: 'success',
          text: `Stock for ${updated.name} updated to ${updated.currentStock} units!`,
        });
        setShowStockModal(false);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Failed to update stock.' });
    } finally {
      setAdjusting(false);
    }
  };

  // Route to POS with product pre-added
  const handleSellProduct = () => {
    if (!scannedProduct) return;
    localStorage.setItem('eagle_pos_auto_add', JSON.stringify(scannedProduct));
    if (onNavigate) {
      onNavigate('sales');
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Quick Scan Mode
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold">
              Camera & USB Scanner
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rapid barcode & QR code recognition. Scan to sell, lookup stock, or execute instant inventory adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCamera(!activeCamera)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeCamera
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>{activeCamera ? 'Camera Active' : 'Enable Camera'}</span>
          </button>
          <button
            onClick={() => setContinuousMode(!continuousMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              continuousMode
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Continuous: {continuousMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`flex items-center justify-between gap-2 p-3.5 rounded-2xl border text-xs shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left is Scanner & Input; Right is Scanned Product Result & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Viewfinder Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ScanLine className="h-4 w-4 text-blue-600" />
                <span>Live Viewfinder</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Hardware Scanner Ready (USB/Bluetooth)
              </span>
            </div>

            {activeCamera ? (
              <div className="relative rounded-2xl overflow-hidden bg-black min-h-[260px] flex items-center justify-center">
                <div id={containerId} className="w-full h-full" />
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-64 h-44 border-2 border-blue-500/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="w-full h-0.5 bg-blue-400 shadow animate-pulse mt-20" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-center">
                <Camera className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Camera Viewfinder is Paused
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Click 'Enable Camera' above or use manual entry / hardware barcode scanner.
                </p>
              </div>
            )}

            {/* Manual Code Input */}
            <form onSubmit={handleManualSearch} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter or paste Barcode, SKU, or Product Code..."
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                Scan / Lookup
              </button>
            </form>
          </div>

          {/* Session Scan History */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-blue-600" />
                <span>Session Scan Log ({scanHistory.length})</span>
              </span>
              {scanHistory.length > 0 && (
                <button
                  onClick={() => setScanHistory([])}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear History
                </button>
              )}
            </div>

            {scanHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <Clock className="h-6 w-6 mx-auto mb-1 opacity-40" />
                <p>No scans recorded in this session yet.</p>
                <p className="text-[11px] mt-0.5">Scanned barcodes and QR codes will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {scanHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => item.product && setScannedProduct(item.product)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left hover:border-blue-300 dark:hover:border-blue-700 transition"
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.product ? item.product.name : `Unknown Code: ${item.code}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.code} • {item.timestamp}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                        item.status === 'found'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {item.status === 'found' ? 'Found' : 'Not In Catalog'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scanned Product Inspection & Instant Actions (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block mb-3">
              Scanned Item Details
            </span>

            {scannedProduct ? (
              <div className="space-y-4">
                {/* Product Card */}
                <div className="flex gap-3.5">
                  <img
                    src={
                      scannedProduct.imageUrl ||
                      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={scannedProduct.name}
                    className="h-24 w-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase">
                      {scannedProduct.category}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1 leading-snug truncate">
                      {scannedProduct.name}
                    </h3>
                    <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                      {currency} {scannedProduct.sellingPrice.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      SKU: {scannedProduct.sku}
                    </p>
                  </div>
                </div>

                {/* Stock Level Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    scannedProduct.currentStock <= 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
                      : scannedProduct.currentStock <= scannedProduct.minStockLevel
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <div>
                      <span className="font-bold block">
                        {scannedProduct.currentStock <= 0
                          ? 'Out of Stock'
                          : scannedProduct.currentStock <= scannedProduct.minStockLevel
                          ? 'Low Stock Warning'
                          : 'In Stock'}
                      </span>
                      <span className="text-[10px] opacity-80">
                        Threshold: {scannedProduct.minStockLevel} units
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-base">
                    {scannedProduct.currentStock} units
                  </span>
                </div>

                {/* Barcode Render */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                  <div
                    className="max-w-[200px] mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: renderBarcodeSvg(
                        scannedProduct.barcode || scannedProduct.sku,
                        200,
                        48
                      ),
                    }}
                  />
                </div>

                {/* Instant Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Action 1: Sell Now */}
                  <button
                    onClick={handleSellProduct}
                    disabled={scannedProduct.currentStock <= 0}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Sell Now / Add to Checkout</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </button>

                  {/* Action 2: Quick Stock Adjustment */}
                  <button
                    onClick={() => setShowStockModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Quick Stock Adjustment (+ / -)</span>
                  </button>

                  {/* Action 3: Print Label */}
                  <button
                    onClick={() => setLabelProduct(scannedProduct)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-slate-500" />
                    <span>Print Barcode & QR Label Sheet</span>
                  </button>

                  {/* Action 4: View in Marketplace */}
                  {onNavigate && (
                    <button
                      onClick={() => {
                        localStorage.setItem('eagle_marketplace_search', scannedProduct.name);
                        onNavigate('marketplace');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View in Eagle Marketplace</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <ScanLine className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600 animate-pulse" />
                <p className="font-bold text-slate-600 dark:text-slate-400">
                  Ready to Scan Product
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Hold a product barcode or QR code in front of the camera, type code in the search bar, or pull the trigger on a USB barcode gun.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      {showStockModal && scannedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Quick Stock Adjustment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {scannedProduct.name} (Current: {scannedProduct.currentStock} units)
            </p>

            <form onSubmit={handleQuickStockSubmit} className="mt-4 space-y-4 text-xs">
              {/* Quick Stepper */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Quantity to Add or Deduct:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockDelta((prev) => prev - 1)}
                    className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-base flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={stockDelta}
                    onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                    className="flex-1 py-2.5 px-3 text-center text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setStockDelta((prev) => prev + 1)}
                    className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-base flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-center gap-1.5 mt-2">
                  {[1, 5, 10, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStockDelta(num)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-900"
                    >
                      +{num}
                    </button>
                  ))}
                  {[-1, -5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStockDelta(num)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-900"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Result */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">New Resulting Stock:</span>
                <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                  {Math.max(0, scannedProduct.currentStock + stockDelta)} units
                </span>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment:
                </label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g. New supplier shipment, physical count correction, damaged item"
                  className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {adjusting ? 'Updating...' : 'Confirm Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Label Print Modal */}
      {labelProduct && (
        <ProductLabelModal
          isOpen={Boolean(labelProduct)}
          onClose={() => setLabelProduct(null)}
          product={labelProduct}
          currency={currency}
          businessName={business?.name || 'Eagle Business'}
        />
      )}
    </div>
  );
};
