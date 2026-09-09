import React from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  ShoppingBag,
  Calendar,
  CreditCard,
  MessageCircle,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
} from 'lucide-react';
import { Customer, Sale, Invoice } from '../../types';
import { getWhatsAppUrl, getTelUrl } from '../../utils/phone';

interface RecipientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  sales: Sale[];
  invoices: Invoice[];
  currency?: string;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const RecipientProfileModal: React.FC<RecipientProfileModalProps> = ({
  isOpen,
  onClose,
  customer,
  sales,
  invoices,
  currency = 'UGX',
  onEdit,
  onDelete,
}) => {
  if (!isOpen) return null;

  // Filter sales and invoices for this customer
  const customerSales = sales
    .filter((s) => s.customerId === customer.id || s.customerName?.toLowerCase() === customer.name.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const customerInvoices = invoices
    .filter((i) => i.customerId === customer.id || i.customerName?.toLowerCase() === customer.name.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Metrics calculation
  const totalPurchases = customerSales.reduce((sum, s) => sum + s.total, 0);

  // Outstanding balance (unpaid sales + unpaid/pending invoices not tied to sales)
  const unpaidSales = customerSales
    .filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'partial' || s.paymentStatus === 'overdue')
    .reduce((sum, s) => sum + s.total, 0);

  const unpaidInvoices = customerInvoices
    .filter((i) => (i.paymentStatus === 'pending' || i.paymentStatus === 'partial' || i.paymentStatus === 'overdue') && !i.saleId)
    .reduce((sum, i) => sum + i.total, 0);

  const outstandingBalance = unpaidSales + unpaidInvoices;

  const lastPurchaseDate = customerSales.length > 0 ? customerSales[0].createdAt : null;

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const whatsAppUrl = getWhatsAppUrl(
    customer.phone,
    `Hello ${customer.name}, greeting from our store regarding your account and orders.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-blue-500/20">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {customer.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                  {customer.type || 'Regular'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recipient Profile & Transaction History
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

        {/* Quick Action Contact Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>
          <a
            href={getTelUrl(customer.phone)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
          >
            <Phone className="h-4 w-4" />
            <span>Call Phone</span>
          </a>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(customer);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(customer);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>

        {/* Contact & Bio Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="font-mono font-bold">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Notes & Preferences
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
              {customer.notes || 'No custom delivery or billing notes recorded for this recipient.'}
            </p>
          </div>
        </div>

        {/* Financial Overview Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 text-center">
          <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Purchases
            </span>
            <span className="font-mono font-extrabold text-sm sm:text-base text-blue-600 dark:text-blue-400 mt-0.5 block">
              {formatCurrency(totalPurchases)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {customerSales.length} Completed Orders
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${
            outstandingBalance > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
          }`}>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <span className={`font-mono font-extrabold text-sm sm:text-base mt-0.5 block ${
              outstandingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(outstandingBalance)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {outstandingBalance > 0 ? 'Payment pending' : 'Zero balance'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Last Purchase
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {lastPurchaseDate ? new Date(lastPurchaseDate).toLocaleDateString() : 'None yet'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Registered {new Date(customer.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Purchase History */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
              <span>Purchase History ({customerSales.length})</span>
            </h3>
          </div>

          {customerSales.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No sales transactions recorded for this recipient yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {customerSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {sale.saleNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white block">
                      {formatCurrency(sale.total)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices History if any */}
        {customerInvoices.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Invoices Issued ({customerInvoices.length})</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              {customerInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(inv.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
