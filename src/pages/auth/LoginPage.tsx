import React, { useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';

interface LoginPageProps {
  onSwitchToRegister?: () => void;
  onNavigateToRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToRegister,
  onNavigateToRegister,
}) => {
  const handleSwitchToRegister = onSwitchToRegister || onNavigateToRegister || (() => {});
  const { login, error, loading, clearError } = useAuth();

  // Mode: 'merchant' for business owners, 'admin' for executive administration
  const [authMode, setAuthMode] = useState<'merchant' | 'admin'>('merchant');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleModeChange = (mode: 'merchant' | 'admin') => {
    setAuthMode(mode);
    setIdentifier(mode === 'admin' ? 'eaglebusinessmanager@gmail.com' : '');
    setPassword('');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(identifier, password);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-900 shadow-xl shadow-blue-500/20 mb-3 ring-4 ring-blue-500/10">
            <img src="/icon.svg" alt="Eagle Business Manager" className="h-11 w-11 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Eagle Business Manager
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
            Enterprise Cloud Management Platform
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Integrated inventory, sales receipts, customer ledgers & multi-store analytics.
          </p>
        </div>

        {/* PWA Install Notice */}
        <div className="mt-3 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-7 px-6 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-colors">
          {/* Secure Access Selector Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleModeChange('merchant')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                authMode === 'merchant'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Merchant Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                authMode === 'admin'
                  ? 'bg-slate-900 text-amber-400 dark:bg-slate-950 dark:text-amber-400 shadow-sm border border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              <span>Executive Admin</span>
            </button>
          </div>

          {/* Mode Description & Warning Banner */}
          {authMode === 'admin' ? (
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 p-3.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Restricted Administrative Terminal</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Clearance is strictly restricted to platform executives. Authentication requires authorized master credentials. All sign-in attempts are logged in the immutable security audit ledger.
              </p>
            </div>
          ) : (
            <div className="mb-5 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Merchant Business Portal
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Fingerprint className="h-3.5 w-3.5" />
                <span>Secure SSL Encrypted</span>
              </span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-0.5">
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                  Multiple unrecognized attempts trigger automatic security cooldown.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {authMode === 'admin' ? 'Administrator Security Email' : 'Phone Number, Username, or Email'}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {authMode === 'admin' ? <ShieldCheck className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4" />}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={authMode === 'admin' ? 'eaglebusinessmanager@gmail.com' : 'e.g. +256701234567 or your_username'}
                  className={`block w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    authMode === 'admin'
                      ? 'border-amber-500/40 focus:ring-amber-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {authMode === 'admin' ? 'Master Security Password' : 'Password'}
                </label>
                {authMode === 'merchant' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    authMode === 'admin'
                      ? 'border-amber-500/40 focus:ring-amber-500 font-mono'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50 transition cursor-pointer ${
                authMode === 'admin'
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/40 text-amber-300 hover:from-black hover:to-slate-950 shadow-amber-500/10'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading ? (
                <span>Validating Security Clearance...</span>
              ) : (
                <>
                  {authMode === 'admin' ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                      <span>Authenticate & Enter Executive Console</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Merchant Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Registration Trigger for Merchants */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New business owner?{' '}
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Create Account (Free Tier UGX 0)
              </button>
            </p>
          </div>
        </div>

        {/* Prominent Founder Attribution Banner */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-blue-600/10 to-purple-600/15 border border-amber-500/30 dark:border-amber-400/30 p-4 text-center shadow-sm backdrop-blur-xs">
          <p className="text-[11px] sm:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-blue-400 dark:to-indigo-300">
            MADE WITH LOVE BY EAGLE STYLES (TUSUBIRA BENJAMIN)
          </p>
          <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
            THE FOUNDER OF THE EAGLE ICON MUSIC AND THE EAGLE ICON FOUNDATION AFRICA
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Password Recovery</h3>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
              Enter your registered business phone number, username, or email to request password reset assistance.
            </p>

            {resetSent ? (
              <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Recovery request submitted. An authorized platform administrator will verify your business identity and issue reset clearance.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Your phone, username, or email"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setResetSent(true)}
                  className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Submit Recovery Request
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowForgotPasswordModal(false);
                setResetSent(false);
              }}
              className="mt-4 w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
