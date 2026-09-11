import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Download,
  MessageCircle,
  Copy,
  Receipt,
  Palette,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Sale, ReceiptCustomizationConfig, ReceiptTemplateId, Business } from '../../types';
import { ReceiptTemplateRenderer } from './ReceiptTemplates';
import { ReceiptVerificationModal } from './ReceiptVerificationModal';
import { dbService } from '../../services/db';
import { getWhatsAppUrl } from '../../utils/phone';

interface ReceiptStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  business?: Business | null;
}

export const ReceiptStudioModal: React.FC<ReceiptStudioModalProps> = ({
  isOpen,
  onClose,
  sale,
  business,
}) => {
  const [config, setConfig] = useState<ReceiptCustomizationConfig>({
    businessId: business?.id || '',
    businessName: business?.name || 'Eagle Business',
    tagline: 'Quality Products & Dependable Service',
    phone: business?.phone || '',
    whatsapp: business?.phone || '',
    address: business?.address || '',
    footerMessage: business?.receiptFooter || 'Thank you for your business!',
    returnPolicy: 'Exchange allowed within 7 days with original receipt.',
    currency: business?.currency || 'UGX',
    template: 'modern',
    showLogo: true,
    showTagline: true,
    showCustomerName: true,
    showCustomerPhone: true,
    showStaffName: true,
    showSku: true,
    showDiscount: true,
    showTaxNumber: false,
    showPaymentMethod: true,
    showQrVerification: true,
    showReturnPolicy: true,
    accentColor: '#2563eb',
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !business?.id) return;
    dbService.getReceiptConfig(business.id).then((saved) => {
      if (saved) setConfig((prev) => ({ ...prev, ...saved }));
    });
  }, [isOpen, business?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const verificationPayload = JSON.stringify({
      v: 'EBM-V1',
      id: sale.saleNumber,
      biz: config.businessName || business?.name || 'Eagle Business',
      tot: sale.total,
      dt: sale.createdAt,
      st: sale.paymentStatus,
    });

    QRCode.toDataURL(verificationPayload, {
      width: 180,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR error:', err));
  }, [isOpen, sale, config.businessName, business?.name]);

  if (!isOpen) return null;

  const currency = config.currency || business?.currency || 'UGX';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const lines = sale.items
      .map((it) => `• ${it.productName} (x${it.quantity}) - ${currency} ${(it.total || it.subtotal).toLocaleString()}`)
      .join('\n');

    const message = `🧾 *OFFICIAL SALES RECEIPT*\n*${config.businessName || business?.name || 'Eagle Business'}*\n------------------------------\n*Receipt #:* ${sale.saleNumber}\n*Date:* ${new Date(sale.createdAt).toLocaleDateString()}\n*Customer:* ${sale.customerName || 'Valued Client'}\n\n*ITEMS:*\n${lines}\n------------------------------\n*Subtotal:* ${currency} ${sale.subtotal.toLocaleString()}\n${sale.discount > 0 ? `*Discount:* -${currency} ${sale.discount.toLocaleString()}\n` : ''}*TOTAL:* ${currency} ${sale.total.toLocaleString()}\n*Payment:* ${sale.paymentMethod.toUpperCase()} (${sale.paymentStatus.toUpperCase()})\n\n${config.footerMessage || 'Thank you for your business!'}\n*Verified via Eagle Business Manager*`;

    const targetPhone = sale.customerPhone || config.whatsapp || config.phone || '';
    const url = getWhatsAppUrl(targetPhone, message);
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const lines = sale.items
      .map((it) => `${it.productName} x${it.quantity}: ${currency} ${(it.total || it.subtotal).toLocaleString()}`)
      .join('\n');

    const text = `${config.businessName || business?.name || 'Eagle Business'}\nReceipt #: ${sale.saleNumber}\nDate: ${new Date(sale.createdAt).toLocaleString()}\nCustomer: ${sale.customerName || 'Walk-in'}\n\nItems:\n${lines}\nTotal: ${currency} ${sale.total.toLocaleString()}\nPaid: ${sale.paymentMethod}\nStatus: ${sale.paymentStatus}\n${config.footerMessage || ''}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const templateOptions: { id: ReceiptTemplateId; name: string }[] = [
    { id: 'modern', name: 'Modern SaaS' },
    { id: 'classic', name: 'Classic POS' },
    { id: 'elegant', name: 'Luxury Elegant' },
    { id: 'thermal_58', name: 'Thermal 58mm' },
    { id: 'thermal_80', name: 'Thermal 80mm' },
    { id: 'corporate', name: 'Corporate A4' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Receipt Studio — #{sale.saleNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live multi-template preview, branding, instant print, and WhatsApp sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Template Switcher & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0 text-xs">
          {/* Template pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" /> Template:
            </span>
            {templateOptions.map((tpl) => {
              const active = (config.template || 'modern') === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setConfig({ ...config, template: tpl.id })}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {tpl.name}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer shadow-xs"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center items-start">
          <div id="printable-receipt" className="printable-document w-full">
            <ReceiptTemplateRenderer
              sale={sale}
              config={config}
              business={business}
              qrDataUrl={qrDataUrl}
              onVerifyClick={() => setShowVerificationModal(true)}
            />
          </div>
        </div>
      </div>

      <ReceiptVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        sale={sale}
        business={business}
      />
    </div>
  );
};
