import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Customer, Product, Sale } from '../../types';
import { StatCard } from '../../components/common/StatCard';

export const ReportsPage: React.FC = () => {
  const { business } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState(true);

  const currency = business?.currency || 'UGX';

  useEffect(() => {
    if (!business) return;
    const load = async () => {
      setLoading(true);
      try {
        const [sList, pList, cList] = await Promise.all([
          dbService.getSales(business.id),
          dbService.getProducts(business.id),
          dbService.getCustomers(business.id),
        ]);
        setSales(sList);
        setProducts(pList);
        setCustomers(cList);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [business?.id]);

  // Date filtering
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setMonth(now.getMonth() - 1);

  const filteredSales = sales.filter((s) => {
    if (dateRange === 'today') return s.createdAt.startsWith(todayStr);
    if (dateRange === 'week') return new Date(s.createdAt) >= weekAgo;
    if (dateRange === 'month') return new Date(s.createdAt) >= monthAgo;
    return true;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Best selling products calculation
  const productSalesMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          sku: item.sku,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.total;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Sale Number', 'Date', 'Customer', 'Items Count', 'Payment Method', 'Status', 'Total (' + currency + ')'];
    const rows = filteredSales.map((s) => [
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
    link.setAttribute('download', `eagle_sales_report_${dateRange}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => `${currency} ${Math.round(amount).toLocaleString()}`;

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Reports & Business Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time turnover metrics, best selling items, and downloadable financial reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Time</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Period Sales Turnover"
          value={formatCurrency(totalRevenue)}
          subtitle={`${filteredSales.length} closed transactions`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(averageTicket)}
          subtitle="Per customer receipt"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered in directory"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Inventory Catalog"
          value={products.length}
          subtitle={`${products.reduce((sum, p) => sum + p.currentStock, 0)} units total`}
          icon={Package}
          color="slate"
        />
      </div>

      {/* Best-Selling Products Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Top Performing Products by Units Sold
          </h3>

          {topProducts.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">No sales recorded in this period.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {topProducts.slice(0, 6).map((item, idx) => {
                const maxQty = topProducts[0]?.qty || 1;
                const percentage = Math.round((item.qty / maxQty) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center font-medium">
                      <span className="truncate max-w-[180px] text-slate-800 dark:text-slate-200">
                        {idx + 1}. {item.name}
                      </span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.qty} units
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Stock Replenishment Watchlist</span>
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {products.filter((p) => p.currentStock <= p.minStockLevel).length === 0 ? (
              <p className="text-center py-8 text-slate-400">All inventory levels are above minimum thresholds.</p>
            ) : (
              products
                .filter((p) => p.currentStock <= p.minStockLevel)
                .slice(0, 6)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {p.currentStock} in stock
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Min threshold: {p.minStockLevel}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
