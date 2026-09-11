import React from 'react';
import {
  Building2,
  Phone,
  MapPin,
  Mail,
  Receipt,
  User,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Calendar,
  CreditCard,
  Percent,
  FileCheck,
} from 'lucide-react';
import { Sale, ReceiptCustomizationConfig, Business } from '../../types';

interface ReceiptTemplateProps {
  sale: Sale;
  config: ReceiptCustomizationConfig;
  business?: Business | null;
  qrDataUrl?: string;
  onVerifyClick?: () => void;
}

export const ReceiptTemplateRenderer: React.FC<ReceiptTemplateProps> = ({
  sale,
  config,
  business,
  qrDataUrl,
  onVerifyClick,
}) => {
  const currency = config.currency || business?.currency || 'UGX';
  const template = config.template || 'modern';
  const accentColor = config.accentColor || '#2563eb';

  const businessName = config.businessName || business?.name || 'Eagle Business';
  const tagline = config.tagline || 'Quality Products & Dependable Service';
  const phone = config.phone || business?.phone || '';
  const address = config.address || business?.address || '';
  const email = config.email || '';
  const logoUrl = config.showLogo !== false ? (config.logoUrl || business?.logoUrl) : undefined;
  const returnPolicy = config.returnPolicy || 'Items can be exchanged within 7 days with this original receipt.';
  const footerMessage = config.footerMessage || config.receiptFooter || business?.receiptFooter || 'Thank you for your business!';

  const showCustomerName = config.showCustomerName !== false;
  const showCustomerPhone = config.showCustomerPhone !== false;
  const showStaffName = config.showStaffName !== false;
  const showSku = config.showSku !== false;
  const showDiscount = config.showDiscount !== false;
  const showQr = config.showQrVerification !== false && !!qrDataUrl;
  const showTaxNumber = config.showTaxNumber && !!config.taxNumber;
  const showPaymentMethod = config.showPaymentMethod !== false;

  // Format currency
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;

  // 1. THERMAL 58MM
  if (template === 'thermal_58') {
    return (
      <div className="w-[240px] mx-auto p-2 bg-white text-black font-mono text-[10px] leading-tight select-text">
        <div className="text-center space-y-1 pb-2 border-b border-black">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] mx-auto object-contain mb-1" />
          )}
          <h2 className="font-black text-xs uppercase tracking-tight">{businessName}</h2>
          {address && <p className="text-[9px]">{address}</p>}
          {phone && <p className="text-[9px]">TEL: {phone}</p>}
        </div>

        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>REC: {sale.saleNumber}</span>
            <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
          </div>
          {showCustomerName && sale.customerName && (
            <div>CUST: {sale.customerName}</div>
          )}
          {showStaffName && (
            <div>CASHIER: {sale.createdBy || 'POS Terminal'}</div>
          )}
        </div>

        <table className="w-full my-2 text-[9px]">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-0.5">ITEM</th>
              <th className="py-0.5 text-center">QTY</th>
              <th className="py-0.5 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-neutral-300">
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">
                  <div className="font-bold">{item.productName}</div>
                  {showSku && item.sku && <div className="text-[8px] text-neutral-600">{item.sku}</div>}
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right font-semibold">{(item.total || item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-2 border-t border-black space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{sale.subtotal.toLocaleString()}</span>
          </div>
          {sale.discount > 0 && showDiscount && (
            <div className="flex justify-between text-neutral-700">
              <span>DISCOUNT:</span>
              <span>-{sale.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-xs border-t border-dashed border-black pt-1">
            <span>TOTAL:</span>
            <span>{fmt(sale.total)}</span>
          </div>
          {showPaymentMethod && (
            <div className="flex justify-between text-[9px] pt-1">
              <span className="uppercase">PAID ({sale.paymentMethod}):</span>
              <span>{fmt(sale.amountPaid || sale.total)}</span>
            </div>
          )}
        </div>

        {showQr && (
          <div className="pt-3 text-center cursor-pointer" onClick={onVerifyClick} title="Click to verify">
            <img src={qrDataUrl} alt="Receipt QR" className="h-16 w-16 mx-auto" />
            <span className="text-[8px] uppercase tracking-wider block mt-0.5">SCAN TO VERIFY</span>
          </div>
        )}

        <div className="mt-3 text-center text-[8px] border-t border-dashed border-black pt-2 space-y-1">
          <p>{footerMessage}</p>
          <p className="italic">Powered by Eagle Business Manager</p>
        </div>
      </div>
    );
  }

  // 2. THERMAL 80MM
  if (template === 'thermal_80') {
    return (
      <div className="w-[320px] mx-auto p-4 bg-white text-black font-mono text-xs leading-normal select-text">
        <div className="text-center space-y-1 pb-3 border-b-2 border-black">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-10 max-w-[150px] mx-auto object-contain mb-1" />
          )}
          <h2 className="font-black text-sm uppercase tracking-wide">{businessName}</h2>
          {config.showTagline && tagline && <p className="text-[10px] uppercase">{tagline}</p>}
          {address && <p className="text-[10px]">{address}</p>}
          {phone && <p className="text-[10px]">TEL: {phone}</p>}
          {showTaxNumber && <p className="text-[10px]">TIN / TAX: {config.taxNumber}</p>}
        </div>

        <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="font-bold">RECEIPT #: {sale.saleNumber}</span>
            <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>TIME: {new Date(sale.createdAt).toLocaleTimeString()}</span>
            {showStaffName && <span>STAFF: {sale.createdBy || 'Attendant'}</span>}
          </div>
          {showCustomerName && sale.customerName && (
            <div className="text-[10px] font-bold">
              CUSTOMER: {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
            </div>
          )}
        </div>

        <table className="w-full my-3 text-[11px]">
          <thead>
            <tr className="border-b-2 border-black text-left font-black">
              <th className="py-1">ITEM</th>
              <th className="py-1 text-center">QTY</th>
              <th className="py-1 text-right">RATE</th>
              <th className="py-1 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-neutral-300">
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1.5 pr-1">
                  <div className="font-bold">{item.productName}</div>
                  {showSku && item.sku && <div className="text-[9px] text-neutral-500">{item.sku}</div>}
                </td>
                <td className="py-1.5 text-center align-top">{item.quantity}</td>
                <td className="py-1.5 text-right align-top">{item.unitPrice.toLocaleString()}</td>
                <td className="py-1.5 text-right align-top font-bold">{(item.total || item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-2 border-t-2 border-black space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{sale.subtotal.toLocaleString()}</span>
          </div>
          {sale.discount > 0 && showDiscount && (
            <div className="flex justify-between text-neutral-700">
              <span>Discount Allowed:</span>
              <span>-{sale.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-sm border-t border-black pt-1">
            <span>NET TOTAL:</span>
            <span>{fmt(sale.total)}</span>
          </div>
          {showPaymentMethod && (
            <div className="flex justify-between text-[11px] pt-1">
              <span className="uppercase">PAYMENT ({sale.paymentMethod}):</span>
              <span className="font-bold">{fmt(sale.amountPaid || sale.total)}</span>
            </div>
          )}
          {sale.paymentStatus !== 'paid' && (
            <div className="flex justify-between text-[11px] text-rose-600 font-bold">
              <span>BALANCE OUTSTANDING:</span>
              <span>{fmt(sale.total - (sale.amountPaid || 0))}</span>
            </div>
          )}
        </div>

        {showQr && (
          <div className="pt-3 text-center cursor-pointer" onClick={onVerifyClick} title="Verify authentic receipt">
            <img src={qrDataUrl} alt="Receipt QR Code" className="h-20 w-20 mx-auto" />
            <span className="text-[9px] font-bold tracking-wider uppercase block mt-1">SECURE QR VERIFICATION</span>
          </div>
        )}

        <div className="mt-4 text-center text-[10px] border-t border-dashed border-black pt-2 space-y-1">
          <p className="font-bold">{footerMessage}</p>
          {config.showReturnPolicy && returnPolicy && <p className="italic text-[9px]">{returnPolicy}</p>}
          <p className="text-[9px] text-neutral-500">Eagle Business Manager • Digital POS</p>
        </div>
      </div>
    );
  }

  // 3. ELEGANT LUXURY
  if (template === 'elegant') {
    return (
      <div className="w-full max-w-lg mx-auto p-6 sm:p-8 bg-amber-50/30 dark:bg-slate-900 border-2 border-amber-900/20 dark:border-amber-500/20 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100 font-serif">
        {/* Luxury Header */}
        <div className="text-center pb-6 border-b border-amber-900/20 dark:border-amber-500/20 space-y-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 max-w-[180px] mx-auto object-contain mb-2" />
          ) : (
            <div className="h-12 w-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-600/40 flex items-center justify-center font-bold text-amber-800 dark:text-amber-200">
              EB
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-amber-950 dark:text-amber-200">
            {businessName}
          </h1>
          {config.showTagline && tagline && (
            <p className="text-xs italic text-amber-800/80 dark:text-amber-300/80">{tagline}</p>
          )}
          <div className="text-xs font-sans text-slate-600 dark:text-slate-400 space-x-3">
            {address && <span>{address}</span>}
            {phone && <span>• Tel: {phone}</span>}
          </div>
        </div>

        {/* Transaction Identity */}
        <div className="py-4 font-sans flex flex-wrap justify-between items-center text-xs border-b border-slate-200 dark:border-slate-800 gap-2">
          <div>
            <span className="text-slate-400 uppercase tracking-widest text-[10px] block">Receipt Reference</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{sale.saleNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 uppercase tracking-widest text-[10px] block">Date Issued</span>
            <span className="font-medium">{new Date(sale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {showCustomerName && sale.customerName && (
            <div className="w-full pt-2 text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Honored Client:</span> {sale.customerName}
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="my-5 font-sans overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-amber-900/10 dark:border-amber-500/10 text-slate-400 text-[10px] uppercase tracking-wider text-left">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-center font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 pr-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{item.productName}</span>
                    {showSku && item.sku && <span className="block text-[10px] text-slate-400">{item.sku}</span>}
                  </td>
                  <td className="py-2.5 text-center">{item.quantity}</td>
                  <td className="py-2.5 text-right">{item.unitPrice.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-bold">{((item.total || item.subtotal)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation */}
        <div className="pt-4 font-sans border-t-2 border-amber-900/20 dark:border-amber-500/20 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{sale.subtotal.toLocaleString()}</span>
          </div>
          {sale.discount > 0 && showDiscount && (
            <div className="flex justify-between text-amber-700 dark:text-amber-400">
              <span>Privilege Discount</span>
              <span>-{sale.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base sm:text-lg font-black font-serif text-amber-950 dark:text-amber-200 border-t border-amber-900/10 dark:border-amber-500/10 pt-2">
            <span>Total Payable</span>
            <span>{fmt(sale.total)}</span>
          </div>
          {showPaymentMethod && (
            <div className="flex justify-between text-xs text-slate-500 pt-1 font-sans">
              <span>Settlement ({sale.paymentMethod.replace('_', ' ').toUpperCase()})</span>
              <span className="font-bold text-slate-900 dark:text-white">{fmt(sale.amountPaid || sale.total)}</span>
            </div>
          )}
        </div>

        {/* QR Seal */}
        {showQr && (
          <div className="mt-6 pt-4 border-t border-dashed border-amber-900/20 dark:border-amber-500/20 flex items-center justify-between font-sans">
            <div className="text-[11px] text-slate-500 max-w-[240px]">
              <span className="font-bold block text-slate-700 dark:text-slate-300">Verified Authentic Receipt</span>
              <span>Scan QR code with any smartphone to inspect digital cryptographic certification.</span>
            </div>
            <img
              src={qrDataUrl}
              alt="QR Code"
              onClick={onVerifyClick}
              className="h-16 w-16 cursor-pointer rounded-lg border border-amber-900/20 p-1 bg-white"
              title="Click to verify"
            />
          </div>
        )}

        <div className="mt-6 text-center text-xs font-sans text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="font-serif italic text-amber-950 dark:text-amber-300">{footerMessage}</p>
        </div>
      </div>
    );
  }

  // 4. CORPORATE / BUSINESS A4
  if (template === 'corporate') {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-900 dark:text-slate-100 font-sans">
        {/* Top Corporate Banner */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900 dark:border-slate-100">
          <div className="space-y-1">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-12 max-w-[200px] object-contain mb-2" />
            )}
            <h1 className="text-xl font-black uppercase tracking-tight">{businessName}</h1>
            {address && <p className="text-xs text-slate-500">{address}</p>}
            {phone && <p className="text-xs text-slate-500">Phone: {phone}</p>}
            {email && <p className="text-xs text-slate-500">Email: {email}</p>}
            {showTaxNumber && <p className="text-xs font-bold text-slate-700 dark:text-slate-300">TIN / VAT: {config.taxNumber}</p>}
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 inline-block mb-2">
              Official Sales Receipt
            </span>
            <div className="text-xs text-slate-500">Receipt Ref:</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{sale.saleNumber}</div>
            <div className="text-xs text-slate-500 mt-1">Date: {new Date(sale.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Bill To & Dispatch */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
            <div className="font-bold text-slate-900 dark:text-white">{sale.customerName || 'Walk-in Customer'}</div>
            {sale.customerPhone && <div className="text-slate-500">Phone: {sale.customerPhone}</div>}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Transaction Details</span>
            <div className="text-slate-600 dark:text-slate-400">Payment Channel: <span className="font-bold capitalize">{sale.paymentMethod.replace('_', ' ')}</span></div>
            <div className="text-slate-600 dark:text-slate-400">Payment Status: <span className="font-bold uppercase text-emerald-600">{sale.paymentStatus}</span></div>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full my-6 text-xs">
          <thead>
            <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider text-left">
              <th className="py-2.5 px-3">Item & Description</th>
              <th className="py-2.5 px-3 text-center">Quantity</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sale.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                  {showSku && item.sku && <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>}
                </td>
                <td className="py-3 px-3 text-center font-medium">{item.quantity}</td>
                <td className="py-3 px-3 text-right">{item.unitPrice.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-bold">{(item.total || item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary & Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 dark:border-slate-100">
          <div>
            {showQr && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={onVerifyClick}>
                <img src={qrDataUrl} alt="QR" className="h-16 w-16 shrink-0 bg-white p-1 rounded-md" />
                <div className="text-[10px]">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">Eagle Verification</span>
                  <span className="text-slate-500">Scan to check authentic merchant signature & date.</span>
                </div>
              </div>
            )}
            <div className="mt-4 text-[10px] text-slate-500">
              <span className="font-bold block text-slate-700 dark:text-slate-300">Policy:</span>
              <span>{returnPolicy}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Gross Subtotal:</span>
              <span>{sale.subtotal.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && showDiscount && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount:</span>
                <span>-{sale.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total Amount:</span>
              <span>{fmt(sale.total)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Amount Received:</span>
              <span>{fmt(sale.amountPaid || sale.total)}</span>
            </div>

            <div className="pt-6 text-right">
              <div className="inline-block border-t border-slate-300 dark:border-slate-700 pt-1 text-[10px] text-slate-400">
                Authorized Signature & Stamp
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="font-medium">{footerMessage}</p>
        </div>
      </div>
    );
  }

  // 5. DEFAULT MODERN SAAS RECEIPT (clean, modern, card-based with high contrast)
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-slate-900 dark:text-slate-100 font-sans">
      {/* Brand Header */}
      <div className="text-center pb-5 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-10 max-w-[160px] mx-auto object-contain mb-1" />
        )}
        <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">{businessName}</h2>
        {config.showTagline && tagline && <p className="text-[11px] text-slate-500 dark:text-slate-400">{tagline}</p>}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
          {address && <span>{address}</span>}
          {phone && <span>• {phone}</span>}
        </div>
      </div>

      {/* Meta Info */}
      <div className="py-3.5 border-b border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receipt #</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{sale.saleNumber}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date & Time</span>
          <span className="text-slate-700 dark:text-slate-300">{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {showCustomerName && sale.customerName && (
        <div className="py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 text-[11px]">Customer:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {sale.customerName} {showCustomerPhone && sale.customerPhone ? `(${sale.customerPhone})` : ''}
          </span>
        </div>
      )}

      {/* Items List */}
      <div className="my-4 space-y-2.5 text-xs">
        {sale.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <span className="font-semibold text-slate-900 dark:text-white block">{item.productName}</span>
              <span className="text-[11px] text-slate-400">
                {item.quantity} × {item.unitPrice.toLocaleString()}
                {showSku && item.sku && ` • SKU: ${item.sku}`}
              </span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              {(item.total || item.subtotal).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Calculation Summary */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{sale.subtotal.toLocaleString()}</span>
        </div>
        {sale.discount > 0 && showDiscount && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Discount Applied</span>
            <span>-{sale.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-2">
          <span>Total</span>
          <span style={{ color: accentColor }}>{fmt(sale.total)}</span>
        </div>
        {showPaymentMethod && (
          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span className="capitalize">Paid via {sale.paymentMethod.replace('_', ' ')}</span>
            <span className="font-bold text-slate-900 dark:text-white">{fmt(sale.amountPaid || sale.total)}</span>
          </div>
        )}
        {sale.paymentStatus !== 'paid' && (
          <div className="flex justify-between text-[11px] text-rose-600 font-bold">
            <span>Balance Due</span>
            <span>{fmt(sale.total - (sale.amountPaid || 0))}</span>
          </div>
        )}
      </div>

      {/* QR Code Verification */}
      {showQr && (
        <div
          className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition"
          onClick={onVerifyClick}
          title="Click to view digital certificate"
        >
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Authentic</span>
            </div>
            <p className="text-[10px] text-slate-500">Scan QR to verify authentic business issue</p>
          </div>
          <img src={qrDataUrl} alt="Receipt QR" className="h-14 w-14 bg-white p-1 rounded-xl shadow-2xs" />
        </div>
      )}

      {/* Footer Notes */}
      <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">{footerMessage}</p>
        {config.showReturnPolicy && returnPolicy && (
          <p className="text-[11px] text-slate-400">{returnPolicy}</p>
        )}
      </div>
    </div>
  );
};
