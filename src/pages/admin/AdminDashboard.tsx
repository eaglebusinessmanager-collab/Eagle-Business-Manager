import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Building2,
  Package,
  ShoppingBag,
  AlertTriangle,
  Radio,
  FileText,
  Activity,
  CheckCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Business, Product, Sale, UserProfile } from '../../types';
import { StatCard } from '../../components/common/StatCard';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [uList, bList, pList, sList] = await Promise.all([
          dbService.getAllUsers(),
          dbService.getAllBusinesses(),
          dbService.getAllProductsPlatform(),
          dbService.getAllSalesPlatform(),
        ]);
        setUsers(uList);
        setBusinesses(bList);
        setProducts(pList);
        setSales(sList);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPlatformTurnover = sales.reduce((acc, s) => acc + s.total, 0);
  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const suspendedUsersCount = users.filter((u) => u.status === 'suspended').length;
  const lowStockPlatformCount = products.filter((p) => p.currentStock <= p.minStockLevel).length;

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-purple-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <h1 className="text-xl font-extrabold tracking-tight">
              Eagle Administrator Control Center
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Global monitoring for all registered businesses, merchant accounts, and platform transaction volumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin-announcements')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-xs"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Broadcast Message</span>
          </button>
        </div>
      </div>

      {/* Platform Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Platform Sales Volume"
          value={`UGX ${totalPlatformTurnover.toLocaleString()}`}
          subtitle={`${sales.length} total platform sales`}
          icon={TrendingUp}
          color="purple"
          onClick={() => onNavigate('admin-sales')}
        />
        <StatCard
          title="Registered Businesses"
          value={businesses.length}
          subtitle={`${businesses.filter((b) => b.status === 'active').length} active enterprise stores`}
          icon={Building2}
          color="blue"
          onClick={() => onNavigate('admin-businesses')}
        />
        <StatCard
          title="Total User Accounts"
          value={users.length}
          subtitle={`${activeUsersCount} active / ${suspendedUsersCount} suspended`}
          icon={Users}
          color="emerald"
          onClick={() => onNavigate('admin-users')}
        />
        <StatCard
          title="Catalog Inventory"
          value={products.length}
          subtitle={`${lowStockPlatformCount} items with low stock`}
          icon={Package}
          color={lowStockPlatformCount > 0 ? 'amber' : 'slate'}
          onClick={() => onNavigate('admin-products')}
        />
      </div>

      {/* Admin Modules Quick Launch */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Platform Administration Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <button
            onClick={() => onNavigate('admin-users')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left border border-slate-200/70 dark:border-slate-800 hover:border-purple-500 transition group"
          >
            <Users className="h-5 w-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-slate-900 dark:text-white">User Accounts</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Suspend, activate & password resets
            </p>
          </button>

          <button
            onClick={() => onNavigate('admin-businesses')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left border border-slate-200/70 dark:border-slate-800 hover:border-blue-500 transition group"
          >
            <Building2 className="h-5 w-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-slate-900 dark:text-white">Businesses</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Enterprise status & monitoring
            </p>
          </button>

          <button
            onClick={() => onNavigate('admin-sales')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left border border-slate-200/70 dark:border-slate-800 hover:border-emerald-500 transition group"
          >
            <ShoppingBag className="h-5 w-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-slate-900 dark:text-white">Platform Sales</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cross-business revenue logs
            </p>
          </button>

          <button
            onClick={() => onNavigate('admin-audit')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left border border-slate-200/70 dark:border-slate-800 hover:border-amber-500 transition group"
          >
            <Activity className="h-5 w-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-slate-900 dark:text-white">Security Audit</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Trace admin actions & logins
            </p>
          </button>
        </div>
      </div>

      {/* Grid: Latest Businesses & Platform Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Businesses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Registered Businesses ({businesses.length})
            </h3>
            <button
              onClick={() => onNavigate('admin-businesses')}
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Manage All
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {businesses.slice(0, 5).map((biz) => (
              <div
                key={biz.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{biz.name}</p>
                  <p className="text-[10px] text-slate-400">{biz.category} • Tel: {biz.phone}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    biz.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {biz.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Recent Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Cross-Platform Real-time Sales
            </h3>
            <button
              onClick={() => onNavigate('admin-sales')}
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Monitor All
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {sale.saleNumber}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {sale.customerName || 'Walk-in'} • {new Date(sale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white block">
                    UGX {sale.total.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase">
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
