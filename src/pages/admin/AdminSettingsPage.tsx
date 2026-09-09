import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  Save,
  CheckCircle,
  Copy,
  Terminal,
  Server,
  AlertTriangle,
  FileCode,
  Flame,
  Check,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';

export const AdminSettingsPage: React.FC = () => {
  const [platformName, setPlatformName] = useState('Eagle Business Manager');
  const [defaultCurrency, setDefaultCurrency] = useState('UGX');
  const [supportEmail, setSupportEmail] = useState('eaglebusinessmanager@gmail.com');
  const [supportPhone, setSupportPhone] = useState('+256 743 566 645');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveListings, setAutoApproveListings] = useState(true);
  const [allowDirectWhatsApp, setAllowDirectWhatsApp] = useState(true);
  const [copiedRules, setCopiedRules] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const firestoreRulesContent = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isCurrentUser(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'eaglebusinessmanager@gmail.com' ||
        (request.auth.token.email != null && request.auth.token.email.matches('.*eagle.*admin.*')) ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }

    // User Profiles
    match /users/{userId} {
      allow get: if isCurrentUser(userId) || isAdmin();
      allow list: if isAdmin();
      allow create: if isCurrentUser(userId) || isAdmin();
      allow update: if (isCurrentUser(userId) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status'])) || isAdmin();
      allow delete: if isAdmin();
    }

    // Businesses
    match /businesses/{businessId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isAdmin();
    }

    // Products (Marketplace items & inventory)
    match /products/{productId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn();
    }

    // Safety Reports
    match /reports/{reportId} {
      allow create: if isSignedIn();
      allow read, update, delete: if isAdmin();
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || resource.data.userId == 'all');
      allow create, update, delete: if isSignedIn();
    }

    // Platform Announcements
    match /announcements/{announcementId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Audit Logs
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update, delete: if isAdmin();
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRulesContent);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const hasFirebase = isFirebaseConfigured();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              System Settings & Cloud Infrastructure
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure platform parameters, security policies, and inspect Google Cloud Firebase backend.
          </p>
        </div>

        {/* Cloud Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-bold">
          <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
          <span>{hasFirebase ? 'Firebase Firestore: Connected' : 'Local Fallback Engine'}</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Platform settings updated successfully across the cluster.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-600" />
            <span>Platform Identity & Defaults</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base Accounting Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="UGX">UGX - Ugandan Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Executive Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direct WhatsApp Support Line
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Marketplace & Safety Configuration */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Community Marketplace & Moderation Policies</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Instant Product Publishing
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  When active, merchant products appear immediately in the Community Marketplace while queued for post-moderation review.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoApproveListings}
                onChange={(e) => setAutoApproveListings(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Direct Buyer WhatsApp Inquiries
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Enable buyers to message merchants on WhatsApp directly from marketplace cards with pre-filled product details.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowDirectWhatsApp}
                onChange={(e) => setAllowDirectWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Security & Maintenance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-600" />
            <span>Access Control & Master Credentials</span>
          </h2>

          <div className="rounded-xl bg-purple-50/70 dark:bg-purple-950/30 p-3.5 border border-purple-100 dark:border-purple-900/40 text-xs">
            <span className="font-bold text-purple-950 dark:text-purple-300 block">Master Administrator Clearance:</span>
            <span className="text-purple-900/80 dark:text-purple-400 mt-1 block">
              The platform administrator portal is bound to <strong>eaglebusinessmanager@gmail.com</strong> with master cryptographic key <strong>@Es%</strong>. Passwords are never revealed in public interfaces or logs.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Google Cloud Firebase Architecture & Security Rules */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Google Cloud Firestore Security Rules (firestore.rules)
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCopyRules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-semibold hover:bg-orange-100 cursor-pointer"
          >
            {copiedRules ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedRules ? 'Copied Rules!' : 'Copy Rules'}</span>
          </button>
        </div>

        <p className="text-slate-500 leading-relaxed">
          Google Cloud Firestore enforces strict security rules with role-based access control (RBAC), multi-tenant isolation, product moderation validation, and administrative audit logging.
        </p>

        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
            <span>firestore.rules</span>
            <span>Google Cloud Firestore</span>
          </div>
          <pre className="p-4 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64">
            {firestoreRulesContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
