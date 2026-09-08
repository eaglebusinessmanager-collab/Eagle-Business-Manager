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
  ArrowUpRight,
  Clock,
  Sparkles,
  Info,
  TrendingUp,
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
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigate,
  onOpenQuickSale,
  onOpenAddProduct,
  onOpenAddCustomer,
}) => {
  const { user, business } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency || 'UGX';

  const loadDashboardData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [sList, pList, annList] = await Promise.all([
        dbService.getSales(business.id),
        dbService.getProducts(business.id),
        dbService.getActiveAnnouncements(),
      ]);
      setSales(sList);
      setProducts(pList);
      setAnnouncements(annList);
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

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Active System Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 p-3.5 sm:p-4 border border-blue-200/80 dark:border-blue-900/50 shadow-xs"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Info className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">{ann.title}</h4>
                <p className="text-xs text-blue-900/80 dark:text-blue-300 mt-0.5 leading-relaxed">
                  {ann.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PWA In-App Banner if installable */}
      <PWAInstallButton variant="banner" />

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Welcome back, {user?.fullName}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {business?.name} • Category: {business?.category}
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Record New Sale</span>
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

      {/* Quick Action Buttons Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Quick Operations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => onNavigate('sales')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition active:scale-95 border border-blue-100 dark:border-blue-900/40 text-center"
          >
            <ShoppingBag className="h-5 w-5 mb-1 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold">Record Sale</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition active:scale-95 border border-emerald-100 dark:border-emerald-900/40 text-center"
          >
            <PlusCircle className="h-5 w-5 mb-1 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold">Add Product</span>
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition active:scale-95 border border-purple-100 dark:border-purple-900/40 text-center"
          >
            <Users className="h-5 w-5 mb-1 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold">Add Customer</span>
          </button>
          <button
            onClick={() => onNavigate('invoices')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 transition active:scale-95 border border-cyan-100 dark:border-cyan-900/40 text-center"
          >
            <FileText className="h-5 w-5 mb-1 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold">Create Invoice</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition active:scale-95 border border-amber-100 dark:border-amber-900/40 text-center col-span-2 sm:col-span-1"
          >
            <BarChart3 className="h-5 w-5 mb-1 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold">View Reports</span>
          </button>
        </div>
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
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Transactions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No sales recorded yet</p>
              <p className="text-[11px] mt-0.5">Click 'Record New Sale' above to begin selling!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                    <th className="pb-2">Receipt #</th>
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
