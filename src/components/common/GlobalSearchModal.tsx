import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Search,
  X,
  Package,
  Users,
  FileText,
  ShoppingBag,
  TrendingDown,
  BookOpen,
  Truck,
  ArrowRight,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  Product,
  Customer,
  Supplier,
  Sale,
  Invoice,
  Quotation,
  Expense,
  BusinessNote,
  StockAdjustment,
} from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { business } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    sales: Sale[];
    invoices: Invoice[];
    quotations: Quotation[];
    expenses: Expense[];
    notes: BusinessNote[];
    adjustments: StockAdjustment[];
  }>({
    products: [],
    customers: [],
    suppliers: [],
    sales: [],
    invoices: [],
    quotations: [],
    expenses: [],
    notes: [],
    adjustments: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({
        products: [],
        customers: [],
        suppliers: [],
        sales: [],
        invoices: [],
        quotations: [],
        expenses: [],
        notes: [],
        adjustments: [],
      });
    }
  }, [isOpen]);

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!business?.id || !query.trim()) {
      setResults({
        products: [],
        customers: [],
        suppliers: [],
        sales: [],
        invoices: [],
        quotations: [],
        expenses: [],
        notes: [],
        adjustments: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await dbService.searchAll(business.id, query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, business?.id]);

  if (!isOpen) return null;

  const totalResults =
    results.products.length +
    results.customers.length +
    results.suppliers.length +
    results.sales.length +
    results.invoices.length +
    results.quotations.length +
    results.expenses.length +
    results.notes.length +
    results.adjustments.length;

  const handleSelect = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            id={searchInputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, customers, suppliers, quotations, notes, receipts..."
            className="w-full bg-transparent text-sm sm:text-base outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              Searching business catalog offline...
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-8 px-4 text-center">
              <Sparkles className="h-8 w-8 text-blue-500/40 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Instant Offline Unified Search
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Type an SKU, barcode, customer name, quotation number, supplier contact, or note keyword.
              </p>
            </div>
          )}

          {!loading && query.trim() && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for "{query}".
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Package className="h-3.5 w-3.5 text-blue-500" />
                <span>Products ({results.products.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {results.products.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect('products')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        SKU: {p.sku} | Stock: {p.currentStock}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {(p.sellingPrice || 0).toLocaleString()} {business?.currency || 'UGX'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotations */}
          {results.quotations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                <span>Quotations ({results.quotations.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {results.quotations.slice(0, 3).map((q) => (
                  <div
                    key={q.id}
                    onClick={() => handleSelect('quotations')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {q.quotationNumber} — {q.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Status: <span className="uppercase font-semibold">{q.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 font-mono">
                        {(q.total || 0).toLocaleString()} {business?.currency || 'UGX'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                <span>Customers ({results.customers.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {results.customers.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect('customers')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{c.phone}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {results.suppliers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Truck className="h-3.5 w-3.5 text-amber-500" />
                <span>Suppliers ({results.suppliers.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {results.suppliers.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect('suppliers')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{s.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {s.contactPerson ? `${s.contactPerson} • ` : ''}{s.phone}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {results.notes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                <span>Business Notes ({results.notes.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {results.notes.slice(0, 3).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleSelect('notes')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{n.title}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{n.content}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {results.expenses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                <span>Expenses ({results.expenses.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {results.expenses.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => handleSelect('expenses')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{e.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono capitalize">{e.category} • {e.date}</span>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">
                      -{e.amount.toLocaleString()} {business?.currency || 'UGX'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC to close</span>
          <span>Offline search powered by Eagle Business Manager</span>
        </div>
      </div>
    </div>
  );
};
