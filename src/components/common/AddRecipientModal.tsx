import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Tag, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Customer, CustomerType } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { normalizeUgandanPhone, isValidUgandanPhone, formatUgandanPhoneDisplay } from '../../utils/phone';

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipientSaved: (recipient: Customer) => void;
  initialName?: string;
  initialPhone?: string;
}

const COMMON_LOCATIONS = [
  'Kampala Central',
  'Ntinda, Kampala',
  'Kololo, Kampala',
  'Entebbe',
  'Jinja',
  'Wakiso',
  'Mukono',
  'Mbarara',
  'Gulu',
  'Mbale',
];

export const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  isOpen,
  onClose,
  onRecipientSaved,
  initialName = '',
  initialPhone = '',
}) => {
  const { business } = useAuth();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<CustomerType>('regular');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Full name of the recipient is required.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMessage('A valid contact phone number is required.');
      return;
    }

    const normalizedPhone = normalizeUgandanPhone(trimmedPhone);
    if (!isValidUgandanPhone(normalizedPhone) && normalizedPhone.length < 9) {
      setErrorMessage(
        'Please enter a valid Ugandan phone number (e.g. 07XXXXXXXX or +256 7XXXXXXXX).'
      );
      return;
    }

    if (!business?.id) {
      setErrorMessage('Business context missing. Please try again.');
      return;
    }

    setSaving(true);
    try {
      const newCustomer: Customer = {
        id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        businessId: business.id,
        name: trimmedName,
        phone: formatUgandanPhoneDisplay(normalizedPhone),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        type: type,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await dbService.createCustomer(newCustomer);
      onRecipientSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('Error saving recipient:', err);
      setErrorMessage(err.message || 'Failed to save recipient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Add New Recipient
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Register customer for sales, invoices, receipts, and order tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation error */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nabukenya Grace or Mukasa Denis"
                className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Phone Number with Ugandan Support */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                Uganda (+256) MTN / Airtel
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX or +256 7XXXXXXXX"
                className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
              />
            </div>
            {phone && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Standard format: {formatUgandanPhoneDisplay(normalizeUgandanPhone(phone))}
              </p>
            )}
          </div>

          {/* Customer Type & Optional Email in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Customer Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Tag className="h-4 w-4" />
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomerType)}
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="regular">Regular Customer</option>
                  <option value="retail">Retail Buyer</option>
                  <option value="wholesale">Wholesale Buyer</option>
                  <option value="vip">VIP Client</option>
                  <option value="distributor">Distributor / Agent</option>
                  <option value="walk_in">Walk-in Customer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Address / Location */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Address / Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 12, Kampala Road or Ntinda Stage"
                className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            {/* Quick Location Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_LOCATIONS.slice(0, 6).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setAddress(loc)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[10px] text-slate-600 dark:text-slate-300 hover:text-blue-600 transition border border-slate-200 dark:border-slate-700"
                >
                  +{loc}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Preferences
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery notes, preferred payment channel, credit terms, etc."
                className="block w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons as requested: SAVE RECIPIENT, CANCEL */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>SAVE RECIPIENT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
