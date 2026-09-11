import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Check,
  Building2,
  Store,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Banknote,
  Truck,
  Users,
  Calendar,
  BookOpen,
  Calculator,
  Receipt,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BusinessModuleConfig } from '../../types';

const DEFAULT_CONFIG: BusinessModuleConfig = {
  pos: true,
  products: true,
  sales: true,
  quotations: true,
  purchases: true,
  cashRegister: true,
  debts: true,
  customers: true,
  suppliers: true,
  expenses: true,
  calendar: true,
  stockAdjustments: true,
  notes: true,
  tools: true,
  marketplace: true,
  reports: true,
  documents: true,
  backup: true,
};

export const BusinessModulesPage: React.FC = () => {
  const { business } = useAuth();
  const [config, setConfig] = useState<BusinessModuleConfig>(DEFAULT_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!business) return;
    const saved = localStorage.getItem(`eagle_modules_${business.id}`);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {}
    }
  }, [business?.id]);

  const handleToggle = (key: keyof BusinessModuleConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    if (!business) return;
    localStorage.setItem(`eagle_modules_${business.id}`, JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const applyPreset = (preset: 'retail' | 'wholesale' | 'service' | 'restaurant') => {
    let next: BusinessModuleConfig = { ...DEFAULT_CONFIG };
    switch (preset) {
      case 'retail':
        next = {
          ...DEFAULT_CONFIG,
          pos: true,
          products: true,
          sales: true,
          cashRegister: true,
          tools: true,
          stockAdjustments: true,
          quotations: false,
          calendar: false,
        };
        break;
      case 'wholesale':
        next = {
          ...DEFAULT_CONFIG,
          pos: false,
          quotations: true,
          purchases: true,
          debts: true,
          suppliers: true,
          customers: true,
          documents: true,
        };
        break;
      case 'service':
        next = {
          ...DEFAULT_CONFIG,
          pos: false,
          products: false,
          stockAdjustments: false,
          purchases: false,
          calendar: true,
          notes: true,
          customers: true,
          expenses: true,
        };
        break;
      case 'restaurant':
        next = {
          ...DEFAULT_CONFIG,
          pos: true,
          sales: true,
          cashRegister: true,
          expenses: true,
          purchases: true,
          quotations: false,
        };
        break;
    }
    setConfig(next);
  };

  const modulesList: { key: keyof BusinessModuleConfig; label: string; desc: string; icon: any }[] = [
    { key: 'pos', label: 'POS Terminal & Barcode Scanner', desc: 'Fast retail checkout & touch point of sale', icon: Store },
    { key: 'cashRegister', label: 'Cash Register & Daily Closing', desc: 'Reconcile drawer, MoMo, Airtel, and cash variance', icon: Banknote },
    { key: 'debts', label: 'Customer Credit & Debts Ledger', desc: 'Aging credit balances & WhatsApp payment reminders', icon: CreditCard },
    { key: 'purchases', label: 'Purchases & Restock Orders (PO)', desc: 'Supplier procurement & automatic stock replenishment', icon: Truck },
    { key: 'tools', label: 'Eagle Tools Suite', desc: 'Margin calculators, URA VAT, labels, and digital business card', icon: Calculator },
    { key: 'quotations', label: 'Quotations & Proforma Estimates', desc: 'Formal price quotes converted into invoices with 1 click', icon: FileText },
    { key: 'expenses', label: 'Expenses & Overhead Ledger', desc: 'Rent, salaries, utility bills, and operating costs', icon: Receipt },
    { key: 'suppliers', label: 'Supplier & Wholesaler Directory', desc: 'Procurement contacts, payment terms, and balances', icon: Truck },
    { key: 'stockAdjustments', label: 'Stock Audit & Inventory Adjustments', desc: 'Physical stock counts, damaged, expired, or lost goods', icon: SlidersHorizontal },
    { key: 'notes', label: 'Business Diary & Customer Notes', desc: 'Pinned notes, daily logs, and customer reminders', icon: BookOpen },
    { key: 'calendar', label: 'Business Calendar & Events', desc: 'Deliveries, tax deadlines, and customer appointments', icon: Calendar },
    { key: 'documents', label: 'Receipt & Invoice Studio', desc: 'Custom header, footer, WhatsApp, and thermal receipt styling', icon: Receipt },
  ];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-purple-600" />
            <span>Business Type & Module Customization</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tailor Eagle Business Manager to your specific trade. Enable only the modules and workflows your business uses.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Check className="h-4 w-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md">
          <Check className="h-4 w-4" />
          <span>Module configuration saved successfully!</span>
        </div>
      )}

      {/* Quick Presets */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Industry Presets:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('retail')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 text-xs font-semibold transition"
          >
            🏪 Retail & Supermarket
          </button>
          <button
            onClick={() => applyPreset('wholesale')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 text-xs font-semibold transition"
          >
            📦 Wholesale & Distribution
          </button>
          <button
            onClick={() => applyPreset('service')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 text-xs font-semibold transition"
          >
            ✂️ Salon, Spa & Professional Services
          </button>
          <button
            onClick={() => applyPreset('restaurant')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 text-xs font-semibold transition"
          >
            🍽️ Restaurant, Cafe & Bar
          </button>
        </div>
      </div>

      {/* Modules Switcher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulesList.map((m) => {
          const Icon = m.icon;
          const isEnabled = config[m.key];
          return (
            <div
              key={m.key}
              onClick={() => handleToggle(m.key)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                isEnabled
                  ? 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isEnabled
                      ? 'bg-purple-50 dark:bg-purple-950 text-purple-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.label}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</p>
                </div>
              </div>

              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
