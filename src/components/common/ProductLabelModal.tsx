import React, { useEffect, useState } from 'react';
import { X, Printer, Download, QrCode, Barcode as BarcodeIcon, ShieldCheck, Tag } from 'lucide-react';
import { Product } from '../../types';
import { generateProductQrDataUrl, renderBarcodeSvg, printProductLabel } from '../../utils/barcode';

interface ProductLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currency?: string;
  businessName?: string;
}

export const ProductLabelModal: React.FC<ProductLabelModalProps> = ({
  isOpen,
  onClose,
  product,
  currency = 'UGX',
  businessName = 'Eagle Business',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (product) {
      generateProductQrDataUrl(product).then(setQrDataUrl);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const barcodeCode = product.barcode || product.sku || 'EAGLE-ITEM';
  const priceFormatted = `${currency} ${product.sellingPrice.toLocaleString()}`;

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${product.sku || product.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Product Label & QR Code
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Printable inventory barcode and public verification QR tag
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Label Preview Card */}
        <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            {businessName}
          </div>
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
            {product.name}
          </h4>
          <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm">
            {priceFormatted}
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            SKU: {product.sku} | Stock: {product.currentStock} units
          </p>

          {/* QR Code and Barcode side by side */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 items-center">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight mb-1 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Verify Product</span>
              </span>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Product Verification QR"
                  className="h-28 w-28 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white"
                />
              ) : (
                <div className="h-28 w-28 rounded-xl bg-slate-100 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight mb-1">
                POS Barcode
              </span>
              <div
                className="w-full max-w-[150px] overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: renderBarcodeSvg(barcodeCode, 150, 52),
                }}
              />
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Protected QR: Only contains public verification details. Cost price and private data are excluded.
          </span>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 text-xs"
          >
            <Download className="h-4 w-4" />
            <span>Save QR Image</span>
          </button>
          <button
            type="button"
            onClick={() => printProductLabel(product, currency, businessName)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition text-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Label Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
