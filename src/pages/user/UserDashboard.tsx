import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  ShoppingBag,
  PlusCircle,
  FileText,
  BarChart3,
  Clock,
  Info,
  TrendingUp,
  Store,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Truck,
  TrendingDown,
  SlidersHorizontal,
  BookOpen,
  Receipt,
  Trash2,
  Database,
  Sparkles,
  Command,
  Calculator,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Announcement, Product, Sale } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';

interface UserDashboardProps {
  onNavigate: (view: string) => void;
  onOpenQuickSale?: () => void;
  onOpenAddProduct?: () => void;
  onOpenAddCustomer?: () => void;
  onOpenSearch?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigate,
  onOpenQuickSale,
  onOpenAddProduct,
  onOpenAddCustomer,
  onOpenSearch,
}) => {
  const { user, business } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [monthlyExpensesTotal, setMonthlyExpensesTotal] = useState(0);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency || 'UGX';

  const loadDashboardData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [sList, pList, annList, mList, evts, exps, quos] = await Promise.all([
        dbService.getSales(business.id),
        dbService.getProducts(business.id),
        dbService.getActiveAnnouncements(),
        dbService.getAllMarketplaceProducts(),
        dbService.getCalendarEvents(business.id),
        dbService.getExpenses(business.id),
        dbService.getQuotations(business.id),
      ]);
      setSales(sList);
      setProducts(pList);
      setAnnouncements(annList);
      setMarketplaceProducts(mList);

      const today = new Date().toISOString().split('T')[0];
      const upcoming = evts.filter((e) => e.startDate >= today && e.status !== 'cancelled').length;
      setUpcomingEventsCount(upcoming);

      const currentMonth = today.substring(0, 7);
      const mExpenses = exps
        .filter((e) => e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);
      setMonthlyExpensesTotal(mExpenses);

      setQuotationsCount(quos.length);
    } catch (e) {
      console.error('Error loading user dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [business?.id]);

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales
    .filter((s) => s.createdAt.startsWith(todayStr))
    .reduce((sum, s) => sum + s.total, 0);

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  const lowStockProducts = products.filter(
    (p) => p.status === 'active' && p.currentStock <= p.minStockLevel
  );

  const formatCurrency = (val: number) => {
    return `${currency} ${val.toLocaleString()}`;
  };

  const handleMarketplaceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (marketplaceSearch.trim()) {
      localStorage.setItem('eagle_marketplace_search', marketplaceSearch.trim());
    }
    onNavigate('marketplace');
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Broadcast Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs"
            >
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  {ann.title}:
                </span>{' '}
                <span className="text-blue-800 dark:text-blue-300">
                  {ann.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Welcome & Primary Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {business?.name || 'Eagle Business Manager'}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold">
              {business?.category || 'Retail'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logged in as <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.fullName || user?.username}</span>
            {user?.phone && ` (${user.phone})`} • Currency: {currency}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Global Search across all business records"
            >
              <Search className="h-4 w-4 text-blue-600" />
              <span>Universal Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          <PWAInstallButton variant="banner" />
          
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          subtitle={`${sales.filter((s) => s.createdAt.startsWith(todayStr)).length} sales today`}
          icon={TrendingUp}
          color="emerald"
          onClick={() => onNavigate('sales')}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalSales)}
          subtitle={`${sales.length} total orders`}
          icon={DollarSign}
          color="blue"
          onClick={() => onNavigate('sales')}
        />
        <StatCard
          title="Total Products"
          value={products.length}
          subtitle={`${products.reduce((acc, p) => acc + p.currentStock, 0)} units in stock`}
          icon={Package}
          color="purple"
          onClick={() => onNavigate('products')}
        />
        <StatCard
          title="Low Stock Warning"
          value={lowStockProducts.length}
          subtitle={lowStockProducts.length > 0 ? 'Requires restock' : 'Inventory healthy'}
          icon={AlertTriangle}
          color={lowStockProducts.length > 0 ? 'rose' : 'slate'}
          onClick={() => onNavigate('products')}
        />
      </div>

      {/* Quick Operations Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Frequent Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => onNavigate('sales')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition active:scale-95 border border-blue-100 dark:border-blue-900/40 text-center cursor-pointer"
          >
            <ShoppingBag className="h-5 w-5 mb-1 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold">Record Sale</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition active:scale-95 border border-emerald-100 dark:border-emerald-900/40 text-center cursor-pointer"
          >
            <PlusCircle className="h-5 w-5 mb-1 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold">Add Product</span>
          </button>
          <button
            onClick={() => onNavigate('quotations')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition active:scale-95 border border-indigo-100 dark:border-indigo-900/40 text-center cursor-pointer"
          >
            <FileText className="h-5 w-5 mb-1 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold">Quotations</span>
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition active:scale-95 border border-purple-100 dark:border-purple-900/40 text-center cursor-pointer"
          >
            <Users className="h-5 w-5 mb-1 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold">Add Customer</span>
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition active:scale-95 border border-rose-100 dark:border-rose-900/40 text-center cursor-pointer"
          >
            <TrendingDown className="h-5 w-5 mb-1 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-bold">Expenses</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition active:scale-95 border border-amber-100 dark:border-amber-900/40 text-center cursor-pointer"
          >
            <Calendar className="h-5 w-5 mb-1 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold">Calendar</span>
          </button>
        </div>
      </div>

      {/* Business Workspace & Operational Hub (Upgraded System Modules) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Business Management Hub</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Direct access to all commercial tools, supply chain tracking, and data security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Calendar Card */}
          <div
            onClick={() => onNavigate('calendar')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {upcomingEventsCount} upcoming
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
              Business Calendar
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Appointments, deliveries & reminders
            </p>
          </div>

          {/* Quotations Card */}
          <div
            onClick={() => onNavigate('quotations')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {quotationsCount} quotes
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
              Quotations & Estimates
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Price estimates with 1-click invoice conversion
            </p>
          </div>

          {/* Expenses Card */}
          <div
            onClick={() => onNavigate('expenses')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                {formatCurrency(monthlyExpensesTotal)}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition">
              Expenses Ledger
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Rent, bills, restocking & operations
            </p>
          </div>

          {/* Suppliers Card */}
          <div
            onClick={() => onNavigate('suppliers')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                Supply Chain
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
              Suppliers Directory
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Wholesalers, payment terms & products
            </p>
          </div>

          {/* Stock Adjustments Card */}
          <div
            onClick={() => onNavigate('stock-adjustments')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                Audit Trail
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
              Stock Adjustments
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Damaged goods, theft & shrinkage audits
            </p>
          </div>

          {/* Notes & Journal Card */}
          <div
            onClick={() => onNavigate('notes')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                Journal
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition">
              Business Notes
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Daily logs, ideas & priority to-dos
            </p>
          </div>

          {/* Documents & Receipts Studio */}
          <div
            onClick={() => onNavigate('documents')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                Studio
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
              Receipts & Documents
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Custom headers, footers & delivery notes
            </p>
          </div>

          {/* Backup & Data Sovereignty */}
          <div
            onClick={() => onNavigate('backup')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                JSON & CSV
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
              Data Backup & Export
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Excel spreadsheets & full snapshot restore
            </p>
          </div>

          {/* Eagle Tools Suite */}
          <div
            onClick={() => onNavigate('tools')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                Calculators
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
              Eagle Tools Suite
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Margin calculator, URA VAT, barcodes & vCard
            </p>
          </div>

          {/* Cash Register & Closing */}
          <div
            onClick={() => onNavigate('cash-register')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Banknote className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                Z-Report
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
              Cash Register
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Daily closing, drawer balance & MoMo reconcile
            </p>
          </div>

          {/* Credit & Debts */}
          <div
            onClick={() => onNavigate('debts')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                Aging Debts
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition">
              Customer Debts
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Receivables ledger & 1-click WhatsApp reminders
            </p>
          </div>

          {/* Purchases & Procurement */}
          <div
            onClick={() => onNavigate('purchases')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                PO Restock
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
              Purchase Orders
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Supplier restock POs & automatic stock-in
            </p>
          </div>

          {/* Business Modules Customizer */}
          <div
            onClick={() => onNavigate('modules')}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                Industry
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition">
              Module Config
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle features for retail, wholesale, salon, cafe
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Community Marketplace Spotlight Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 shadow-md border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/20">
                <Store className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Eagle Community Marketplace
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                {marketplaceProducts.length} Verified Items
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Source wholesale & retail goods directly from verified Ugandan businesses. Direct WhatsApp contact with zero middleman fees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Browse All Items</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition border border-white/10 cursor-pointer"
            >
              <span>List Your Products</span>
            </button>
          </div>
        </div>

        {/* Search Bar directly inside Marketplace Card */}
        <form onSubmit={handleMarketplaceSearch} className="mt-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products across all merchants (e.g. Solar inverters, Matooke, Coffee, Shoes)..."
              value={marketplaceSearch}
              onChange={(e) => setMarketplaceSearch(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Featured Marketplace Products Mini-Grid */}
        {marketplaceProducts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Trending from Community Vendors
              </span>
              <button
                onClick={() => onNavigate('marketplace')}
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 font-semibold"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {marketplaceProducts.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('marketplace')}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-800 mb-2 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono font-bold">
                      {item.currentStock} left
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
                      <span>{item.sellerLocation || item.businessName}</span>
                    </p>
                    <p className="text-xs font-mono font-extrabold text-emerald-400 mt-1">
                      UGX {item.sellingPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Low Stock Alert & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Low Stock Attention Needed Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Low Stock Alerts
              </h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <Package className="h-8 w-8 mx-auto mb-1.5 opacity-40 text-emerald-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All products well-stocked!</p>
              <p className="text-[11px] mt-0.5">No items are below minimum threshold.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[10px] font-bold">
                      {p.currentStock} left (Min {p.minStockLevel})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Store Transactions */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Store Transactions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <ShoppingBag className="h-8 w-8 mx-auto mb-1.5 opacity-30" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No recorded sales yet</p>
              <p className="text-[11px] mt-0.5">Start by recording a sale at the checkout counter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-2">Invoice #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {sale.saleNumber}
                      </td>
                      <td className="py-2.5 text-slate-800 dark:text-slate-200">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : sale.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {sale.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
