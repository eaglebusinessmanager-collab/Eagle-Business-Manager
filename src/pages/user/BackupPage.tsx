import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  FileJson,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

export const BackupPage: React.FC = () => {
  const { business } = useAuth();
  const [stats, setStats] = useState<{
    products: number;
    sales: number;
    customers: number;
    suppliers: number;
    expenses: number;
    quotations: number;
    notes: number;
    events: number;
    storageKB: number;
  }>({
    products: 0,
    sales: 0,
    customers: 0,
    suppliers: 0,
    expenses: 0,
    quotations: 0,
    notes: 0,
    events: 0,
    storageKB: 0,
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const loadStats = async () => {
    if (!business?.id) return;
    try {
      const [prods, sales, custs, supps, exps, quos, notes, evts] = await Promise.all([
        dbService.getProducts(business.id),
        dbService.getSales(business.id),
        dbService.getCustomers(business.id),
        dbService.getSuppliers(business.id),
        dbService.getExpenses(business.id),
        dbService.getQuotations(business.id),
        dbService.getNotes(business.id),
        dbService.getCalendarEvents(business.id),
      ]);

      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalSize += (localStorage.getItem(key) || '').length;
        }
      }

      setStats({
        products: prods.length,
        sales: sales.length,
        customers: custs.length,
        suppliers: supps.length,
        expenses: exps.length,
        quotations: quos.length,
        notes: notes.length,
        events: evts.length,
        storageKB: Math.round((totalSize * 2) / 1024), // UTF-16 bytes to KB
      });
    } catch (e) {
      console.error('Error loading backup stats:', e);
    }
  };

  useEffect(() => {
    loadStats();
  }, [business?.id]);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Export JSON Full Backup
  const exportFullJson = async () => {
    if (!business?.id) return;
    const [prods, sales, custs, supps, exps, quos, invs, notes, evts, adjs, rc] = await Promise.all([
      dbService.getProducts(business.id),
      dbService.getSales(business.id),
      dbService.getCustomers(business.id),
      dbService.getSuppliers(business.id),
      dbService.getExpenses(business.id),
      dbService.getQuotations(business.id),
      dbService.getInvoices(business.id),
      dbService.getNotes(business.id),
      dbService.getCalendarEvents(business.id),
      dbService.getStockAdjustments(business.id),
      dbService.getReceiptConfig(business.id),
    ]);

    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      business,
      products: prods,
      sales,
      customers: custs,
      suppliers: supps,
      expenses: exps,
      quotations: quos,
      invoices: invs,
      notes,
      calendarEvents: evts,
      stockAdjustments: adjs,
      receiptConfig: rc,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Eagle_Business_Backup_${business.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Full business database backup downloaded as JSON!');
  };

  // 2. Export Products CSV
  const exportProductsCsv = async () => {
    if (!business?.id) return;
    const prods = await dbService.getProducts(business.id);
    const headers = ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'BuyingPrice', 'SellingPrice', 'CurrentStock', 'MinStockLevel'];
    const rows = prods.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode || '',
      p.category || '',
      p.buyingPrice,
      p.sellingPrice,
      p.currentStock,
      p.minStockLevel,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Products_Catalog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Products catalog exported to CSV successfully!');
  };

  // 3. Export Sales CSV
  const exportSalesCsv = async () => {
    if (!business?.id) return;
    const sales = await dbService.getSales(business.id);
    const headers = ['SaleNumber', 'Date', 'CustomerName', 'Total', 'PaymentMethod', 'Status', 'ItemsCount'];
    const rows = sales.map((s) => [
      s.saleNumber,
      s.createdAt,
      `"${(s.customerName || 'Walk-in').replace(/"/g, '""')}"`,
      s.total,
      s.paymentMethod,
      s.paymentStatus,
      s.items.length,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Sales transactions exported to CSV successfully!');
  };

  // 4. Export Expenses CSV
  const exportExpensesCsv = async () => {
    if (!business?.id) return;
    const exps = await dbService.getExpenses(business.id);
    const headers = ['ID', 'Date', 'Title', 'Category', 'Amount', 'PaymentMethod', 'Notes'];
    const rows = exps.map((e) => [
      e.id,
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.paymentMethod,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Business_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Expenses exported to CSV successfully!');
  };

  // Handle JSON Import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;

    if (!window.confirm('Importing data will merge records into your current business catalog. Proceed?')) {
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.products && Array.isArray(data.products)) {
        for (const p of data.products) {
          await dbService.createProduct({ ...p, businessId: business.id });
        }
      }
      if (data.customers && Array.isArray(data.customers)) {
        for (const c of data.customers) {
          await dbService.createCustomer({ ...c, businessId: business.id });
        }
      }
      if (data.suppliers && Array.isArray(data.suppliers)) {
        for (const s of data.suppliers) {
          await dbService.createSupplier({ ...s, businessId: business.id });
        }
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const exp of data.expenses) {
          await dbService.createExpense({ ...exp, businessId: business.id });
        }
      }
      if (data.notes && Array.isArray(data.notes)) {
        for (const n of data.notes) {
          await dbService.createNote({ ...n, businessId: business.id });
        }
      }

      showNotice('Data backup imported and restored successfully!');
      loadStats();
    } catch (err) {
      alert('Error parsing or importing backup file: ' + err);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Data Export & Backup Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete business data sovereignty. Export your database in JSON or CSV for Excel, and restore anytime.
          </p>
        </div>

        <button
          onClick={loadStats}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Database Footprint Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Products in Catalog</span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {stats.products}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Sales Transactions</span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {stats.sales}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Customers & Suppliers</span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {stats.customers + stats.suppliers}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Local Cache Footprint</span>
          <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono block mt-1">
            {stats.storageKB} KB
          </span>
        </div>
      </div>

      {/* Export Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full JSON Backup */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Comprehensive JSON Backup
              </h2>
              <p className="text-[11px] text-slate-400">
                Full snapshot of inventory, customers, suppliers, quotations, invoices, expenses, notes, and receipt layouts.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Zero data lock-in. Portable across any device.</span>
            </p>
          </div>

          <button
            onClick={exportFullJson}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            <span>Download Complete JSON Backup</span>
          </button>
        </div>

        {/* Restore / Import */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Restore Database from Backup
              </h2>
              <p className="text-[11px] text-slate-400">
                Import and restore products, customers, and business data from a previously exported JSON backup file.
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              disabled={isImporting}
              onChange={handleFileImport}
              id="backupFileInput"
              className="hidden"
            />
            <label
              htmlFor="backupFileInput"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer transition"
            >
              <Upload className="h-4 w-4" />
              <span>{isImporting ? 'Restoring Data...' : 'Select Backup JSON File to Restore'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* CSV Spreadsheet Exports */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Excel & Google Sheets CSV Exports
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Products & Inventory CSV
              </span>
              <span className="text-[11px] text-slate-400">
                SKUs, buying & selling prices, stock quantities.
              </span>
            </div>
            <button
              onClick={exportProductsCsv}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Products</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Sales Ledger CSV
              </span>
              <span className="text-[11px] text-slate-400">
                Sale receipts, customer names, payment methods, totals.
              </span>
            </div>
            <button
              onClick={exportSalesCsv}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Sales</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Expenses Log CSV
              </span>
              <span className="text-[11px] text-slate-400">
                Business overhead, categories, disbursement dates.
              </span>
            </div>
            <button
              onClick={exportExpensesCsv}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Expenses</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
