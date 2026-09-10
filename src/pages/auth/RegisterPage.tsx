import React, { useState } from 'react';
import {
  User,
  Phone,
  Lock,
  Building2,
  Tag,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';

const BUSINESS_CATEGORIES = [
  'Retail & Supermarket',
  'Electronics & Appliances',
  'Wholesale & Distribution',
  'Food, Restaurant & Café',
  'Fashion, Clothing & Boutique',
  'Hardware & Building Materials',
  'Pharmacy, Chemist & Healthcare',
  'Auto Spares & Mechanics',
  'Beauty & Salon Services',
  'Printing & Stationery',
  'General Merchandise',
  'Other Services',
];

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onNavigateToLogin,
}) => {
  const handleSwitchToLogin = onSwitchToLogin || onNavigateToLogin || (() => {});
  const { register, error, loading, clearError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Retail & Supermarket');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalValidationError(null);

    if (password !== confirmPassword) {
      setLocalValidationError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setLocalValidationError('Password must be at least 6 characters.');
      return;
    }

    await register({
      fullName,
      usernameOrPhone,
      password,
      businessName,
      businessCategory,
    });
  };

  const displayedError = localValidationError || error;

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-900 shadow-xl shadow-blue-500/20 mb-2">
            <img src="/icon.svg" alt="Eagle Business Manager" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Register Your Business
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Start managing your products, sales, and invoices with UGX 0 free-tier setup.
          </p>
        </div>

        {/* PWA Install Notice */}
        <div className="mt-3 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-900 py-7 px-6 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-colors">
          {displayedError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{displayedError}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. David Mukasa"
                  className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Phone number or username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number or Username (or Email)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrPhone}
                  onChange={(e) => setUsernameOrPhone(e.target.value)}
                  placeholder="e.g. +256701234567 or mukasashop"
                  className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Business Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business Name
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mukasa Electronics Ltd"
                    className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business Category
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Tag className="h-4 w-4" />
                  </div>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  >
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="block w-full pl-10 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {/* Currency Note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Default currency configured as <strong className="text-slate-800 dark:text-slate-200">UGX (Ugandan Shillings)</strong>. You can customize this in business settings.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <span>Creating your business profile...</span>
              ) : (
                <>
                  <span>Complete Registration & Launch</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign In
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
    </div>
  );
};
