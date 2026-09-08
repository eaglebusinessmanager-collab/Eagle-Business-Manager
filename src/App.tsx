import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dbService } from './services/db';
import { Announcement } from './types';

// Common UI
import { Navbar } from './components/common/Navbar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { FloatingSupportButton } from './components/common/FloatingSupportButton';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { ProductsPage } from './pages/user/ProductsPage';
import { SalesPage } from './pages/user/SalesPage';
import { CustomersPage } from './pages/user/CustomersPage';
import { InvoicesPage } from './pages/user/InvoicesPage';
import { ReportsPage } from './pages/user/ReportsPage';
import { BusinessProfilePage } from './pages/user/BusinessProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBusinessesPage } from './pages/admin/AdminBusinessesPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminSalesPage } from './pages/admin/AdminSalesPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Icons
import { AlertCircle, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, loading, business, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>('login');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('eagle_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('eagle_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('eagle_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Load announcements for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      dbService.getActiveAnnouncements().then(setAnnouncements).catch(console.error);
    }
  }, [isAuthenticated]);

  // CRITICAL APPLICATION FLOW:
  // When user is not authenticated, ONLY allow 'login' or 'register'.
  // Any attempt to view dashboard or private data redirects immediately to 'login'.
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        if (currentView !== 'register') {
          setCurrentView('login');
        }
      } else {
        // Authenticated: Route based on role
        if (user.role === 'admin') {
          // If on an unauthenticated page, send to admin dashboard
          if (currentView === 'login' || currentView === 'register') {
            setCurrentView('admin-dashboard');
          }
        } else {
          // Role is 'user'
          // Guard: If a normal user tries to access any admin route, redirect to user dashboard immediately
          if (
            currentView.startsWith('admin-') ||
            currentView === 'login' ||
            currentView === 'register'
          ) {
            setCurrentView('dashboard');
          }
        }
      }
    }
  }, [isAuthenticated, user, loading]);

  // Navigation Handler with strict role protection
  const handleNavigate = (view: string) => {
    if (!isAuthenticated) {
      if (view === 'register') {
        setCurrentView('register');
      } else {
        setCurrentView('login');
      }
      return;
    }

    // Role guard: Normal users cannot access admin views
    if (user?.role !== 'admin' && view.startsWith('admin-')) {
      setCurrentView('dashboard');
      return;
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 animate-pulse mb-4">
          <span className="text-2xl font-black tracking-wider">E</span>
        </div>
        <h2 className="text-lg font-bold">Eagle Business Manager</h2>
        <p className="text-xs text-slate-400 mt-1">Authenticating secure session...</p>
      </div>
    );
  }

  // 1. Unauthenticated State: Show ONLY Login or Register Page
  if (!isAuthenticated || !user) {
    if (currentView === 'register') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
          <OfflineIndicator />
          <RegisterPage onNavigateToLogin={() => setCurrentView('login')} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
        <OfflineIndicator />
        <LoginPage onNavigateToRegister={() => setCurrentView('register')} />
      </div>
    );
  }

  // 2. Suspended Account Guard
  if (user.status === 'suspended') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="h-16 w-16 rounded-3xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold">Account Access Suspended</h1>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          Your merchant account has been deactivated by a platform administrator. Please contact system support at support@eaglebusiness.app for assistance.
        </p>
        <button
          onClick={() => {
            logout();
            window.location.reload();
          }}
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold hover:bg-slate-700"
        >
          Sign Out of Account
        </button>
      </div>
    );
  }

  // Active Broadcast Announcements filter
  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncements.includes(a.id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Offline Status Bar */}
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Platform Broadcast Announcement Banners */}
      {visibleAnnouncements.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3 space-y-2">
          {visibleAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border text-xs shadow-xs ${
                ann.type === 'alert'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/60'
                  : ann.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/60'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900/60'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {ann.type === 'alert' && <AlertCircle className="h-4 w-4 text-rose-600" />}
                  {ann.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  {ann.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                </div>
                <div>
                  <span className="font-bold block">{ann.title}</span>
                  <span className="text-[11px] opacity-90">{ann.message}</span>
                </div>
              </div>
              <button
                onClick={() => setDismissedAnnouncements([...dismissedAnnouncements, ann.id])}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* USER PORTAL ROUTES */}
        {currentView === 'dashboard' && <UserDashboard onNavigate={handleNavigate} />}
        {currentView === 'products' && <ProductsPage />}
        {currentView === 'sales' && <SalesPage />}
        {currentView === 'customers' && <CustomersPage />}
        {currentView === 'invoices' && <InvoicesPage />}
        {currentView === 'reports' && <ReportsPage />}
        {currentView === 'profile' && <BusinessProfilePage />}

        {/* ADMIN PORTAL ROUTES (Strictly Protected) */}
        {user.role === 'admin' ? (
          <>
            {currentView === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
            {currentView === 'admin-users' && <AdminUsersPage />}
            {currentView === 'admin-businesses' && <AdminBusinessesPage />}
            {currentView === 'admin-products' && <AdminProductsPage />}
            {currentView === 'admin-sales' && <AdminSalesPage />}
            {currentView === 'admin-announcements' && <AdminAnnouncementsPage />}
            {currentView === 'admin-audit' && <AdminAuditPage />}
            {currentView === 'admin-settings' && <AdminSettingsPage />}
          </>
        ) : (
          currentView.startsWith('admin-') && (
            <div className="rounded-3xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administrative Access Restricted</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                This console is strictly restricted to platform executives with master security clearance. Your current account does not have authorization to view this terminal.
              </p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Return to Merchant Dashboard
              </button>
            </div>
          )
        )}

        {/* Founder Attribution Footer */}
        <footer className="mt-12 mb-20 md:mb-6 py-6 border-t border-slate-200/80 dark:border-slate-800 text-center px-4">
          <div className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-600/10 to-indigo-600/10 border border-amber-500/25 dark:border-amber-400/25 p-4 shadow-2xs">
            <p className="text-[11px] sm:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-blue-400 dark:to-indigo-300">
              MADE WITH LOVE BY EAGLE STYLES (TUSUBIRA BENJAMIN)
            </p>
            <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
              THE FOUNDER OF THE EAGLE ICON MUSIC AND THE EAGLE ICON FOUNDATION AFRICA
            </p>
          </div>
          <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-500">
            Eagle Business Manager • Enterprise Platform • UGX Currency Edition
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar (Optimized for Android) */}
      <MobileBottomNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <FloatingSupportButton />
    </AuthProvider>
  );
}
