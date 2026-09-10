import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { StockAdjustment, StockAdjustmentReason, Product } from '../../types';

export const StockAdjustmentsPage: React.FC = () => {
  const { business, user } = useAuth();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'decrease' | 'increase'>('decrease');
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState<StockAdjustmentReason>('damaged');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    if (!business?.id) return;
    try {
      const [adjList, prodList] = await Promise.all([
        dbService.getStockAdjustments(business.id),
        dbService.getProducts(business.id),
      ]);
      setAdjustments(adjList);
      setProducts(prodList);
    } catch (err) {
      console.error('Error loading stock adjustments:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
  const delta = adjustmentType === 'decrease' ? -Math.abs(amount) : Math.abs(amount);
  const calculatedNewStock = Math.max(0, currentStock + delta);

  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !user || !selectedProduct) {
      alert('Please select a product.');
      return;
    }

    if (amount <= 0) {
      alert('Adjustment quantity must be greater than zero.');
      return;
    }

    try {
      await dbService.recordStockAdjustment({
        businessId: business.id,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        previousQuantity: currentStock,
        adjustmentAmount: delta,
        newQuantity: calculatedNewStock,
        reason,
        notes,
        userId: user.id,
        userName: user.name || 'Staff User',
      });

      setIsModalOpen(false);
      setSelectedProductId('');
      setAmount(1);
      setNotes('');
      loadData();
    } catch (err) {
      alert('Failed to record stock adjustment: ' + err);
    }
  };

  const getReasonBadge = (r: StockAdjustmentReason) => {
    switch (r) {
      case 'damaged':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Damaged Goods</span>;
      case 'lost':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Lost / Missing</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Expired Shelf Life</span>;
      case 'found':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Found / Audit Surplus</span>;
      case 'correction':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Count Correction</span>;
      case 'returned_to_supplier':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Returned to Supplier</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Other</span>;
    }
  };

  const filtered = adjustments.filter((a) => {
    const matchesTerm =
      a.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesReason = filterReason === 'all' || a.reason === filterReason;
    return matchesTerm && matchesReason;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-amber-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Stock Adjustments & Audit
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log inventory discrepancies, damages, expired goods, or manual stock audit reconciliations.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProductId(products[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, SKU, or audit notes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value)}
          aria-label="Filter adjustments by reason"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Adjustment Reasons</option>
          <option value="damaged">Damaged Goods</option>
          <option value="lost">Lost / Missing</option>
          <option value="expired">Expired Shelf Life</option>
          <option value="found">Found / Audit Surplus</option>
          <option value="correction">Count Correction</option>
          <option value="returned_to_supplier">Returned to Supplier</option>
        </select>
      </div>

      {/* Adjustments Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Product & SKU</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-center">Previous</th>
                <th className="p-3 text-center">Adjustment</th>
                <th className="p-3 text-center">New Quantity</th>
                <th className="p-3">Recorded By</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((adj) => (
                <tr key={adj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(adj.createdAt).toLocaleDateString()}{' '}
                    <span className="text-[10px] text-slate-400">
                      {new Date(adj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {adj.productName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {adj.sku}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">{getReasonBadge(adj.reason)}</td>
                  <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400 font-medium">
                    {adj.previousQuantity}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-extrabold px-2 py-0.5 rounded-md ${
                        adj.adjustmentAmount > 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {adj.adjustmentAmount > 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3" />
                          +{adj.adjustmentAmount}
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3" />
                          {adj.adjustmentAmount}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {adj.newQuantity}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{adj.userName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">
                    {adj.notes || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No stock adjustments logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Stock Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Record Stock Adjustment
            </h2>

            <form onSubmit={handleRecordAdjustment} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                >
                  <option value="" disabled>Choose product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku}) — Current Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Direction */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('decrease')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === 'decrease'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4 text-rose-600" />
                    <span>Decrease Stock (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('increase')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === 'increase'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    <span>Increase Stock (+)</span>
                  </button>
                </div>
              </div>

              {/* Quantity and Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Units to Adjust *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="damaged">Damaged Goods</option>
                    <option value="lost">Lost / Missing Goods</option>
                    <option value="expired">Expired Shelf Life</option>
                    <option value="found">Found / Audit Surplus</option>
                    <option value="correction">Count Correction</option>
                    <option value="returned_to_supplier">Returned to Supplier</option>
                    <option value="other">Other Reason</option>
                  </select>
                </div>
              </div>

              {/* Calculation Preview Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Previous Stock:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">
                    {currentStock}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[10px]">Adjustment:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      delta > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">New Resulting Stock:</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">
                    {calculatedNewStock}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason Details & Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this adjustment was made for business audit logs..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProductId}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
