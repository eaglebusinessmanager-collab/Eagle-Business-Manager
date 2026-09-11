import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Printer,
  Share2,
  Download,
  Sliders,
  CheckCircle2,
  Sparkles,
  Save,
  Eye,
  History,
  Search,
  Building,
  Phone,
  MessageCircle,
  FileText,
  ShieldCheck,
  Palette,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Sale, ReceiptCustomizationConfig, ReceiptTemplateId } from '../../types';
import { ReceiptTemplateRenderer } from '../../components/receipts/ReceiptTemplates';
import { ReceiptVerificationModal } from '../../components/receipts/ReceiptVerificationModal';
import { getWhatsAppUrl } from '../../utils/phone';

interface ReceiptStudioPageProps {
  initialSaleId?: string;
  onNavigate?: (view: string) => void;
}

export const ReceiptStudioPage: React.FC<ReceiptStudioPageProps> = ({
  initialSaleId,
  onNavigate,
}) => {
  const { business, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'studio' | 'history'>('studio');
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // History search state
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Receipt Customization Config State
  const [config, setConfig] = useState<ReceiptCustomizationConfig>({
    businessId: business?.id || '',
    businessName: business?.name || 'Eagle Business',
    tagline: 'Quality Products & Dependable Service',
    phone: business?.phone || '+256 743 566 645',
    whatsapp: '+256743566645',
    address: business?.address || 'Plot 45 Kampala Road, Shop 12, Kampala',
    email: 'eaglebusinessmanager@gmail.com',
    footerMessage: business?.receiptFooter || 'Thank you for your business! Powered by Eagle Business Manager.',
    returnPolicy: 'Exchange allowed within 7 days upon presentation of this original receipt.',
    currency: business?.currency || 'UGX',
    template: 'modern',
    paperSize: '80mm',
    accentColor: '#2563eb',
    showLogo: true,
    showTagline: true,
    showCustomerName: true,
    showCustomerPhone: true,
    showStaffName: true,
    showSku: true,
    showDiscount: true,
    showTaxNumber: false,
    taxNumber: '1004928192',
    showPaymentMethod: true,
    showQrVerification: true,
    showReturnPolicy: true,
  });

  const currency = config.currency || business?.currency || 'UGX';

  // Sample sale for preview if no sales exist
  const sampleSale: Sale = {
    id: 'sample-sale-01',
    businessId: business?.id || 'biz-01',
    saleNumber: 'REC-2026-0892',
    customerId: 'cust-demo',
    customerName: 'Sarah Nalubega',
    customerPhone: '+256 701 234 567',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Executive Cotton Shirt - Navy M',
        sku: 'SHIRT-NAV-M',
        unitPrice: 45000,
        quantity: 2,
        subtotal: 90000,
        total: 90000,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Leather Formal Belt - Brown',
        sku: 'BELT-BRN-01',
        unitPrice: 25000,
        quantity: 1,
        subtotal: 25000,
        total: 25000,
      },
    ],
    subtotal: 115000,
    discount: 5000,
    total: 110000,
    amountPaid: 110000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    createdBy: user?.fullName || 'Eagle Cashier',
  };

  // Load configuration & sales
  useEffect(() => {
    if (!business?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [savedConfig, salesList] = await Promise.all([
          dbService.getReceiptConfig(business.id),
          dbService.getSales(business.id),
        ]);
        if (savedConfig) {
          setConfig((prev) => ({ ...prev, ...savedConfig }));
        }
        setSales(salesList);
        if (initialSaleId) {
          const match = salesList.find((s) => s.id === initialSaleId);
          if (match) setSelectedSale(match);
        } else if (salesList.length > 0) {
          setSelectedSale(salesList[0]);
        }
      } catch (err) {
        console.error('Error loading receipt studio:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [business?.id, initialSaleId]);

  // Generate verification QR code whenever active sale or config changes
  useEffect(() => {
    const activeSale = selectedSale || sampleSale;
    const verificationPayload = JSON.stringify({
      v: 'EBM-V1',
      id: activeSale.saleNumber,
      biz: config.businessName || business?.name || 'Eagle Business',
      tot: activeSale.total,
      dt: activeSale.createdAt,
      st: activeSale.paymentStatus,
    });

    QRCode.toDataURL(verificationPayload, {
      width: 180,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR code generation warning:', err));
  }, [selectedSale, config.businessName, business?.name]);

  // Save Config
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!business?.id) return;
    try {
      await dbService.saveReceiptConfig(business.id, config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert('Failed to save receipt settings: ' + err);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const active = selectedSale || sampleSale;
    const lines = active.items
      .map((it) => `• ${it.productName} (x${it.quantity}) - ${currency} ${(it.total || it.subtotal).toLocaleString()}`)
      .join('\n');

    const message = `🧾 *OFFICIAL SALES RECEIPT*\n*${config.businessName || business?.name || 'Eagle Business'}*\n------------------------------\n*Receipt #:* ${active.saleNumber}\n*Date:* ${new Date(active.createdAt).toLocaleDateString()}\n*Customer:* ${active.customerName || 'Valued Client'}\n\n*ITEMS:*\n${lines}\n------------------------------\n*Subtotal:* ${currency} ${active.subtotal.toLocaleString()}\n${active.discount > 0 ? `*Discount:* -${currency} ${active.discount.toLocaleString()}\n` : ''}*TOTAL:* ${currency} ${active.total.toLocaleString()}\n*Payment:* ${active.paymentMethod.toUpperCase()} (${active.paymentStatus.toUpperCase()})\n\n${config.footerMessage || 'Thank you for your business!'}\n*Verified via Eagle Business Manager*`;

    const targetPhone = active.customerPhone || config.whatsapp || config.phone || '';
    const url = getWhatsAppUrl(targetPhone, message);
    window.open(url, '_blank');
  };

  // Copy text receipt
  const handleCopyReceipt = () => {
    const active = selectedSale || sampleSale;
    const lines = active.items
      .map((it) => `${it.productName} x${it.quantity}: ${currency} ${(it.total || it.subtotal).toLocaleString()}`)
      .join('\n');

    const text = `${config.businessName || business?.name || 'Eagle Business'}\nReceipt #: ${active.saleNumber}\nDate: ${new Date(active.createdAt).toLocaleString()}\nCustomer: ${active.customerName || 'Walk-in'}\n\nItems:\n${lines}\nTotal: ${currency} ${active.total.toLocaleString()}\nPaid: ${active.paymentMethod}\nStatus: ${active.paymentStatus}\n${config.footerMessage || ''}`;

    navigator.clipboard.writeText(text);
    alert('Receipt text copied to clipboard!');
  };

  // Filtered sales for history
  const filteredSales = sales.filter((s) => {
    const q = historySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.saleNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.includes(q));
    const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSale = selectedSale || sampleSale;

  const templatesList: { id: ReceiptTemplateId; name: string; desc: string }[] = [
    { id: 'modern', name: 'Modern SaaS', desc: 'Clean, contemporary, balanced layout' },
    { id: 'classic', name: 'Classic POS', desc: 'Dashed retail dividers, centered headers' },
    { id: 'elegant', name: 'Luxury Elegant', desc: 'Serif fonts, gold/warm borders, formal feel' },
    { id: 'thermal_58', name: 'Thermal 58mm', desc: 'Compact portable Bluetooth printer layout' },
    { id: 'thermal_80', name: 'Thermal 80mm', desc: 'Standard ESC/POS retail terminal format' },
    { id: 'corporate', name: 'Corporate A4', desc: 'Executive invoice-style receipt with tax' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Professional Receipt Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Design premium branded receipts, configure QR verification seals, and manage receipt history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Studio & Designer</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Receipt History ({sales.length})</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Receipt studio branding & layout settings saved successfully!</span>
        </div>
      )}

      {activeTab === 'studio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (Left) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Template Selector Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <span>Choose Premium Template</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {templatesList.map((tpl) => {
                  const isSelected = (config.template || 'modern') === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setConfig({ ...config, template: tpl.id })}
                      className={`p-3 rounded-2xl border text-left transition text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="font-extrabold block">{tpl.name}</span>
                      <span className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{tpl.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Branding & Store Identity */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span>Branding & Header Identity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Store / Enterprise Name
                  </label>
                  <input
                    type="text"
                    value={config.businessName || ''}
                    onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    placeholder="e.g. Eagle Styles Store"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Slogan / Tagline
                  </label>
                  <input
                    type="text"
                    value={config.tagline || ''}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    placeholder="e.g. Quality and Dependability"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Customer Service Phone
                  </label>
                  <input
                    type="text"
                    value={config.phone || ''}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    placeholder="+256 700 000 000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp || ''}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    placeholder="+256 743 566 645"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Shop / Physical Address
                  </label>
                  <input
                    type="text"
                    value={config.address || ''}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    placeholder="Plot 45 Kampala Road, Kampala"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    TIN / Tax Registration Number
                  </label>
                  <input
                    type="text"
                    value={config.taxNumber || ''}
                    onChange={(e) => setConfig({ ...config, taxNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    placeholder="e.g. 1004928192"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    {['#2563eb', '#4f46e5', '#059669', '#d97706', '#e11d48', '#0f172a'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConfig({ ...config, accentColor: c })}
                        className={`h-7 w-7 rounded-full transition cursor-pointer ${
                          config.accentColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Field Toggles */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Field Visibility & Security Toggles</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'showLogo', label: 'Show Business Logo' },
                  { key: 'showTagline', label: 'Show Tagline / Slogan' },
                  { key: 'showCustomerName', label: 'Customer Name' },
                  { key: 'showCustomerPhone', label: 'Customer Phone' },
                  { key: 'showStaffName', label: 'Cashier / Attendant Name' },
                  { key: 'showSku', label: 'Product SKU / Code' },
                  { key: 'showDiscount', label: 'Discount Breakdown' },
                  { key: 'showPaymentMethod', label: 'Payment Channel & Status' },
                  { key: 'showTaxNumber', label: 'TIN / Tax Number' },
                  { key: 'showQrVerification', label: 'QR Code Verification Seal' },
                  { key: 'showReturnPolicy', label: 'Return / Exchange Policy' },
                ].map((item) => {
                  const isChecked = config[item.key as keyof ReceiptCustomizationConfig] !== false;
                  return (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setConfig({ ...config, [item.key]: e.target.checked })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer Notes & Return Policy */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Footer Notes & Policies
              </h2>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Thank You / Footer Note
                </label>
                <input
                  type="text"
                  value={config.footerMessage || ''}
                  onChange={(e) => setConfig({ ...config, footerMessage: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                  placeholder="Thank you for your business!"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Return & Exchange Policy
                </label>
                <input
                  type="text"
                  value={config.returnPolicy || ''}
                  onChange={(e) => setConfig({ ...config, returnPolicy: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                  placeholder="Exchange within 7 days with original receipt"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration as Default</span>
              </button>
            </div>
          </div>

          {/* Live Preview Column (Right) */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-20">
            {/* Live Actions Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Sale:</span>
                <select
                  value={selectedSale?.id || 'sample'}
                  onChange={(e) => {
                    if (e.target.value === 'sample') {
                      setSelectedSale(null);
                    } else {
                      const s = sales.find((item) => item.id === e.target.value);
                      if (s) setSelectedSale(s);
                    }
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium"
                >
                  <option value="sample">✨ Sample Preview Sale (Sarah Nalubega)</option>
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.saleNumber} - {s.customerName || 'Walk-in'} ({currency} {s.total.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Print Receipt"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 hover:bg-blue-200 text-blue-700 dark:text-blue-300 transition cursor-pointer"
                  title="Copy Receipt Text"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Live Render Container with Printable ID */}
            <div
              id="printable-receipt"
              className="printable-document bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-center items-center overflow-x-auto min-h-[460px]"
            >
              <ReceiptTemplateRenderer
                sale={activeSale}
                config={config}
                business={business}
                qrDataUrl={qrDataUrl}
                onVerifyClick={() => setShowVerificationModal(true)}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Receipt History */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by receipt #, customer name or phone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid Only</option>
                <option value="partial">Partial Payment</option>
                <option value="pending">Pending Credit</option>
              </select>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <Receipt className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Receipts Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Completed checkout sales will automatically appear here with full reprint capabilities.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {sale.saleNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {sale.customerName || 'Walk-in Customer'}
                          </span>
                          {sale.customerPhone && (
                            <span className="text-[10px] text-slate-400">{sale.customerPhone}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {sale.items.length} item{sale.items.length === 1 ? '' : 's'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-medium text-slate-700 dark:text-slate-300 block">
                            {sale.paymentMethod.replace('_', ' ')}
                          </span>
                          <span
                            className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              sale.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                          {currency} {sale.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSale(sale);
                              setActiveTab('studio');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            Open in Studio
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      <ReceiptVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        sale={activeSale}
        business={business}
      />
    </div>
  );
};
