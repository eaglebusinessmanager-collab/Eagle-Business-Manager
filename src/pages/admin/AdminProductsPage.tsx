import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Building2,
  Tag,
  DollarSign,
  Filter,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { Business, Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBizId, setSelectedBizId] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pList, bList] = await Promise.all([
          dbService.getAllProductsPlatform(),
          dbService.getAllBusinesses(),
        ]);
        setProducts(pList);
        setBusinesses(bList);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getBusinessName = (bizId: string) => {
    const b = businesses.find((item) => item.id === bizId);
    return b ? b.name : bizId;
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBiz = selectedBizId === 'all' || p.businessId === selectedBizId;
    let matchStock = true;
    if (stockFilter === 'low') matchStock = p.currentStock <= p.minStockLevel && p.currentStock > 0;
    if (stockFilter === 'out') matchStock = p.currentStock === 0;

    return matchSearch && matchBiz && matchStock;
  });

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            <span>Platform Inventory Monitor</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-tenant product stock levels, pricing, and system-wide inventory replenishment alerts.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or SKU across platform..."
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <select
          value={selectedBizId}
          onChange={(e) => setSelectedBizId(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          <option value="all">Filter by Business: All Businesses</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          <option value="all">Stock: All</option>
          <option value="low">Low Stock Alerts Only</option>
          <option value="out">Out of Stock Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Owning Business</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const isLow = p.currentStock <= p.minStockLevel && p.currentStock > 0;
                const isOut = p.currentStock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{getBusinessName(p.businessId)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      UGX {p.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {p.currentStock} units
                    </td>
                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          HEALTHY
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
