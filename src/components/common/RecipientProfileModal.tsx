import React, { useState } from 'react';
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
  DollarSign,
} from 'lucide-react';
import { Customer, Sale, Invoice } from '../../types';
import { dbService } from '../../services/db';
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
  onPaymentRecorded?: () => void;
}

export const RecipientProfileModal: React.FC<RecipientProfileModalProps> = ({
  isOpen,
  onClose,
  customer,
  sales: initialSales,
  invoices,
  currency = 'UGX',
  onEdit,
  onDelete,
  onPaymentRecorded,
}) => {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'mtn_momo' | 'airtel_money' | 'bank_transfer'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

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

  // Outstanding balance (unpaid sales: total - amountPaid)
  const unpaidSales = customerSales
    .filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'partial' || s.paymentStatus === 'overdue')
    .reduce((sum, s) => sum + (s.total - (s.amountPaid || 0)), 0);

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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForPayment || payAmount <= 0) return;

    const updated = await dbService.recordSalePayment(selectedSaleForPayment.id, {
      amount: payAmount,
      paymentMethod: payMethod,
      notes: payNotes || 'Customer account settlement',
      receivedBy: 'Cashier',
    });

    if (updated) {
      setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }

    setSelectedSaleForPayment(null);
    setPayAmount(0);
    setPayNotes('');
    if (onPaymentRecorded) onPaymentRecorded();
  };

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
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {customerSales.map((sale) => {
                const isUnpaid = sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial';
                const bal = sale.total - (sale.amountPaid || 0);
                const hasRecords = sale.paymentRecords && sale.paymentRecords.length > 0;
                const isTimelineOpen = expandedSaleId === sale.id;

                return (
                  <div
                    key={sale.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {sale.saleNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {sale.paymentStatus === 'partial' ? `Partial (Bal: ${formatCurrency(bal)})` : sale.paymentStatus}
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

                    {/* Unpaid / Partial actions */}
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                      {hasRecords ? (
                        <button
                          type="button"
                          onClick={() => setExpandedSaleId(isTimelineOpen ? null : sale.id)}
                          className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="h-3 w-3" />
                          <span>{sale.paymentRecords!.length} installment(s) paid</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Paid: {formatCurrency(sale.amountPaid || 0)}</span>
                      )}

                      {isUnpaid && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSaleForPayment(sale);
                            setPayAmount(bal);
                            setPayNotes('');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          <DollarSign className="h-3 w-3" />
                          <span>Record Payment (Bal: {formatCurrency(bal)})</span>
                        </button>
                      )}
                    </div>

                    {/* Installments timeline if expanded */}
                    {isTimelineOpen && hasRecords && (
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] space-y-1">
                        <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Payment Timeline
                        </div>
                        {sale.paymentRecords!.map((rec) => (
                          <div key={rec.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(rec.amount)} ({rec.paymentMethod})
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(rec.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inline Record Payment Form */}
        {selectedSaleForPayment && (
          <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 dark:text-white">
                Record Payment for #{selectedSaleForPayment.saleNumber}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSaleForPayment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Amount (UGX)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedSaleForPayment.total - (selectedSaleForPayment.amountPaid || 0)}
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="cash">Cash in Drawer</option>
                    <option value="mtn_momo">MTN Mobile Money</option>
                    <option value="airtel_money">Airtel Money</option>
                    <option value="bank_transfer">Bank Deposit</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleForPayment(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payAmount <= 0}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        )}

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
