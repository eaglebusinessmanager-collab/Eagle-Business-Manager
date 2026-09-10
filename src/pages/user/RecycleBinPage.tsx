import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  Package,
  Users,
  Truck,
  FileText,
  TrendingDown,
  BookOpen,
  CheckCircle2,
  User,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { RecycleBinItem } from '../../types';

export const RecycleBinPage: React.FC = () => {
  const { business } = useAuth();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!business?.id) return;
    try {
      const data = await dbService.getRecycleBinItems(business.id);
      setItems(data);
    } catch (e) {
      console.error('Error loading recycle bin:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRestore = async (item: RecycleBinItem) => {
    if (window.confirm(`Restore "${item.itemName}" back to active ${item.itemType}?`)) {
      try {
        await dbService.restoreRecycleBinItem(item.id);
        showNotification(`Successfully restored "${item.itemName}"!`);
        loadData();
      } catch (e) {
        alert('Failed to restore item: ' + e);
      }
    }
  };

  const handlePermanentDelete = async (item: RecycleBinItem) => {
    if (
      window.confirm(
        `Are you absolutely sure? This will PERMANENTLY delete "${item.itemName}". This cannot be undone.`
      )
    ) {
      try {
        await dbService.permanentDeleteRecycleBinItem(item.id);
        showNotification(`Permanently deleted "${item.itemName}".`);
        loadData();
      } catch (e) {
        alert('Failed to permanently delete: ' + e);
      }
    }
  };

  const handleEmptyBin = async () => {
    if (items.length === 0) return;
    if (
      window.confirm(
        `Empty entire recycle bin? All ${items.length} items will be permanently erased. This cannot be undone.`
      )
    ) {
      try {
        await Promise.all(items.map((it) => dbService.permanentDeleteRecycleBinItem(it.id)));
        showNotification('Recycle bin emptied successfully.');
        loadData();
      } catch (e) {
        alert('Failed to empty recycle bin: ' + e);
      }
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'customer':
        return <Users className="h-4 w-4 text-emerald-500" />;
      case 'supplier':
        return <Truck className="h-4 w-4 text-teal-500" />;
      case 'quotation':
      case 'invoice':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4 text-rose-500" />;
      case 'note':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <Trash2 className="h-4 w-4 text-slate-500" />;
    }
  };

  const filtered = items.filter((it) => {
    const matchTerm = (it.itemName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || it.itemType === filterType;
    return matchTerm && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-rose-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Recycle Bin & Data Recovery
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Safety net for deleted products, customers, quotations, notes, and records. Restore accidentally deleted items anytime.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleEmptyBin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Empty Recycle Bin</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deleted items..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filter deleted items by type"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Item Types</option>
          <option value="product">Products</option>
          <option value="customer">Customers</option>
          <option value="supplier">Suppliers</option>
          <option value="quotation">Quotations</option>
          <option value="invoice">Invoices</option>
          <option value="expense">Expenses</option>
          <option value="note">Notes</option>
        </select>
      </div>

      {/* Recycle Bin Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">Item Details</th>
                <th className="p-3">Type</th>
                <th className="p-3">Deleted By</th>
                <th className="p-3">Date Deleted</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getItemIcon(item.itemType)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.itemName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {item.originalId}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.itemType}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{item.deletedByName || 'Staff'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(item.deletedAt).toLocaleDateString()}{' '}
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                        title="Permanently Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                    <Trash2 className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    Recycle bin is clean. No deleted records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
