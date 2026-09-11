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
  const { business } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');
  const [filterAging, setFilterAging] = useState<'all' | 'current' | 'overdue'>('all');
  const [loading, setLoading] = useState(true);

  // Payment Recording Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'airtel_money' | 'bank'>('cash');

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

  const totalReceivables = unpaidSales.reduce((acc, s) => {
    const paid = s.amountPaid || 0;
    return acc + (s.total - paid);
  }, 0);

  // Supplier payables calculation
  const totalPayables = suppliers.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

  const handleSendWhatsAppReminder = (sale: Sale) => {
    const balance = sale.total - (sale.amountPaid || 0);
    const customer = customers.find((c) => c.id === sale.customerId || c.name === sale.customerName);
    const phone = (customer?.phone || '').replace(/[^0-9]/g, '');

    const message = `Hello ${sale.customerName || 'Valued Customer'}, greetings from ${
      business?.name || 'our store'
    }. This is a friendly reminder regarding your pending invoice #${sale.saleNumber} with an outstanding balance of UGX ${balance.toLocaleString()}. Kindly arrange payment via MTN/Airtel Money or cash at your convenience. Thank you!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !business) return;

    const currentPaid = selectedSale.amountPaid || 0;
    const newPaid = currentPaid + paymentAmount;
    const isFullyPaid = newPaid >= selectedSale.total;

    await dbService.updateSalePaymentStatus(
      selectedSale.id,
      isFullyPaid ? 'paid' : 'partial',
      newPaid
    );

    setSelectedSale(null);
    setPaymentAmount(0);
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
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Outstanding Customer Balances
            </h3>
            <span className="text-xs font-mono text-slate-400">{unpaidSales.length} Records</span>
          </div>

          {unpaidSales.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">All customer accounts are clear!</p>
              <p className="text-xs mt-0.5">No pending customer debts or credit sales at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {unpaidSales.map((sale) => {
                const paid = sale.amountPaid || 0;
                const balance = sale.total - paid;
                return (
                  <div
                    key={sale.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {sale.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold">
                          Pending: UGX {balance.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Sale #{sale.saleNumber} • Total: UGX {sale.total.toLocaleString()} • Paid: UGX {paid.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Date: {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Record Payment</span>
                      </button>
                    </div>
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
                <label className="block font-semibold mb-1">Payment Amount (UGX)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedSale.total - (selectedSale.amountPaid || 0)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="cash">Cash in Drawer</option>
                  <option value="momo">MTN Mobile Money</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="bank">Bank Deposit</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 rounded-xl border font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
