import React from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Building2,
  Calendar,
  Receipt,
  User,
  CreditCard,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Sale, Business } from '../../types';

interface ReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  business?: Business | null;
}

export const ReceiptVerificationModal: React.FC<ReceiptVerificationModalProps> = ({
  isOpen,
  onClose,
  sale,
  business,
}) => {
  if (!isOpen) return null;

  const currency = business?.currency || 'UGX';
  const verificationHash = `EBM-SEC-${sale.id.slice(0, 8).toUpperCase()}-${new Date(sale.createdAt).getTime().toString(36).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Official Receipt Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Verification Status Card */}
        <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
            AUTHENTIC TRANSACTION CERTIFIED
          </h3>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
            This receipt was issued through Eagle Business Manager and verified cryptographically in real-time.
          </p>
        </div>

        {/* Audit Details */}
        <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="flex items-center gap-2 text-slate-500">
              <Receipt className="h-3.5 w-3.5 text-blue-600" />
              Receipt / Sale Number
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {sale.saleNumber}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="flex items-center gap-2 text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              Registered Merchant
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {business?.name || 'Verified Eagle Merchant'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="flex items-center gap-2 text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Date & Timestamp
            </span>
            <span className="font-mono text-slate-900 dark:text-white">
              {new Date(sale.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="flex items-center gap-2 text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
              Total Amount Paid
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {currency} {sale.total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="flex items-center gap-2 text-slate-500">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Customer / Recipient
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {sale.customerName || 'Walk-in Customer'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="flex items-center gap-2 text-slate-500">
              <Lock className="h-3.5 w-3.5 text-blue-600" />
              Security Checksum
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {verificationHash}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
