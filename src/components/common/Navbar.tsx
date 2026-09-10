import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Building2,
  ChevronDown,
  LayoutDashboard,
  Store,
  Menu,
  X,
  FileText,
  ShoppingBag,
  Users,
  BarChart3,
  Package,
  ScanLine,
  Search,
  Calendar,
  Truck,
  TrendingDown,
  SlidersHorizontal,
  BookOpen,
  Receipt,
  Trash2,
  Database,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  darkMode,
  onToggleDarkMode,
}) => {
  const { user, business, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  useEffect(() => {
    // Check saved theme preference or system default
    const savedTheme = localStorage.getItem('eagle_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
      setIsDark(!darkMode);
      return;
    }
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('eagle_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('eagle_theme', 'dark');
      setIsDark(true);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isInAdminView = currentView.startsWith('admin-');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand & Business Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(isAdmin && isInAdminView ? 'admin-dashboard' : 'dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <img src="/icon.svg" alt="Eagle Crest" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Eagle
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-mono">
                  {business?.currency || 'UGX'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
                {business?.name || 'Eagle Business Manager'}
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links for User */}
          {!isInAdminView && (
            <nav className="hidden lg:flex items-center gap-1 ml-4 text-xs font-semibold">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('products')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'products'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => onNavigate('sales')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'sales'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => onNavigate('quotations')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'quotations'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Quotations
              </button>
              <button
                onClick={() => onNavigate('customers')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'customers'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => onNavigate('expenses')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'expenses'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => onNavigate('calendar')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'calendar'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Calendar
              </button>

              {/* Tools & Management Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                    [
                      'suppliers',
                      'notes',
                      'stock-adjustments',
                      'documents',
                      'recycle-bin',
                      'backup',
                      'reports',
                      'marketplace',
                      'quick-scan',
                    ].includes(currentView)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span>More Tools</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {toolsDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setToolsDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Business Operations
                      </div>
                      <button
                        onClick={() => { onNavigate('suppliers'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Truck className="h-4 w-4 text-teal-600" />
                        <span>Suppliers Directory</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('stock-adjustments'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                        <span>Stock Adjustments & Audit</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('notes'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <span>Notes & Journal</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('documents'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span>Documents & Receipts</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('reports'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        <span>Financial Analytics</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('marketplace'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Store className="h-4 w-4 text-blue-600" />
                        <span>Community Marketplace</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('quick-scan'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ScanLine className="h-4 w-4 text-indigo-600" />
                        <span>Barcode / QR Scan</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Security & Data
                      </div>
                      <button
                        onClick={() => { onNavigate('recycle-bin'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                        <span>Recycle Bin Recovery</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('backup'); setToolsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Database className="h-4 w-4 text-blue-500" />
                        <span>Data Export & Backup</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          )}

          {/* Desktop Navigation for Admin */}
          {isInAdminView && (
            <nav className="hidden md:flex items-center gap-1 ml-6 text-xs font-semibold">
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-dashboard'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onNavigate('admin-users')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-users'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => onNavigate('admin-businesses')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-businesses'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Businesses
              </button>
              <button
                onClick={() => onNavigate('admin-products')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-products'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => onNavigate('admin-sales')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-sales'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Platform Sales
              </button>
              <button
                onClick={() => onNavigate('admin-announcements')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-announcements'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Announcements
              </button>
              <button
                onClick={() => onNavigate('admin-audit')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-audit'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => onNavigate('admin-settings')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentView === 'admin-settings'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Settings
              </button>
            </nav>
          )}
        </div>

        {/* Right Action Tools: Search, PWA install, Theme toggle, Role Switcher & Profile Dropdown */}
        <div className="flex items-center gap-2">
          {/* Universal Search Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              title="Search catalog (Ctrl+K)"
            >
              <Search className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline text-xs font-medium">Search...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-700 text-slate-400 rounded border border-slate-200 dark:border-slate-600">
                ⌘K
              </kbd>
            </button>
          )}

          {/* In-app PWA install button */}
          <PWAInstallButton />

          {/* Admin Switcher Pill (Visible only if user is an admin) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate(isInAdminView ? 'dashboard' : 'admin-dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                isInAdminView
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'
              }`}
              title={isInAdminView ? 'Switch to User Storefront' : 'Switch to Admin Portal'}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {isInAdminView ? 'User Portal' : 'Admin Portal'}
              </span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Account Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-xl p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                  {user?.role === 'admin' ? 'Administrator' : 'Business Owner'}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      @{user?.username} • {user?.phone || user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Business Profile & Settings
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('backup');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Database className="h-4 w-4 text-blue-500" />
                      Data Export & Backup
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate(isInAdminView ? 'dashboard' : 'admin-dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                      >
                        <Shield className="h-4 w-4" />
                        {isInAdminView ? 'Switch to Storefront' : 'Open Admin Panel'}
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu for extra links */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1 max-h-[85vh] overflow-y-auto">
          {!isInAdminView ? (
            <>
              <button
                onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                Dashboard
              </button>
              <button
                onClick={() => { onNavigate('products'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Package className="h-4 w-4 text-emerald-600" />
                Products & Inventory
              </button>
              <button
                onClick={() => { onNavigate('sales'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ShoppingBag className="h-4 w-4 text-blue-600" />
                Sales Terminal
              </button>
              <button
                onClick={() => { onNavigate('quotations'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
              >
                <FileText className="h-4 w-4 text-indigo-600" />
                Quotations & Estimates
              </button>
              <button
                onClick={() => { onNavigate('calendar'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Calendar className="h-4 w-4 text-blue-600" />
                Business Calendar
              </button>
              <button
                onClick={() => { onNavigate('expenses'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <TrendingDown className="h-4 w-4 text-rose-600" />
                Business Expenses
              </button>
              <button
                onClick={() => { onNavigate('suppliers'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Truck className="h-4 w-4 text-teal-600" />
                Suppliers Directory
              </button>
              <button
                onClick={() => { onNavigate('stock-adjustments'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                Stock Adjustments & Audit
              </button>
              <button
                onClick={() => { onNavigate('notes'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <BookOpen className="h-4 w-4 text-purple-600" />
                Business Notes & Journal
              </button>
              <button
                onClick={() => { onNavigate('documents'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Receipt className="h-4 w-4 text-blue-600" />
                Documents & Receipts Studio
              </button>
              <button
                onClick={() => { onNavigate('customers'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Users className="h-4 w-4 text-purple-600" />
                Customers
              </button>
              <button
                onClick={() => { onNavigate('reports'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Reports & Analytics
              </button>
              <button
                onClick={() => { onNavigate('recycle-bin'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                Recycle Bin Recovery
              </button>
              <button
                onClick={() => { onNavigate('backup'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Database className="h-4 w-4 text-blue-500" />
                Data Export & Backup
              </button>
              <button
                onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Building2 className="h-4 w-4 text-slate-600" />
                Business Profile & Settings
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { onNavigate('admin-dashboard'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-800 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard Overview
              </button>
              <button
                onClick={() => { onNavigate('admin-users'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Platform Users
              </button>
              <button
                onClick={() => { onNavigate('admin-businesses'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Registered Businesses
              </button>
              <button
                onClick={() => { onNavigate('admin-products'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Platform Inventory
              </button>
              <button
                onClick={() => { onNavigate('admin-sales'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Platform Sales Monitor
              </button>
              <button
                onClick={() => { onNavigate('admin-announcements'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Broadcast Announcements
              </button>
              <button
                onClick={() => { onNavigate('admin-audit'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Security Audit Logs
              </button>
              <button
                onClick={() => { onNavigate('admin-settings'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Platform Settings
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
