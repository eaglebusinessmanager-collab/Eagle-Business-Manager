import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  Package,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Business, Product, Sale } from '../../types';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const AdminBusinessesPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Business to toggle suspend/activate
  const [bizToToggle, setBizToToggle] = useState<Business | null>(null);
  const [viewingBiz, setViewingBiz] = useState<Business | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bList, pList, sList] = await Promise.all([
        dbService.getAllBusinesses(),
        dbService.getAllProductsPlatform(),
        dbService.getAllSalesPlatform(),
      ]);
      setBusinesses(bList);
      setProducts(pList);
      setSales(sList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async () => {
    if (!bizToToggle || !currentAdmin) return;
    const newStatus = bizToToggle.status === 'active' ? 'suspended' : 'active';
    await dbService.updateBusinessStatus(
      bizToToggle.id,
      newStatus,
      currentAdmin.id,
      currentAdmin.fullName
    );
    setBizToToggle(null);
    await loadData();
  };

  const filteredBusinesses = businesses.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Registered Businesses Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor isolated merchant enterprises, sales performance, and tenant account status.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business by name, category, or telephone..."
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          <option value="all">Status: All</option>
          <option value="active">Active Businesses</option>
          <option value="suspended">Suspended Businesses</option>
        </select>
      </div>

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBusinesses.map((biz) => {
          const bizProducts = products.filter((p) => p.businessId === biz.id);
          const bizSales = sales.filter((s) => s.businessId === biz.id);
          const bizRevenue = bizSales.reduce((sum, s) => sum + s.total, 0);

          return (
            <div
              key={biz.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-purple-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {biz.category}
                  </span>
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

                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {biz.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{biz.phone}</span>
                </p>
                {biz.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{biz.address}</span>
                  </p>
                )}

                {/* Metrics */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Products Listed</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bizProducts.length} items
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Recorded Sales</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {biz.currency || 'UGX'} {bizRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setViewingBiz(biz)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => setBizToToggle(biz)}
                  className={`px-3 py-1.5 rounded-xl font-semibold ${
                    biz.status === 'active'
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40'
                  }`}
                >
                  {biz.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Business Details Modal */}
      {viewingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {viewingBiz.name}
              </h3>
              <button
                onClick={() => setViewingBiz(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingBiz.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{viewingBiz.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Address:</span>
                <span className="text-slate-800 dark:text-slate-200">{viewingBiz.address || 'Kampala, Uganda'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Registered On:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {new Date(viewingBiz.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Data Isolation Scope:</span>
                <span className="font-mono font-bold text-purple-600">{viewingBiz.id}</span>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setViewingBiz(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!bizToToggle}
        title={bizToToggle?.status === 'active' ? 'Suspend Business Store' : 'Activate Business Store'}
        message={
          bizToToggle?.status === 'active'
            ? `Suspend "${bizToToggle?.name}"? Its users will be restricted until re-activated.`
            : `Re-activate "${bizToToggle?.name}"?`
        }
        confirmLabel={bizToToggle?.status === 'active' ? 'Suspend Business' : 'Activate Business'}
        isDestructive={bizToToggle?.status === 'active'}
        onConfirm={handleToggleStatus}
        onCancel={() => setBizToToggle(null)}
      />
    </div>
  );
};
