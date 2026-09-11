import React, { useState } from 'react';
import {
  Calculator,
  QrCode,
  Percent,
  Layers,
  Phone,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Printer,
  Download,
  DollarSign,
  ArrowRightLeft,
  Sparkles,
  Building2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { renderBarcodeSvg } from '../../utils/barcode';

export const EagleToolsPage: React.FC = () => {
  const { business } = useAuth();
  const [activeTool, setActiveTool] = useState<
    'margin' | 'vat' | 'barcode' | 'card' | 'converter' | 'loan'
  >('margin');

  // Profit Margin Calculator State
  const [costPrice, setCostPrice] = useState<number>(20000);
  const [sellingPrice, setSellingPrice] = useState<number>(28000);

  // VAT & Discount Calculator State
  const [originalPrice, setOriginalPrice] = useState<number>(100000);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [vatRate, setVatRate] = useState<number>(18); // Ugandan standard VAT is 18%
  const [applyVat, setApplyVat] = useState<boolean>(true);

  // Barcode / QR Generator State
  const [barcodeInput, setBarcodeInput] = useState<string>(
    business?.phone?.replace(/[^0-9]/g, '') || 'EAGLE-10029'
  );
  const [barcodeLabel, setBarcodeLabel] = useState<string>(
    business?.name || 'Eagle Business Product'
  );
  const [barcodePrice, setBarcodePrice] = useState<string>('UGX 25,000');
  const [copiedLink, setCopiedLink] = useState(false);

  // Unit Converter State
  const [convAmount, setConvAmount] = useState<number>(1);
  const [convType, setConvType] = useState<'carton' | 'dozen' | 'mass' | 'currency'>('carton');
  const [unitsPerCarton, setUnitsPerCarton] = useState<number>(24);

  // Loan / Credit Installment Calculator
  const [loanPrincipal, setLoanPrincipal] = useState<number>(500000);
  const [loanDurationMonths, setLoanDurationMonths] = useState<number>(3);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(5); // 5% monthly or flat

  // Calculations: Margin
  const grossProfit = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const markupPercent = costPrice > 0 ? (grossProfit / costPrice) * 100 : 0;

  // Calculations: VAT & Discount
  const discountAmount = (originalPrice * discountPercent) / 100;
  const discountedPrice = originalPrice - discountAmount;
  const vatAmount = applyVat ? (discountedPrice * vatRate) / 100 : 0;
  const finalPriceWithTax = discountedPrice + vatAmount;

  // Calculations: Loan / Installment
  const totalInterest = (loanPrincipal * (loanInterestRate / 100)) * loanDurationMonths;
  const totalRepayment = loanPrincipal + totalInterest;
  const monthlyInstallment = loanDurationMonths > 0 ? totalRepayment / loanDurationMonths : 0;

  const handleCopyVCardLink = () => {
    const cleanPhone = (business?.phone || '').replace(/[^0-9]/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hello ${business?.name || 'Merchant'}, I am contacting you from your Eagle Business card.`
    )}`;
    navigator.clipboard.writeText(waLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintBarcode = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Eagle Business Tools & Utilities</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instant financial calculators, barcode label creator, digital business card, and retail conversion tools.
          </p>
        </div>

        {/* Tool Navigation Chips */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'margin', label: 'Margin & Markup', icon: Percent },
            { id: 'vat', label: 'VAT & Discount', icon: DollarSign },
            { id: 'barcode', label: 'Barcode & QR', icon: QrCode },
            { id: 'card', label: 'Digital Card', icon: Phone },
            { id: 'converter', label: 'Unit Converter', icon: ArrowRightLeft },
            { id: 'loan', label: 'Credit Installments', icon: Layers },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTool === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PROFIT MARGIN & MARKUP CALCULATOR */}
      {activeTool === 'margin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-600" />
              <span>Input Cost & Selling Price</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cost Price (UGX)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">UGX</span>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-13 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price (UGX)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">UGX</span>
                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-13 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: In Ugandan retail, standard gross margins range from 20% to 35% for consumer goods and 40%+ for apparel and services.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl border border-blue-800/50 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold">
                PROFIT & MARGIN METRICS
              </span>
              <h4 className="text-xl font-extrabold mt-1">
                UGX {grossProfit.toLocaleString()}
              </h4>
              <p className="text-xs text-blue-200 mt-0.5">Gross Profit per Unit</p>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/10">
                <div className="p-3 rounded-xl bg-white/10">
                  <span className="text-[10px] text-blue-200 uppercase font-bold">Profit Margin</span>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">
                    {marginPercent.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">(Profit ÷ Selling Price)</p>
                </div>

                <div className="p-3 rounded-xl bg-white/10">
                  <span className="text-[10px] text-blue-200 uppercase font-bold">Markup</span>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">
                    {markupPercent.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">(Profit ÷ Cost Price)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-blue-200">
              {grossProfit < 0 ? (
                <span className="text-rose-400 font-bold">⚠️ Warning: Selling below cost price (Loss of UGX {Math.abs(grossProfit).toLocaleString()})</span>
              ) : (
                <span>Healthy pricing formula applied.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. VAT & DISCOUNT CALCULATOR */}
      {activeTool === 'vat' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Discount & Tax Breakdown</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Original Base Price (UGX)
                </label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Percentage ({discountPercent}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold text-sm w-12 text-right">{discountPercent}%</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Apply Standard Ugandan VAT (18% URA)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              PRICE SUMMARY
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Original Amount:</span>
                <span className="font-mono font-bold">UGX {originalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-600">
                <span>Discount Saved ({discountPercent}%):</span>
                <span className="font-mono font-bold">- UGX {discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Discounted Net:</span>
                <span className="font-mono font-bold">UGX {discountedPrice.toLocaleString()}</span>
              </div>
              {applyVat && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-blue-600">
                  <span>VAT ({vatRate}% URA):</span>
                  <span className="font-mono font-bold">+ UGX {vatAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base font-extrabold text-slate-900 dark:text-white">
                <span>Final Payable:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  UGX {finalPriceWithTax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BARCODE & QR GENERATOR */}
      {activeTool === 'barcode' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="h-4 w-4 text-purple-600" />
              <span>Generate Barcode & Label</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / SKU Code *
                </label>
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="e.g. 78491029302"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Label Product Name
                </label>
                <input
                  type="text"
                  value={barcodeLabel}
                  onChange={(e) => setBarcodeLabel(e.target.value)}
                  placeholder="e.g. Organic Ugandan Shea Butter"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Printed Price Label
                </label>
                <input
                  type="text"
                  value={barcodePrice}
                  onChange={(e) => setBarcodePrice(e.target.value)}
                  placeholder="e.g. UGX 35,000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Printable Label Preview Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 max-w-xs w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {business?.name || 'Eagle Business Store'}
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
                {barcodeLabel || 'Product Item'}
              </h4>

              {/* Barcode SVG */}
              <div
                className="bg-white p-3 rounded-lg border border-slate-200 inline-block mx-auto mb-2"
                dangerouslySetInnerHTML={{
                  __html: renderBarcodeSvg(barcodeInput || '1234567890'),
                }}
              />

              <div className="text-base font-black text-slate-900 dark:text-white mt-1 font-mono">
                {barcodePrice}
              </div>
            </div>

            <button
              onClick={handlePrintBarcode}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Label Sheet</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. DIGITAL BUSINESS CARD & WHATSAPP LINK */}
      {activeTool === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>Shareable Merchant Profile</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customers can scan your QR code or click your link to start an instant WhatsApp conversation with your store!
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Store Name</span>
                <p className="font-bold text-slate-900 dark:text-white">{business?.name || 'My Store'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">WhatsApp Phone</span>
                <p className="font-bold text-slate-900 dark:text-white">{business?.phone || '+256 700 000 000'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Location</span>
                <p className="font-bold text-slate-900 dark:text-white">{business?.address || 'Kampala, Uganda'}</p>
              </div>
            </div>

            <button
              onClick={handleCopyVCardLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? 'WhatsApp Link Copied!' : 'Copy Direct WhatsApp Link'}</span>
            </button>
          </div>

          {/* Card Presentation */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg">
                  🦅
                </div>
                <div>
                  <h4 className="font-black text-base">{business?.name || 'Eagle Business'}</h4>
                  <span className="text-[10px] text-blue-300 font-medium">{business?.category || 'Retail Store'}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                UGANDA
              </span>
            </div>

            <div className="my-6 space-y-2 text-xs text-slate-200">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>{business?.phone || '+256 743 566 645'}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                <span>{business?.address || 'Kampala Road, Uganda'}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Powered by Eagle Business Manager</span>
              <span className="text-emerald-400 font-bold">Verified Merchant</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. UNIT CONVERTER */}
      {activeTool === 'converter' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            <span>Retail & Wholesale Packaging Unit Converter</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Number of Cartons / Boxes
              </label>
              <input
                type="number"
                min="1"
                value={convAmount}
                onChange={(e) => setConvAmount(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Units packed per Carton (e.g. 24 cans/pieces)
              </label>
              <input
                type="number"
                min="1"
                value={unitsPerCarton}
                onChange={(e) => setUnitsPerCarton(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col justify-center">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Total Single Pieces</span>
              <p className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">
                {(convAmount * unitsPerCarton).toLocaleString()} Pieces
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREDIT / LOAN INSTALLMENTS */}
      {activeTool === 'loan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              <span>Customer Credit / Installment Terms</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Principal Balance (UGX)
                </label>
                <input
                  type="number"
                  min="0"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Repayment Period: {loanDurationMonths} Months
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={loanDurationMonths}
                  onChange={(e) => setLoanDurationMonths(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Financing Fee / Markup ({loanInterestRate}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={loanInterestRate}
                  onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              INSTALLMENT SCHEDULE
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Monthly Payment:</span>
                <span className="font-mono font-bold text-base text-blue-600">
                  UGX {Math.round(monthlyInstallment).toLocaleString()} / mo
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Interest / Fee:</span>
                <span className="font-mono font-bold text-amber-600">
                  UGX {Math.round(totalInterest).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-extrabold">
                <span>Total Expected Amount:</span>
                <span className="font-mono text-emerald-600">
                  UGX {Math.round(totalRepayment).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
