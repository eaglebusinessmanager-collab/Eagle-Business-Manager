import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Printer,
  History,
  Lock,
  Unlock,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Smartphone,
  CreditCard,
  Building2,
  Receipt,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { CashRegisterSession, Sale, Expense } from '../../types';

export const CashRegisterPage: React.FC = () => {
  const { business, user } = useAuth();
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [openingFloatInput, setOpeningFloatInput] = useState<number>(50000);
  const [salesToday, setSalesToday] = useState<Sale[]>([]);
  const [expensesToday, setExpensesToday] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Denomination counts for Ugandan Shillings
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0,
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
  });

  const [closingNotes, setClosingNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<CashRegisterSession[]>([]);

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [sales, expenses] = await Promise.all([
        dbService.getSales(business.id),
        dbService.getExpenses(business.id),
      ]);

      // Filter today's sales and expenses
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
      const todayExpenses = expenses.filter((e) => e.date.startsWith(todayStr));

      setSalesToday(todaySales);
      setExpensesToday(todayExpenses);

      // Load active or stored register session from localStorage
      const savedSession = localStorage.getItem(`eagle_register_${business.id}`);
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      }

      // Load history
      const hist = localStorage.getItem(`eagle_register_history_${business.id}`);
      if (hist) {
        setPastSessions(JSON.parse(hist));
      }
    } catch (e) {
      console.error('Error loading register data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Breakdown of payment methods today
  const cashSales = salesToday
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.total, 0);

  const momoSales = salesToday
    .filter((s) => s.paymentMethod === 'momo')
    .reduce((acc, s) => acc + s.total, 0);

  const airtelSales = salesToday
    .filter((s) => s.paymentMethod === 'airtel_money')
    .reduce((acc, s) => acc + s.total, 0);

  const cardSales = salesToday
    .filter((s) => s.paymentMethod === 'card' || s.paymentMethod === 'bank')
    .reduce((acc, s) => acc + s.total, 0);

  const cashExpenses = expensesToday
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const openingFloat = session?.openingFloat || 0;
  const expectedCashInDrawer = openingFloat + cashSales - cashExpenses;

  // Calculate actual physical cash counted
  const countedPhysicalCash = Object.entries(denominations).reduce(
    (acc, [denom, count]) => acc + Number(denom) * Number(count || 0),
    0
  );

  const cashVariance = countedPhysicalCash - expectedCashInDrawer;

  const handleOpenRegister = () => {
    if (!business || !user) return;
    const newSession: CashRegisterSession = {
      id: `reg-${Date.now()}`,
      businessId: business.id,
      openedAt: new Date().toISOString(),
      openedBy: user.id,
      openedByName: user.fullName || 'Cashier',
      openingFloat: openingFloatInput,
      cashSales: 0,
      momoSales: 0,
      airtelSales: 0,
      cardSales: 0,
      cashExpenses: 0,
      expectedCash: openingFloatInput,
      status: 'open',
    };

    setSession(newSession);
    localStorage.setItem(`eagle_register_${business.id}`, JSON.stringify(newSession));
  };

  const handleCloseRegister = () => {
    if (!session || !business || !user) return;
    if (!window.confirm('Are you sure you want to finalize and close today’s cash register?')) return;

    const closedSession: CashRegisterSession = {
      ...session,
      closedAt: new Date().toISOString(),
      closedBy: user.id,
      closedByName: user.fullName || 'Cashier',
      cashSales,
      momoSales,
      airtelSales,
      cardSales,
      cashExpenses,
      expectedCash: expectedCashInDrawer,
      actualCashCounted: countedPhysicalCash,
      cashVariance,
      notes: closingNotes,
      status: 'closed',
      denominations,
    };

    // Save to history
    const existingHist = pastSessions;
    const updatedHist = [closedSession, ...existingHist];
    setPastSessions(updatedHist);
    localStorage.setItem(`eagle_register_history_${business.id}`, JSON.stringify(updatedHist));

    // Clear active session
    setSession(null);
    localStorage.removeItem(`eagle_register_${business.id}`);
    alert('Daily business cash closing (Z-Report) finalized and saved to records.');
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            <span>Cash Register & Daily Closing (Z-Report)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Balance physical cash in drawer, reconcile MTN MoMo, Airtel Money, and card transactions at the end of the business day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <History className="h-4 w-4 text-blue-600" />
            <span>{showHistory ? 'Active Register' : 'Closing History'}</span>
          </button>
        </div>
      </div>

      {showHistory ? (
        /* History of Past Z-Reports */
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Past Daily Closing Records</h3>
          {pastSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No past closing records found.</p>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Closed on {new Date(s.closedAt || s.openedAt).toLocaleDateString()} at{' '}
                      {new Date(s.closedAt || s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        (s.cashVariance || 0) === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : (s.cashVariance || 0) > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Variance: {(s.cashVariance || 0) >= 0 ? '+' : ''}
                      UGX {(s.cashVariance || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-600 dark:text-slate-400">
                    <div>Opening Float: UGX {s.openingFloat.toLocaleString()}</div>
                    <div>Cash Sales: UGX {s.cashSales.toLocaleString()}</div>
                    <div>Mobile Money: UGX {(s.momoSales + s.airtelSales).toLocaleString()}</div>
                    <div>Expected Cash: UGX {s.expectedCash.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !session ? (
        /* Register is currently closed - Prompt to Open Register */
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-lg mx-auto text-center space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 inline-block">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              The Cash Drawer is Currently Closed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Start today's business session by entering the morning opening cash float in the drawer.
            </p>
          </div>

          <div className="text-left max-w-xs mx-auto text-xs space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Opening Cash Float (UGX)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">UGX</span>
              <input
                type="number"
                min="0"
                step="5000"
                value={openingFloatInput}
                onChange={(e) => setOpeningFloatInput(Number(e.target.value))}
                className="w-full pl-13 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleOpenRegister}
            className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            <Unlock className="h-4 w-4" />
            <span>Open Drawer & Begin Business</span>
          </button>
        </div>
      ) : (
        /* Active Register Session - Real-Time Dashboard & Closing Table */
        <div className="space-y-5">
          {/* Status Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Opening Float</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
                UGX {openingFloat.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-600">Cash Sales Today</span>
              <p className="text-lg font-black text-emerald-600 mt-1 font-mono">
                UGX {cashSales.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600">Mobile Money (MoMo/Airtel)</span>
              <p className="text-lg font-black text-blue-600 mt-1 font-mono">
                UGX {(momoSales + airtelSales).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-rose-600">Cash Out / Expenses</span>
              <p className="text-lg font-black text-rose-600 mt-1 font-mono">
                UGX {cashExpenses.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Physical Cash Counting Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span>Physical Cash Drawer Count (End of Day)</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Counted: UGX {countedPhysicalCash.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
                {Object.keys(denominations).map((denom) => (
                  <div
                    key={denom}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                      UGX {Number(denom).toLocaleString()} ×
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom] || ''}
                      placeholder="0"
                      onChange={(e) =>
                        setDenominations({
                          ...denominations,
                          [denom]: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-right font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cashier Closing Notes
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Optional closing observations, petty cash notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Reconciliation Z-Report Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold">
                    DAILY CLOSING Z-REPORT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                    DRAWER OPEN
                  </span>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Opening Float:</span>
                    <span className="font-mono font-bold">UGX {openingFloat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Cash Sales Today:</span>
                    <span className="font-mono font-bold text-emerald-400">+ UGX {cashSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Cash Expenses Out:</span>
                    <span className="font-mono font-bold text-rose-400">- UGX {cashExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10 text-sm font-bold">
                    <span className="text-slate-200">Expected Physical Cash:</span>
                    <span className="font-mono text-white">UGX {expectedCashInDrawer.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10 text-sm font-bold">
                    <span className="text-slate-200">Actual Counted Cash:</span>
                    <span className="font-mono text-amber-300">UGX {countedPhysicalCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-extrabold">
                    <span>Cash Variance:</span>
                    <span
                      className={`font-mono ${
                        cashVariance === 0
                          ? 'text-emerald-400'
                          : cashVariance > 0
                          ? 'text-blue-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {cashVariance >= 0 ? '+' : ''}UGX {cashVariance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <button
                  onClick={handleCloseRegister}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>Finalize & Close Business Day</span>
                </button>

                <button
                  onClick={handlePrintZReport}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Daily Z-Report Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
