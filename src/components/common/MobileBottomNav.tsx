import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileText,
  Menu,
  BarChart3,
  Building2,
  Shield,
  LogOut,
  X,
  Store,
  ScanLine,
  Calendar,
  Truck,
  TrendingDown,
  SlidersHorizontal,
  BookOpen,
  Receipt,
  Trash2,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isInAdminView = currentView.startsWith('admin-');

  // If in admin view on mobile, render admin mobile bottom bar
  if (isInAdminView) {
    return (
      <>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 py-1 px-2 safe-area-pb">
          <div className="grid grid-cols-5 gap-1 text-center">
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                currentView === 'admin-dashboard'
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Stats</span>
            </button>

            <button
              onClick={() => onNavigate('admin-users')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                currentView === 'admin-users'
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Users</span>
            </button>

            <button
              onClick={() => onNavigate('admin-businesses')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                currentView === 'admin-businesses'
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Businesses</span>
            </button>

            <button
              onClick={() => onNavigate('admin-sales')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                currentView === 'admin-sales'
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Sales</span>
            </button>

            <button
              onClick={() => setShowMoreMenu(true)}
              className="flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">More</span>
            </button>
          </div>
        </div>

        {/* Admin More Sheet */}
        {showMoreMenu && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
            <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Navigation</p>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => { onNavigate('admin-products'); setShowMoreMenu(false); }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Package className="h-4 w-4 text-purple-600" />
                  Inventory
                </button>
                <button
                  onClick={() => { onNavigate('admin-announcements'); setShowMoreMenu(false); }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Shield className="h-4 w-4 text-amber-600" />
                  Announcements
                </button>
                <button
                  onClick={() => { onNavigate('admin-audit'); setShowMoreMenu(false); }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  Audit Logs
                </button>
                <button
                  onClick={() => { onNavigate('admin-settings'); setShowMoreMenu(false); }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Settings
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => { onNavigate('dashboard'); setShowMoreMenu(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold text-center"
                >
                  Back to User Storefront
                </button>
                <button
                  onClick={async () => { setShowMoreMenu(false); await logout(); }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-bold"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Standard User Bottom Navigation
  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 py-1 px-1 safe-area-pb">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              currentView === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              currentView === 'products'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Products</span>
          </button>

          {/* Quick Sale button highlighted in center */}
          <button
            onClick={() => onNavigate('sales')}
            className="flex flex-col items-center justify-center -mt-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">Sale</span>
          </button>

          <button
            onClick={() => onNavigate('quotations')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              currentView === 'quotations'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Quotes</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </div>

      {/* User More Navigation Sheet */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">All Business Modules</p>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { onNavigate('calendar'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Calendar className="h-4 w-4 text-blue-600" />
                Calendar
              </button>

              <button
                onClick={() => { onNavigate('expenses'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <TrendingDown className="h-4 w-4 text-rose-600" />
                Expenses Log
              </button>

              <button
                onClick={() => { onNavigate('suppliers'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Truck className="h-4 w-4 text-teal-600" />
                Suppliers
              </button>

              <button
                onClick={() => { onNavigate('stock-adjustments'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                Stock Adjustments
              </button>

              <button
                onClick={() => { onNavigate('notes'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <BookOpen className="h-4 w-4 text-purple-600" />
                Notes & Journal
              </button>

              <button
                onClick={() => { onNavigate('documents'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Receipt className="h-4 w-4 text-blue-600" />
                Receipts Studio
              </button>

              <button
                onClick={() => { onNavigate('customers'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Users className="h-4 w-4 text-purple-600" />
                Customers
              </button>

              <button
                onClick={() => { onNavigate('invoices'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <FileText className="h-4 w-4 text-cyan-600" />
                Invoices
              </button>

              <button
                onClick={() => { onNavigate('reports'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Analytics
              </button>

              <button
                onClick={() => { onNavigate('marketplace'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
              >
                <Store className="h-4 w-4 text-blue-600" />
                Marketplace
              </button>

              <button
                onClick={() => { onNavigate('quick-scan'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900"
              >
                <ScanLine className="h-4 w-4 text-indigo-600" />
                Barcode Scan
              </button>

              <button
                onClick={() => { onNavigate('backup'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Database className="h-4 w-4 text-blue-500" />
                Backup & Export
              </button>

              <button
                onClick={() => { onNavigate('recycle-bin'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                Recycle Bin
              </button>

              <button
                onClick={() => { onNavigate('profile'); setShowMoreMenu(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Building2 className="h-4 w-4 text-slate-600" />
                Settings
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={async () => { setShowMoreMenu(false); await logout(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-bold transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out from {user?.fullName}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
