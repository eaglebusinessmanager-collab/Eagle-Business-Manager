import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  CreditCard,
  Wallet,
  Building2,
  PhoneCall,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  Sparkles,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Customer, Product, Sale, Expense } from '../../types';
import { StatCard } from '../../components/common/StatCard';

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#10b981', // emerald
  momo: '#f59e0b', // mtn yellow/amber
  airtel_money: '#ef4444', // airtel red
  bank: '#3b82f6', // blue
  credit: '#8b5cf6', // purple
  cheque: '#64748b', // slate
  card: '#06b6d4', // cyan
};

export const ReportsPage: React.FC = () => {
  const { business } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);

  const currency = business?.currency || 'UGX';

  useEffect(() => {
    if (!business?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [sList, pList, cList, eList] = await Promise.all([
          dbService.getSales(business.id),
          dbService.getProducts(business.id),
          dbService.getCustomers(business.id),
          dbService.getExpenses(business.id),
        ]);
        setSales(sList);
        setProducts(pList);
        setCustomers(cList);
        setExpenses(eList);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [business?.id]);

  // Product price lookup map for calculating Cost of Goods Sold (COGS)
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      map.set(p.id, p.buyingPrice || 0);
    });
    return map;
  }, [products]);

  // Date Filtering Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    const filterDate = (dateStr: string) => {
      if (dateRange === 'today') return dateStr.startsWith(todayStr);
      if (dateRange === 'yesterday') return dateStr.startsWith(yesterdayStr);
      if (dateRange === 'week') return new Date(dateStr) >= weekAgo;
      if (dateRange === 'month') return new Date(dateStr) >= monthAgo;
      return true;
    };

    const periodSales = sales.filter((s) => filterDate(s.createdAt));
    const periodExpenses = expenses.filter((e) => filterDate(e.date || e.createdAt));

    return { periodSales, periodExpenses };
  }, [sales, expenses, dateRange]);

  const { periodSales, periodExpenses } = filteredData;

  // Financial Computations
  const totalRevenue = periodSales.reduce((acc, s) => acc + s.total, 0);

  // Compute Cost of Goods Sold (COGS)
  const totalCOGS = periodSales.reduce((sum, sale) => {
    return (
      sum +
      sale.items.reduce((itemSum, it) => {
        const unitCost = productCostMap.get(it.productId) || 0;
        return itemSum + unitCost * it.quantity;
      }, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = periodSales.length > 0 ? totalRevenue / periodSales.length : 0;

  // Best selling products calculation with profit breakdown
  const topProducts = useMemo(() => {
    const map: Record<
      string,
      { name: string; sku: string; qty: number; revenue: number; cogs: number; profit: number }
    > = {};

    periodSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const unitCost = productCostMap.get(item.productId) || 0;
        const itemCogs = unitCost * item.quantity;
        const itemRev = item.total || item.quantity * item.unitPrice;

        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            sku: item.sku || 'N/A',
            qty: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
          };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += itemRev;
        map[item.productId].cogs += itemCogs;
        map[item.productId].profit += itemRev - itemCogs;
      });
    });

    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [periodSales, productCostMap]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { label: string; count: number; total: number; color: string }> = {};

    periodSales.forEach((sale) => {
      const pm = sale.paymentMethod || 'cash';
      if (!map[pm]) {
        let label = pm.toUpperCase();
        if (pm === 'momo') label = 'MTN MoMo';
        if (pm === 'airtel_money') label = 'Airtel Money';
        if (pm === 'bank') label = 'Bank Transfer';
        if (pm === 'cash') label = 'Cash Payment';

        map[pm] = {
          label,
          count: 0,
          total: 0,
          color: PAYMENT_COLORS[pm] || '#64748b',
        };
      }
      map[pm].count += 1;
      map[pm].total += sale.total;
    });

    return Object.entries(map).map(([key, val]) => ({
      key,
      name: val.label,
      value: val.total,
      count: val.count,
      color: val.color,
    }));
  }, [periodSales]);

  // Sales Trends by Day/Date for Charts
  const trendData = useMemo(() => {
    const dateMap: Record<string, { date: string; revenue: number; cost: number; expense: number; profit: number }> = {};

    // Group sales
    periodSales.forEach((s) => {
      const dateKey = new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, revenue: 0, cost: 0, expense: 0, profit: 0 };
      }
      dateMap[dateKey].revenue += s.total;

      const saleCost = s.items.reduce((sum, it) => sum + (productCostMap.get(it.productId) || 0) * it.quantity, 0);
      dateMap[dateKey].cost += saleCost;
    });

    // Group expenses
    periodExpenses.forEach((e) => {
      const dateKey = new Date(e.date || e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, revenue: 0, cost: 0, expense: 0, profit: 0 };
      }
      dateMap[dateKey].expense += e.amount;
    });

    // Calculate profit per bucket
    Object.values(dateMap).forEach((d) => {
      d.profit = d.revenue - d.cost - d.expense;
    });

    return Object.values(dateMap);
  }, [periodSales, periodExpenses, productCostMap]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Sale Number',
      'Date',
      'Customer',
      'Items Count',
      'Payment Method',
      'Status',
      `Total (${currency})`,
    ];
    const rows = periodSales.map((s) => [
      s.saleNumber,
      new Date(s.createdAt).toISOString(),
      `"${s.customerName || 'Walk-in'}"`,
      s.items.length,
      s.paymentMethod,
      s.paymentStatus,
      s.total,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eagle_advanced_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmt = (n: number) => `${currency} ${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Advanced Financial Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time turnover, COGS margin tracking, net profit, mobile money breakdown & trend charts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3.5 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="today">Today Only</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
            <option value="all">All-Time Cumulative</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs & Profit Margins */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Turnover */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Gross Sales Turnover</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {fmt(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {periodSales.length} closed sale{periodSales.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Operating Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Operating Expenses</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {fmt(totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {periodExpenses.length} expense record{periodExpenses.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Net Realized Profit</span>
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                netProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                  : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
              }`}
            >
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`text-lg sm:text-2xl font-black mt-1 ${
              netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {fmt(netProfit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Margin: <span className="font-bold text-slate-700 dark:text-slate-300">{profitMargin.toFixed(1)}%</span> of revenue
          </p>
        </div>

        {/* Average Order Value & Customers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Average Order Value</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {fmt(averageOrderValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {customers.length} registered customers
          </p>
        </div>
      </div>

      {/* Revenue & Profit Trends Chart */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Revenue vs Net Profit Dynamics</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive timeline of sales cash inflow versus calculated net profit
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-blue-600 inline-block" />
              <span>Revenue</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
              <span>Net Profit</span>
            </span>
          </div>
        </div>

        {trendData.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No sales or expense transactions recorded in this period.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`)}
                />
                <Tooltip
                  formatter={(val: any) => [fmt(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProf)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two-Column Analytics: Payment Channels & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Channels Report */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Payment Methods & Channels</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cash, MTN MoMo, Airtel Money, and bank settlements
            </p>

            {paymentBreakdown.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No payment data available.</p>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [fmt(Number(val)), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2">
                  {paymentBreakdown.map((pm) => {
                    const percent = totalRevenue > 0 ? (pm.value / totalRevenue) * 100 : 0;
                    return (
                      <div key={pm.key} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pm.color }} />
                            <span>{pm.name}</span>
                            <span className="text-slate-400 text-[10px]">({pm.count} tx)</span>
                          </span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {fmt(pm.value)} ({percent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%`, backgroundColor: pm.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Products Leaderboard */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span>Best Selling Products & Profitability</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by units moved with gross margin contribution
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{topProducts.length} Items Sold</span>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-center py-12 text-xs text-slate-400">No items sold during this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pr-2">Product</th>
                    <th className="py-2.5 px-2 text-center">Units</th>
                    <th className="py-2.5 px-2 text-right">Turnover</th>
                    <th className="py-2.5 pl-2 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topProducts.slice(0, 8).map((prod, idx) => {
                    const margin = prod.revenue > 0 ? (prod.profit / prod.revenue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 pr-2">
                          <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[180px]">
                            {idx + 1}. {prod.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold font-mono text-blue-600 dark:text-blue-400">
                          {prod.qty}
                        </td>
                        <td className="py-3 px-2 text-right font-bold font-mono text-slate-900 dark:text-white">
                          {fmt(prod.revenue)}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <span
                            className={`inline-block font-mono font-bold text-[11px] ${
                              prod.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                            }`}
                          >
                            {fmt(prod.profit)}
                          </span>
                          <span className="block text-[10px] text-slate-400">({margin.toFixed(0)}%)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
