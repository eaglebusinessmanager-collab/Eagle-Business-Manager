import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  Plus,
  Calendar,
  Filter,
  Search,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  FileText,
  HelpCircle,
  RefreshCw,
  Scale,
  Trash2,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import {
  Sale,
  Expense,
  ExpenseCategory,
  PaymentMethod,
  FinanceReconciliationRecord,
  Product,
} from '../../types';

export const FinanceCashflowPage: React.FC<{ onNavigate?: (view: string) => void }> = ({
  onNavigate,
}) => {
  const { business, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reconciliations, setReconciliations] = useState<FinanceReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'reconciliation' | 'statements'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'this_week' | 'this_month' | 'all'>('this_month');

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('utilities');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('cash');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Expense filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string>('all');
  const [selectedExpenseMethod, setSelectedExpenseMethod] = useState<string>('all');

  // Reconciliation state
  const [reconChannel, setReconChannel] = useState<'cash' | 'mtn_momo' | 'airtel_money' | 'bank_transfer'>('cash');
  const [actualCountedInput, setActualCountedInput] = useState<number>(0);
  const [reconNotes, setReconNotes] = useState<string>('');
  const [openingFloat, setOpeningFloat] = useState<number>(() => {
    const saved = localStorage.getItem(`eagle_float_${business?.id || 'default'}`);
    return saved ? Number(saved) : 50000;
  });
  const [reconSuccess, setReconSuccess] = useState(false);

  // Cash Denominations
  const [useDenominations, setUseDenominations] = useState(false);
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

  const currency = business?.currency || 'UGX';

  const loadData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [salesList, expenseList, productList, reconList] = await Promise.all([
        dbService.getSales(business.id),
        dbService.getExpenses(business.id),
        dbService.getProducts(business.id),
        dbService.getReconciliations(business.id),
      ]);
      setSales(salesList);
      setExpenses(expenseList);
      setProducts(productList);
      setReconciliations(reconList);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Update actualCountedInput when denominations change
  useEffect(() => {
    if (useDenominations && reconChannel === 'cash') {
      const total = Object.entries(denominations).reduce(
        (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
        0
      );
      setActualCountedInput(total);
    }
  }, [denominations, useDenominations, reconChannel]);

  // Filter by selected Time Range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      if (timeRange === 'today') {
        return s.createdAt.startsWith(todayStr);
      }
      if (timeRange === 'this_week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (timeRange === 'this_month') {
        const monthStr = now.toISOString().slice(0, 7);
        return s.createdAt.startsWith(monthStr);
      }
      return true;
    });
  }, [sales, timeRange]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      if (timeRange === 'today') {
        return e.date.startsWith(todayStr);
      }
      if (timeRange === 'this_week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return expDate >= weekAgo;
      }
      if (timeRange === 'this_month') {
        const monthStr = now.toISOString().slice(0, 7);
        return e.date.startsWith(monthStr);
      }
      return true;
    });
  }, [expenses, timeRange]);

  // Calculate Income, COGS, Gross Profit, Expenses, Net Profit
  const totalIncome = filteredSales.reduce((sum, s) => {
    // Only count payments actually collected
    const collected = s.paymentStatus === 'paid' ? s.total : (s.amountPaid || 0);
    return sum + collected;
  }, 0);

  // Estimate COGS from product costPrice
  const totalCOGS = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      let saleCost = 0;
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
        const unitCost = prod?.costPrice || (item.unitPrice * 0.7); // 70% fallback if cost not set
        saleCost += unitCost * item.quantity;
      });
      return acc + saleCost;
    }, 0);
  }, [filteredSales, products]);

  const grossProfit = totalIncome - totalCOGS;
  const totalOverheadExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOverheadExpenses;
  const netProfitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Multi-Channel Breakdown (All time or period)
  const channelBreakdown = useMemo(() => {
    const channels = {
      cash: { name: 'Cash in Drawer / Till', income: 0, expense: 0, balance: 0, icon: Banknote, color: 'emerald' },
      mtn_momo: { name: 'MTN Mobile Money', income: 0, expense: 0, balance: 0, icon: Smartphone, color: 'amber' },
      airtel_money: { name: 'Airtel Money', income: 0, expense: 0, balance: 0, icon: Smartphone, color: 'rose' },
      bank_transfer: { name: 'Commercial Bank Account', income: 0, expense: 0, balance: 0, icon: Building2, color: 'blue' },
    };

    // Sales and Partial Payments Inflows
    sales.forEach((s) => {
      // Check payment records
      if (s.paymentRecords && s.paymentRecords.length > 0) {
        s.paymentRecords.forEach((rec) => {
          const m = rec.paymentMethod;
          if (m === 'cash') channels.cash.income += rec.amount;
          else if (m === 'mtn_momo' || m === 'momo' || m === 'mobile_money') channels.mtn_momo.income += rec.amount;
          else if (m === 'airtel_money') channels.airtel_money.income += rec.amount;
          else if (m === 'bank_transfer' || m === 'bank') channels.bank_transfer.income += rec.amount;
          else channels.cash.income += rec.amount;
        });
      } else {
        const collected = s.paymentStatus === 'paid' ? s.total : (s.amountPaid || 0);
        const m = s.paymentMethod;
        if (m === 'cash') channels.cash.income += collected;
        else if (m === 'mtn_momo' || m === 'momo' || m === 'mobile_money') channels.mtn_momo.income += collected;
        else if (m === 'airtel_money') channels.airtel_money.income += collected;
        else if (m === 'bank_transfer' || m === 'bank') channels.bank_transfer.income += collected;
        else channels.cash.income += collected;
      }
    });

    // Expenses Outflows
    expenses.forEach((e) => {
      const m = e.paymentMethod;
      if (m === 'cash') channels.cash.expense += e.amount;
      else if (m === 'mtn_momo' || m === 'mobile_money') channels.mtn_momo.expense += e.amount;
      else if (m === 'airtel_money') channels.airtel_money.expense += e.amount;
      else if (m === 'bank_transfer') channels.bank_transfer.expense += e.amount;
      else channels.cash.expense += e.amount;
    });

    channels.cash.balance = channels.cash.income - channels.cash.expense;
    channels.mtn_momo.balance = channels.mtn_momo.income - channels.mtn_momo.expense;
    channels.airtel_money.balance = channels.airtel_money.income - channels.airtel_money.expense;
    channels.bank_transfer.balance = channels.bank_transfer.income - channels.bank_transfer.expense;

    return channels;
  }, [sales, expenses]);

  // Reconciliation calculations for active selected channel
  const activeChannelRecon = useMemo(() => {
    let income = 0;
    let expense = 0;

    // Today's movements for channel
    const todayStr = new Date().toISOString().split('T')[0];

    sales.forEach((s) => {
      if (s.createdAt.startsWith(todayStr)) {
        if (s.paymentRecords && s.paymentRecords.length > 0) {
          s.paymentRecords.forEach((rec) => {
            const isMatch =
              (reconChannel === 'cash' && rec.paymentMethod === 'cash') ||
              (reconChannel === 'mtn_momo' && (rec.paymentMethod === 'mtn_momo' || rec.paymentMethod === 'momo' || rec.paymentMethod === 'mobile_money')) ||
              (reconChannel === 'airtel_money' && rec.paymentMethod === 'airtel_money') ||
              (reconChannel === 'bank_transfer' && (rec.paymentMethod === 'bank_transfer' || rec.paymentMethod === 'bank'));
            if (isMatch) income += rec.amount;
          });
        } else {
          const collected = s.paymentStatus === 'paid' ? s.total : (s.amountPaid || 0);
          const isMatch =
            (reconChannel === 'cash' && s.paymentMethod === 'cash') ||
            (reconChannel === 'mtn_momo' && (s.paymentMethod === 'mtn_momo' || s.paymentMethod === 'momo' || s.paymentMethod === 'mobile_money')) ||
            (reconChannel === 'airtel_money' && s.paymentMethod === 'airtel_money') ||
            (reconChannel === 'bank_transfer' && (s.paymentMethod === 'bank_transfer' || s.paymentMethod === 'bank'));
          if (isMatch) income += collected;
        }
      }
    });

    expenses.forEach((e) => {
      if (e.date.startsWith(todayStr)) {
        const isMatch =
          (reconChannel === 'cash' && e.paymentMethod === 'cash') ||
          (reconChannel === 'mtn_momo' && (e.paymentMethod === 'mtn_momo' || e.paymentMethod === 'mobile_money')) ||
          (reconChannel === 'airtel_money' && e.paymentMethod === 'airtel_money') ||
          (reconChannel === 'bank_transfer' && e.paymentMethod === 'bank_transfer');
        if (isMatch) expense += e.amount;
      }
    });

    const startFloat = reconChannel === 'cash' ? openingFloat : 0;
    const expected = startFloat + income - expense;
    const variance = actualCountedInput - expected;

    let status: 'balanced' | 'surplus' | 'shortage' = 'balanced';
    if (variance > 0) status = 'surplus';
    if (variance < 0) status = 'shortage';

    return {
      opening: startFloat,
      income,
      expense,
      expected,
      variance,
      status,
    };
  }, [reconChannel, sales, expenses, openingFloat, actualCountedInput]);

  const handleSaveReconciliation = async () => {
    if (!business) return;

    const newRecord: FinanceReconciliationRecord = {
      id: `recon-${Date.now()}`,
      businessId: business.id,
      channel: reconChannel,
      date: new Date().toISOString(),
      openingBalance: activeChannelRecon.opening,
      totalInflows: activeChannelRecon.income,
      totalOutflows: activeChannelRecon.expense,
      expectedBalance: activeChannelRecon.expected,
      actualCounted: actualCountedInput,
      variance: activeChannelRecon.variance,
      status: activeChannelRecon.status,
      reconciledBy: user?.name || user?.fullName || 'Manager',
      notes: reconNotes || 'Daily cashflow reconciliation verified',
      denominations: reconChannel === 'cash' && useDenominations ? denominations : undefined,
      createdAt: new Date().toISOString(),
    };

    await dbService.createReconciliation(newRecord);
    setReconciliations((prev) => [newRecord, ...prev]);
    setReconSuccess(true);
    setTimeout(() => setReconSuccess(false), 4000);
  };

  // Expense CRUD Handlers
  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setExpenseTitle('');
    setExpenseAmount(0);
    setExpenseCategory('utilities');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpensePaymentMethod('cash');
    setExpenseNotes('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseTitle(exp.title);
    setExpenseAmount(exp.amount);
    setExpenseCategory(exp.category);
    setExpenseDate(exp.date);
    setExpensePaymentMethod(exp.paymentMethod);
    setExpenseNotes(exp.notes || '');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !expenseTitle.trim() || expenseAmount <= 0) return;

    if (editingExpense) {
      await dbService.updateExpense(editingExpense.id, {
        title: expenseTitle,
        amount: expenseAmount,
        category: expenseCategory,
        date: expenseDate,
        paymentMethod: expensePaymentMethod,
        notes: expenseNotes,
      });
    } else {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        businessId: business.id,
        title: expenseTitle,
        amount: expenseAmount,
        category: expenseCategory,
        date: expenseDate,
        paymentMethod: expensePaymentMethod,
        notes: expenseNotes,
        createdBy: user?.name || 'Staff',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbService.createExpense(newExp);
    }

    setIsExpenseModalOpen(false);
    await loadData();
  };

  const handleDeleteExpense = async (exp: Expense) => {
    if (!user) return;
    if (window.confirm(`Delete expense "${exp.title}"?`)) {
      await dbService.deleteExpense(exp.id, { id: user.id, name: user.name });
      await loadData();
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              💰
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Finance & Cashflow
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time revenues, profit & loss, multi-channel balances (Cash, MTN MoMo, Airtel, Bank), and daily reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: '7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenCreateExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Top Level Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Total Income / Sales</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatCurrency(totalIncome)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            {filteredSales.length} Transactions Collected
          </span>
        </div>

        {/* Total Overhead Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Overhead Expenses</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
            {formatCurrency(totalOverheadExpenses)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            {filteredExpenses.length} Expense items recorded
          </span>
        </div>

        {/* Cost of Goods Sold */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Est. Cost of Goods (COGS)</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
            {formatCurrency(totalCOGS)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Gross Margin: {formatCurrency(grossProfit)}
          </span>
        </div>

        {/* Net Profit */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Net Operating Profit</span>
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              netProfit >= 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
            }`}>
              {netProfitMargin.toFixed(1)}%
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
            netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(netProfit)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            {netProfit >= 0 ? 'Profitable operation' : 'Negative operating cashflow'}
          </span>
        </div>
      </div>

      {/* Multi-Channel Liquid Accounts (Cash, MTN MoMo, Airtel Money, Bank) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Liquid Payment Channels & Account Balances
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live tracking across Cash in Drawer, MTN Mobile Money, Airtel Money, and Commercial Bank Accounts.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            Total Liquid Balance: {formatCurrency(
              channelBreakdown.cash.balance +
              channelBreakdown.mtn_momo.balance +
              channelBreakdown.airtel_money.balance +
              channelBreakdown.bank_transfer.balance
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Cash in Drawer */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Cash in Drawer / Till</span>
            </div>
            <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(channelBreakdown.cash.balance)}
            </p>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>In: {formatCurrency(channelBreakdown.cash.income)}</span>
              <span>Out: {formatCurrency(channelBreakdown.cash.expense)}</span>
            </div>
          </div>

          {/* MTN Mobile Money */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">MTN Mobile Money</span>
            </div>
            <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(channelBreakdown.mtn_momo.balance)}
            </p>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>In: {formatCurrency(channelBreakdown.mtn_momo.income)}</span>
              <span>Out: {formatCurrency(channelBreakdown.mtn_momo.expense)}</span>
            </div>
          </div>

          {/* Airtel Money */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-rose-500" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Airtel Money</span>
            </div>
            <p className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(channelBreakdown.airtel_money.balance)}
            </p>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>In: {formatCurrency(channelBreakdown.airtel_money.income)}</span>
              <span>Out: {formatCurrency(channelBreakdown.airtel_money.expense)}</span>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Bank Deposits</span>
            </div>
            <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
              {formatCurrency(channelBreakdown.bank_transfer.balance)}
            </p>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>In: {formatCurrency(channelBreakdown.bank_transfer.income)}</span>
              <span>Out: {formatCurrency(channelBreakdown.bank_transfer.expense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1">
        {[
          { id: 'overview', label: '📊 Cashflow Overview' },
          { id: 'expenses', label: '📉 Expense Records' },
          { id: 'reconciliation', label: '⚖️ Daily Reconciliation' },
          { id: 'statements', label: '📑 Financial Statements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & CASHFLOW MOVEMENT */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Unified Financial Ledger Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time stream of incoming payments (Sales & Debt Settlements) and outgoing expenses.
            </p>

            {/* Combined Stream */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ...filteredSales.map((s) => ({
                  id: s.id,
                  type: 'income' as const,
                  title: `Sale #${s.saleNumber} - ${s.customerName || 'Walk-in'}`,
                  amount: s.paymentStatus === 'paid' ? s.total : (s.amountPaid || 0),
                  method: s.paymentMethod,
                  date: s.createdAt,
                  subtitle: `${s.items.length} item(s) • ${s.paymentStatus.toUpperCase()}`,
                })),
                ...filteredExpenses.map((e) => ({
                  id: e.id,
                  type: 'expense' as const,
                  title: e.title,
                  amount: e.amount,
                  method: e.paymentMethod,
                  date: e.date,
                  subtitle: `Category: ${e.category.toUpperCase()} • ${e.notes || 'Operating expense'}`,
                })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 15)
                .map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          item.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.subtitle} • Channel: {String(item.method).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs block ${
                          item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES MANAGEMENT */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Search expense description or notes..."
                className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedExpenseCat}
                onChange={(e) => setSelectedExpenseCat(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
              >
                <option value="all">All Categories</option>
                <option value="utilities">Utilities (Power/Water)</option>
                <option value="rent">Rent</option>
                <option value="salaries">Salaries & Wages</option>
                <option value="inventory">Inventory & Restock</option>
                <option value="transport">Transport & Logistics</option>
                <option value="marketing">Marketing & Ads</option>
                <option value="equipment">Equipment</option>
                <option value="maintenance">Maintenance</option>
                <option value="taxes">Taxes & Licenses</option>
                <option value="other">Other Overhead</option>
              </select>

              <select
                value={selectedExpenseMethod}
                onChange={(e) => setSelectedExpenseMethod(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
              >
                <option value="all">All Payment Channels</option>
                <option value="cash">Cash</option>
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="bank_transfer">Bank Deposit</option>
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExpenses
              .filter((e) => {
                const matchSearch =
                  !expenseSearch ||
                  e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                  (e.notes && e.notes.toLowerCase().includes(expenseSearch.toLowerCase()));
                const matchCat = selectedExpenseCat === 'all' || e.category === selectedExpenseCat;
                const matchMethod = selectedExpenseMethod === 'all' || e.paymentMethod === selectedExpenseMethod;
                return matchSearch && matchCat && matchMethod;
              })
              .map((exp) => (
                <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {exp.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-400">
                        {exp.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold">
                        {String(exp.paymentMethod).replace('_', ' ')}
                      </span>
                    </div>
                    {exp.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        "{exp.notes}"
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400">
                      Date: {new Date(exp.date).toLocaleDateString()} {exp.createdBy ? `• By: ${exp.createdBy}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-rose-600">
                      {formatCurrency(exp.amount)}
                    </span>
                    <button
                      onClick={() => handleOpenEditExpense(exp)}
                      className="p-1 text-slate-400 hover:text-blue-600"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Channel & Till Reconciliation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
              Compare actual physical cash or digital wallet balances against system-recorded transactions to detect discrepancies.
            </p>

            {reconSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Reconciliation record successfully saved to audit ledger!</span>
              </div>
            )}

            {/* Channel Selection Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              {[
                { id: 'cash', label: '💵 Cash in Drawer' },
                { id: 'mtn_momo', label: '📱 MTN Mobile Money' },
                { id: 'airtel_money', label: '📱 Airtel Money' },
                { id: 'bank_transfer', label: '🏦 Bank Account' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setReconChannel(c.id as any);
                    setActualCountedInput(0);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${
                    reconChannel === c.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 mb-5">
              {reconChannel === 'cash' && (
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Opening Float</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={openingFloat}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setOpeningFloat(val);
                        localStorage.setItem(`eagle_float_${business?.id || 'default'}`, String(val));
                      }}
                      className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Today's Inflows (+)</span>
                <span className="text-sm font-bold font-mono text-emerald-600 block mt-1">
                  +{formatCurrency(activeChannelRecon.income)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Today's Outflows (-)</span>
                <span className="text-sm font-bold font-mono text-rose-600 block mt-1">
                  -{formatCurrency(activeChannelRecon.expense)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Expected Balance</span>
                <span className="text-sm font-black font-mono text-blue-600 block mt-1">
                  {formatCurrency(activeChannelRecon.expected)}
                </span>
              </div>
            </div>

            {/* Cash Denominations Toggle */}
            {reconChannel === 'cash' && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setUseDenominations(!useDenominations)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>{useDenominations ? 'Hide Note & Coin Counter' : 'Use Ugandan Shilling Denomination Counter'}</span>
                </button>

                {useDenominations && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    {Object.keys(denominations).map((denom) => (
                      <div key={denom}>
                        <label className="block text-[10px] font-mono text-slate-500 mb-0.5">
                          {Number(denom).toLocaleString()} Notes/Coins
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={denominations[denom] || ''}
                          onChange={(e) =>
                            setDenominations({
                              ...denominations,
                              [denom]: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-bold"
                          placeholder="Count"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actual Count Entry & Variance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Counted / Verified Balance ({currency})
                </label>
                <input
                  type="number"
                  value={actualCountedInput || ''}
                  onChange={(e) => setActualCountedInput(Number(e.target.value))}
                  placeholder="Enter actual physical / wallet balance"
                  className="w-full px-3 py-2 text-base font-mono font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Real-time Variance Badge */}
              <div className="p-3 rounded-xl border flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold block text-slate-500">Variance (Discrepancy)</span>
                  <span
                    className={`text-base font-black font-mono ${
                      activeChannelRecon.variance === 0
                        ? 'text-emerald-600'
                        : activeChannelRecon.variance > 0
                        ? 'text-blue-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {activeChannelRecon.variance === 0
                      ? 'Balanced (UGX 0)'
                      : activeChannelRecon.variance > 0
                      ? `Surplus +${formatCurrency(activeChannelRecon.variance)}`
                      : `Shortage -${formatCurrency(Math.abs(activeChannelRecon.variance))}`}
                  </span>
                </div>
                {activeChannelRecon.variance === 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reconciliation Notes & Verification Memo
              </label>
              <input
                type="text"
                value={reconNotes}
                onChange={(e) => setReconNotes(e.target.value)}
                placeholder="e.g. End of day register verified by Sarah. Cash drawer counted."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveReconciliation}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save & Finalize Reconciliation
              </button>
            </div>
          </div>

          {/* Past Reconciliation Sessions */}
          {reconciliations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Historical Reconciliation Records ({reconciliations.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {reconciliations.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {r.channel.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            r.status === 'balanced'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : r.status === 'surplus'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {r.status} ({r.variance === 0 ? '0' : formatCurrency(r.variance)})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Expected: {formatCurrency(r.expectedBalance)} • Counted: {formatCurrency(r.actualCounted)} • By: {r.reconciledBy}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(r.date).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINANCIAL STATEMENTS (P&L & Cashflow) */}
      {activeTab === 'statements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Financial Statements ({timeRange.replace('_', ' ').toUpperCase()})
            </h3>
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Statement (P&L) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Statement of Profit or Loss
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Income Statement
                </h4>
                <p className="text-xs text-slate-400">{business?.name} • For the period {timeRange.replace('_', ' ')}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <span>Gross Operating Revenue</span>
                  <span className="font-mono text-emerald-600">+{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                  <span>Less: Cost of Goods Sold (COGS)</span>
                  <span className="font-mono text-amber-600">-{formatCurrency(totalCOGS)}</span>
                </div>
                <div className="flex justify-between py-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 rounded-lg font-bold">
                  <span>Gross Operating Profit</span>
                  <span className="font-mono">{formatCurrency(grossProfit)}</span>
                </div>

                <div className="pt-2 text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Operating Overhead Expenses:</span>
                  {(
                    Object.entries(
                      filteredExpenses.reduce<Record<string, number>>((acc, e) => {
                        acc[e.category] = (acc[e.category] || 0) + e.amount;
                        return acc;
                      }, {})
                    )
                  ).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between py-0.5 text-[11px] pl-2">
                      <span className="capitalize">{cat}</span>
                      <span className="font-mono">-{formatCurrency(Number(val))}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <span>Total Operating Expenses</span>
                  <span className="font-mono text-rose-600">-{formatCurrency(totalOverheadExpenses)}</span>
                </div>

                <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-950/50 px-3 rounded-xl font-black text-sm text-blue-700 dark:text-blue-300">
                  <span>Net Profit Before Tax</span>
                  <span className="font-mono">{formatCurrency(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Cashflow Statement */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Liquidity & Cash Movements
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Cash Flow Statement
                </h4>
                <p className="text-xs text-slate-400">{business?.name} • Inflows & Disbursements</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cash Inflows from Operations:</span>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>Cash Register Payments</span>
                    <span className="font-mono text-emerald-600">+{formatCurrency(channelBreakdown.cash.income)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>MTN Mobile Money Inflows</span>
                    <span className="font-mono text-emerald-600">+{formatCurrency(channelBreakdown.mtn_momo.income)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>Airtel Money Inflows</span>
                    <span className="font-mono text-emerald-600">+{formatCurrency(channelBreakdown.airtel_money.income)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>Bank Account Deposits</span>
                    <span className="font-mono text-emerald-600">+{formatCurrency(channelBreakdown.bank_transfer.income)}</span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Operating Cash Disbursements:</span>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>Cash Disbursements</span>
                    <span className="font-mono text-rose-600">-{formatCurrency(channelBreakdown.cash.expense)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>Digital & Mobile Disbursements</span>
                    <span className="font-mono text-rose-600">
                      -{formatCurrency(channelBreakdown.mtn_momo.expense + channelBreakdown.airtel_money.expense)}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[11px] pl-2">
                    <span>Bank & Electronic Transfers</span>
                    <span className="font-mono text-rose-600">-{formatCurrency(channelBreakdown.bank_transfer.expense)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-2 bg-emerald-50 dark:bg-emerald-950/50 px-3 rounded-xl font-black text-sm text-emerald-700 dark:text-emerald-300">
                  <span>Net Generated Liquid Cashflow</span>
                  <span className="font-mono">
                    {formatCurrency(
                      channelBreakdown.cash.balance +
                      channelBreakdown.mtn_momo.balance +
                      channelBreakdown.airtel_money.balance +
                      channelBreakdown.bank_transfer.balance
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingExpense ? 'Edit Expense' : 'Record New Expense'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log operational disbursements, supplier payments, or utilities.
            </p>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Expense Description / Title *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Plot 12 Showroom Electricity Yaka tokens"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="utilities">Utilities (Power/Water)</option>
                    <option value="rent">Rent</option>
                    <option value="salaries">Salaries & Wages</option>
                    <option value="inventory">Inventory Restock</option>
                    <option value="transport">Transport & Cargo</option>
                    <option value="marketing">Marketing & Ads</option>
                    <option value="equipment">Equipment & Assets</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="taxes">Taxes & Licenses</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Payment Channel</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="cash">💵 Cash in Drawer</option>
                    <option value="mtn_momo">📱 MTN Mobile Money</option>
                    <option value="airtel_money">📱 Airtel Money</option>
                    <option value="bank_transfer">🏦 Bank Deposit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Receipt Reference</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Receipt #9812, paid to Umeme via MTN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
