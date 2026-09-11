import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  UserCheck,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
  DollarSign,
  Plus,
  CheckCircle2,
  Calendar,
  Send,
  Building2,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Sale, Customer, Supplier } from '../../types';

export const CreditDebtsPage: React.FC = () => {
  const { business, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');
  const [filterStatus, setFilterStatus] = useState<'all' | 'partial' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Payment Recording Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mtn_momo' | 'airtel_money' | 'bank_transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [salesList, custList, suppList] = await Promise.all([
        dbService.getSales(business.id),
        dbService.getCustomers(business.id),
        dbService.getSuppliers(business.id),
      ]);
      setSales(salesList);
      setCustomers(custList);
      setSuppliers(suppList);
    } catch (e) {
      console.error('Error loading debt data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Debt calculation for customers (sales where paymentStatus is 'pending' or 'partial')
  const unpaidSales = sales.filter(
    (s) => s.paymentStatus === 'pending' || s.paymentStatus === 'partial'
  );

  const filteredUnpaidSales = unpaidSales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.includes(q)) ||
      s.saleNumber.toLowerCase().includes(q);

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'partial' && s.paymentStatus === 'partial') ||
      (filterStatus === 'pending' && s.paymentStatus === 'pending');

    return matchQuery && matchStatus;
  });

  const totalReceivables = unpaidSales.reduce((acc, s) => {
    const paid = s.amountPaid || 0;
    return acc + (s.total - paid);
  }, 0);

  // Supplier payables calculation
  const totalPayables = suppliers.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

  const handleSendWhatsAppReminder = (sale: Sale) => {
    const balance = sale.total - (sale.amountPaid || 0);
    const customer = customers.find((c) => c.id === sale.customerId || c.name === sale.customerName);
    const phone = (customer?.phone || sale.customerPhone || '').replace(/[^0-9]/g, '');

    const message = `Hello ${sale.customerName || 'Valued Customer'}, greetings from ${
      business?.name || 'our store'
    }. This is a friendly reminder regarding your pending invoice #${sale.saleNumber} with an outstanding balance of UGX ${balance.toLocaleString()}. Kindly arrange payment via MTN/Airtel Money or cash at your convenience. Thank you!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !business || paymentAmount <= 0) return;

    await dbService.recordSalePayment(selectedSale.id, {
      amount: paymentAmount,
      paymentMethod,
      notes: paymentNotes || 'Credit installment payment',
      receivedBy: user?.name || user?.fullName || 'Cashier',
    });

    setSelectedSale(null);
    setPaymentAmount(0);
    setPaymentNotes('');
    await loadData();
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span>Credit & Debt Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer debts, aging credit, automated WhatsApp reminders, and wholesale supplier balances.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'receivables'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Customer Debts (Owed to You)</span>
          </button>
          <button
            onClick={() => setActiveTab('payables')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'payables'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Supplier Debts (You Owe)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Customer Credit</span>
          <p className="text-xl font-black text-rose-600 mt-1 font-mono">
            UGX {totalReceivables.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{unpaidSales.length} open customer balances</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Supplier Payables</span>
          <p className="text-xl font-black text-amber-600 mt-1 font-mono">
            UGX {totalPayables.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Wholesale restock credit</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Net Receivables</span>
          <p className="text-xl font-black text-blue-600 mt-1 font-mono">
            UGX {(totalReceivables - totalPayables).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Net cash pending collection</p>
        </div>
      </div>

      {/* RECEIVABLES TAB */}
      {activeTab === 'receivables' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Outstanding Customer Balances & Credit Sales
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track credit balances, partial installments, and send payment collection reminders.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredUnpaidSales.length} Debts
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search debtor name, phone, or invoice #..."
                className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {[
                { label: 'All Debts', value: 'all' },
                { label: 'Partial Paid', value: 'partial' },
                { label: 'Unpaid / Pending', value: 'pending' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilterStatus(tab.value as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    filterStatus === tab.value
                      ? 'bg-purple-600 text-white shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredUnpaidSales.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">All customer accounts are clear!</p>
              <p className="text-xs mt-0.5">No pending customer debts or credit sales matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUnpaidSales.map((sale) => {
                const paid = sale.amountPaid || 0;
                const balance = sale.total - paid;
                const isExpanded = expandedSaleId === sale.id;
                const paymentRecords = sale.paymentRecords || [];

                return (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {sale.customerName || 'Walk-in Customer'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold">
                            Balance Due: UGX {balance.toLocaleString()}
                          </span>
                          {sale.paymentStatus === 'partial' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                              Partial Paid
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Invoice #{sale.saleNumber} • Total: UGX {sale.total.toLocaleString()} • Paid so far: UGX {paid.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Issued: {new Date(sale.createdAt).toLocaleDateString()}
                          {sale.customerPhone && ` • Tel: ${sale.customerPhone}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {paymentRecords.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <Clock className="h-3 w-3 text-purple-600" />
                            <span>{paymentRecords.length} Installment{paymentRecords.length > 1 ? 's' : ''}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleSendWhatsAppReminder(sale)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>WhatsApp Reminder</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setPaymentAmount(balance);
                            setPaymentNotes('');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Record Payment</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Payment History Logs */}
                    {isExpanded && paymentRecords.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Payment History & Installments Log</span>
                        </span>
                        <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                          {paymentRecords.map((rec) => (
                            <div key={rec.id} className="py-1.5 flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  UGX {rec.amount.toLocaleString()}
                                </span>
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-semibold uppercase text-slate-600 dark:text-slate-300">
                                  {String(rec.paymentMethod).replace('_', ' ')}
                                </span>
                                {rec.notes && (
                                  <span className="ml-2 text-[11px] text-slate-500 italic">
                                    "{rec.notes}"
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(rec.date).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PAYABLES TAB */}
      {activeTab === 'payables' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Supplier Accounts & Wholesale Debts
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {suppliers.map((supp) => (
              <div
                key={supp.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{supp.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{supp.category} • {supp.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-amber-600">
                    Due: UGX {(supp.balanceDue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Record Debt Repayment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Customer: {selectedSale.customerName} (Invoice #{selectedSale.saleNumber})
            </p>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Payment Amount (UGX) *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Max: {(selectedSale.total - (selectedSale.amountPaid || 0)).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedSale.total - (selectedSale.amountPaid || 0)}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="Enter amount paid"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-slate-900 dark:text-white"
                />

                {/* Preset quick buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedSale.total - (selectedSale.amountPaid || 0))}
                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                  >
                    Full Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round((selectedSale.total - (selectedSale.amountPaid || 0)) * 0.5))}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round((selectedSale.total - (selectedSale.amountPaid || 0)) * 0.25))}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    25%
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="cash">💵 Cash in Drawer / Till</option>
                  <option value="mtn_momo">📱 MTN Mobile Money</option>
                  <option value="airtel_money">📱 Airtel Money</option>
                  <option value="bank_transfer">🏦 Bank Deposit / Wire</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Transaction Reference
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. MTN MoMo Ref: 19830291, or paid at counter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
