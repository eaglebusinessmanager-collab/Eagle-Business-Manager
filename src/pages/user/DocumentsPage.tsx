import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Sliders,
  CheckCircle2,
  Receipt,
  Download,
  Eye,
  Building,
  QrCode,
  Sparkles,
  Share2,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { ReceiptConfig, Product, Sale } from '../../types';

interface DocumentsPageProps {
  onNavigate?: (view: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const { business } = useAuth();
  const [activeTab, setActiveTab] = useState<'generator' | 'receipt_config'>('generator');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [config, setConfig] = useState<ReceiptConfig>({
    businessId: business?.id || '',
    showLogo: true,
    tagline: 'Quality Products & Dependable Service',
    footerMessage: 'Thank you for your business! Goods once sold are not returnable without valid receipt.',
    returnPolicy: '7 days exchange policy on unopened original items.',
    showTaxNumber: true,
    showCustomerPhone: true,
    paperSize: '80mm',
    accentColor: '#2563eb',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Document Generator state
  const [selectedDocType, setSelectedDocType] = useState<'catalog' | 'delivery_note' | 'statement'>('catalog');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');

  useEffect(() => {
    if (!business?.id) return;
    const loadAll = async () => {
      try {
        const [savedConfig, prods, salesList] = await Promise.all([
          dbService.getReceiptConfig(business.id),
          dbService.getProducts(business.id),
          dbService.getSales(business.id),
        ]);
        if (savedConfig) setConfig(savedConfig);
        setProducts(prods);
        setSales(salesList);
      } catch (err) {
        console.error('Error loading documents settings:', err);
      }
    };
    loadAll();
  }, [business?.id]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    try {
      await dbService.saveReceiptConfig(business.id, config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save receipt settings: ' + err);
    }
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const selectedSale = sales.find((s) => s.id === selectedSaleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Business Documents & Receipt Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize official sales receipts, generate product catalogs, and issue customer delivery notes.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === 'generator'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Document Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('receipt_config')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === 'receipt_config'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Receipt Settings</span>
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('receipt-studio')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer ml-1"
            >
              <Sparkles className="h-4 w-4" />
              <span>Full Receipt Studio</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Receipt customization settings successfully saved!</span>
        </div>
      )}

      {/* Tab 1: Receipt Customization Studio */}
      {activeTab === 'receipt_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>Receipt Branding & Layout Settings</span>
            </h2>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Tagline / Header Slogan
                </label>
                <input
                  type="text"
                  value={config.tagline || ''}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  placeholder="e.g. Your Trusted Solar & Electronics Partner"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Printer Paper Size
                  </label>
                  <select
                    value={config.paperSize}
                    onChange={(e) =>
                      setConfig({ ...config, paperSize: e.target.value as '80mm' | '58mm' | 'A4' })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
                  >
                    <option value="80mm">80mm Standard POS Thermal</option>
                    <option value="58mm">58mm Compact Mobile Bluetooth</option>
                    <option value="A4">A4 Full Sheet Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor || '#2563eb'}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="h-9 w-12 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
                    />
                    <span className="font-mono text-xs text-slate-500">{config.accentColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Appreciation Message
                </label>
                <textarea
                  rows={2}
                  value={config.footerMessage || ''}
                  onChange={(e) => setConfig({ ...config, footerMessage: e.target.value })}
                  placeholder="Thank you for shopping with us!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Warranty & Return Policy Notice
                </label>
                <textarea
                  rows={2}
                  value={config.returnPolicy || ''}
                  onChange={(e) => setConfig({ ...config, returnPolicy: e.target.value })}
                  placeholder="Items can be exchanged within 7 days with this original receipt."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showTaxNumber}
                    onChange={(e) => setConfig({ ...config, showTaxNumber: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Display Tax / TIN Number on Receipts</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showCustomerPhone}
                    onChange={(e) => setConfig({ ...config, showCustomerPhone: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Display Customer Phone on Receipts</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showLogo}
                    onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Display Business Header Logo</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Save Receipt Settings
                </button>
              </div>
            </form>
          </div>

          {/* Live Interactive Receipt Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Live POS Receipt Preview ({config.paperSize})
            </span>
            <div
              className={`rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl p-5 font-mono text-[11px] leading-relaxed transition-all ${
                config.paperSize === '58mm' ? 'w-64' : config.paperSize === '80mm' ? 'w-80' : 'w-full'
              }`}
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                {config.showLogo && (
                  <div className="h-8 w-8 mx-auto mb-1 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    EM
                  </div>
                )}
                <h3 className="font-bold text-sm tracking-tight">{business?.name || 'Eagle Business'}</h3>
                {config.tagline && <p className="text-[10px] text-slate-500 mt-0.5">{config.tagline}</p>}
                <p className="text-[10px] text-slate-500">{business?.address || 'Kampala, Uganda'}</p>
                <p className="text-[10px] text-slate-500">Tel: {business?.phone || '+256 700 000000'}</p>
                {config.showTaxNumber && business?.taxNumber && (
                  <p className="text-[10px] text-slate-500">TIN: {business.taxNumber}</p>
                )}
              </div>

              {/* Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span className="font-bold">RCP-000429</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                {config.showCustomerPhone && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span>Dennis (+256...)</span>
                  </div>
                )}
              </div>

              {/* Sample Items */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800 text-[10px]">
                  <span>ITEM</span>
                  <span>TOTAL ({business?.currency || 'UGX'})</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <div>
                    <span>Solar Inverter 1.5kVA</span>
                    <span className="block text-[9px] text-slate-400">1 x 450,000</span>
                  </div>
                  <span>450,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <div>
                    <span>LED Tube Light 18W</span>
                    <span className="block text-[9px] text-slate-400">2 x 15,000</span>
                  </div>
                  <span>30,000</span>
                </div>
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                  <span>TOTAL:</span>
                  <span>480,000 {business?.currency || 'UGX'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>PAID (CASH):</span>
                  <span>500,000</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>CHANGE:</span>
                  <span>20,000</span>
                </div>
              </div>

              {/* Footers */}
              <div className="pt-3 text-center space-y-1.5 text-[10px] text-slate-500">
                {config.footerMessage && <p className="font-bold text-slate-700">{config.footerMessage}</p>}
                {config.returnPolicy && <p className="text-[9px]">{config.returnPolicy}</p>}
                <div className="pt-1 flex justify-center">
                  <QrCode className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-[8px] text-slate-400">Powered by Eagle Business Manager</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Document Generator */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedDocType('catalog')}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                selectedDocType === 'catalog'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Product Price Catalog
                </span>
                <span className="text-[11px] text-slate-400">
                  Official inventory pricing sheet to print or share with customers.
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedDocType('delivery_note')}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                selectedDocType === 'delivery_note'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <Receipt className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Delivery Note / Waybill
                </span>
                <span className="text-[11px] text-slate-400">
                  Generate goods dispatch documents with driver and recipient signature lines.
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedDocType('statement')}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                selectedDocType === 'statement'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <Download className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Business Summary Report
                </span>
                <span className="text-[11px] text-slate-400">
                  Comprehensive printable overview of inventory value and revenue.
                </span>
              </div>
            </button>
          </div>

          {/* Delivery Note Parameters */}
          {selectedDocType === 'delivery_note' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Delivery Note Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Select Sale (Optional)
                  </label>
                  <select
                    value={selectedSaleId}
                    onChange={(e) => setSelectedSaleId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  >
                    <option value="">Manual Entry or Choose Sale</option>
                    {sales.slice(0, 15).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.saleNumber} — {s.customerName || 'Customer'} ({s.total.toLocaleString()} {business?.currency || 'UGX'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient / Customer name"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Delivery site or shop location"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Printable Preview Container */}
          <div className="rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Document Preview
              </span>
              <button
                onClick={handlePrintDocument}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>

            {/* Document Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {business?.name || 'Eagle Business'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">{business?.address || 'Kampala, Uganda'}</p>
                <p className="text-xs text-slate-500">Tel: {business?.phone} | Email: {business?.email}</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black uppercase text-blue-700 font-mono block">
                  {selectedDocType === 'catalog'
                    ? 'OFFICIAL PRICE LIST'
                    : selectedDocType === 'delivery_note'
                    ? 'GOODS DELIVERY NOTE'
                    : 'BUSINESS INVENTORY SUMMARY'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Issued: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Catalog Content */}
            {selectedDocType === 'catalog' && (
              <div className="space-y-4">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5">Product Name</th>
                      <th className="py-2.5">SKU / Code</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5 text-center">Availability</th>
                      <th className="py-2.5 text-right">Price ({business?.currency || 'UGX'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 font-bold text-slate-900">{p.name}</td>
                        <td className="py-2 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-2 text-slate-600">{p.category || 'General'}</td>
                        <td className="py-2 text-center">
                          {p.currentStock > 0 ? (
                            <span className="text-emerald-600 font-semibold">In Stock</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">Pre-order</span>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-900">
                          {p.sellingPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Delivery Note Content */}
            {selectedDocType === 'delivery_note' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Consigned To:</span>
                    <span className="font-bold text-slate-900 block mt-1">
                      {recipientName || selectedSale?.customerName || 'Customer / Recipient'}
                    </span>
                    <span className="text-slate-600 block">
                      {recipientAddress || 'Customer Address / Delivery Destination'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Waybill Details:</span>
                    <span className="font-mono text-slate-700 block mt-1">
                      Sale Ref: {selectedSale?.saleNumber || 'DIRECT-DISPATCH'}
                    </span>
                    <span className="text-slate-600 block">Status: Dispatched in Good Condition</span>
                  </div>
                </div>

                <table className="w-full text-xs text-left">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">Dispatched Qty</th>
                      <th className="py-2 text-center">Received Qty</th>
                      <th className="py-2 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedSale?.items || products.slice(0, 3)).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold text-slate-900">
                          {'productName' in item ? item.productName : item.name}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold">
                          {'quantity' in item ? item.quantity : 1}
                        </td>
                        <td className="py-2.5 text-center font-mono text-slate-300">
                          [ &nbsp; &nbsp; &nbsp; ]
                        </td>
                        <td className="py-2.5 text-right text-slate-400">Intact / Verified</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signature Lines */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dispatched By (Store / Driver):</span>
                    <div className="mt-8 border-b border-slate-300 w-48" />
                    <span className="text-[10px] text-slate-400 mt-1 block">Signature & Date</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Received in Good Order By:</span>
                    <div className="mt-8 border-b border-slate-300 w-48" />
                    <span className="text-[10px] text-slate-400 mt-1 block">Recipient Signature & Stamp</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statement Summary Content */}
            {selectedDocType === 'statement' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Products</span>
                    <span className="text-base font-bold text-slate-900 block font-mono">{products.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Recorded Sales</span>
                    <span className="text-base font-bold text-slate-900 block font-mono">{sales.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Stock Valuation</span>
                    <span className="text-base font-bold text-blue-600 block font-mono">
                      {products.reduce((s, p) => s + p.buyingPrice * p.currentStock, 0).toLocaleString()} {business?.currency || 'UGX'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
