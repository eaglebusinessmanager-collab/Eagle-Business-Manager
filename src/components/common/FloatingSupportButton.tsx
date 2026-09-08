import React, { useState } from 'react';
import {
  Headphones,
  Phone,
  Mail,
  MessageCircle,
  X,
  Copy,
  Check,
  ExternalLink,
  Send,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FloatingSupportButton: React.FC = () => {
  const { user, business } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick message state
  const [subject, setSubject] = useState('Inquiry & Assistance');
  const [message, setMessage] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const HOTLINE_1 = '+256743566645';
  const HOTLINE_2 = '+256791200151';
  const WHATSAPP_NUMBER = '+256743566645';
  const SUPPORT_EMAIL = 'eaglebusinessmanager@gmail.com';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateWhatsAppUrl = (customText?: string) => {
    const rawNum = WHATSAPP_NUMBER.replace(/\D/g, '');
    const storeInfo = business?.name ? ` [Store: ${business.name}]` : '';
    const sender = user?.fullName || 'Valued Merchant';
    const text =
      customText ||
      `Hello Eagle Business Manager Support! My name is ${sender}${storeInfo}. I need assistance with: `;
    return `https://wa.me/${rawNum}?text=${encodeURIComponent(text)}`;
  };

  const generateMailtoUrl = () => {
    const storeInfo = business?.name ? ` [Store: ${business.name}]` : '';
    const body = `Hello Eagle Support Team,%0D%0A%0D%0AMerchant: ${user?.fullName || 'Store Owner'}${storeInfo}%0D%0AContact: ${senderContact || user?.phone || 'Not provided'}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(message || 'I require technical assistance.')}%0D%0A%0D%0AThank you!`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `[Eagle Support] ${subject}${storeInfo}`
    )}&body=${body}`;
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  const handleResetForm = () => {
    setMessage('');
    setSubmitted(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center group">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2 px-3.5 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-400/40"
          aria-label="Open 24/7 Support Center"
          title="Need Help? Contact 24/7 Support"
        >
          {/* Pulsing indicator */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </span>

          <Headphones className="h-5 w-5 animate-bounce-short" />
          <span className="hidden sm:inline text-xs font-bold tracking-tight pr-1">
            24/7 Support
          </span>
        </button>
      </div>

      {/* Support Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Headphones className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5">
                      <span>Eagle Support Desk</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                        Online
                      </span>
                    </h2>
                    <p className="text-[11px] text-blue-200">
                      Direct hotlines, WhatsApp chat & official email
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  aria-label="Close Support"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Founder Header Note */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-amber-200">
                <span className="flex items-center gap-1 font-semibold">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>Executive Priority Support</span>
                </span>
                <span className="font-mono text-white/80">Available 24/7</span>
              </div>
            </div>

            {/* Scrollable Support Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* WhatsApp Primary Fast-Track */}
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/70 dark:border-emerald-800/60 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        WhatsApp Instant Support
                      </h3>
                      <p className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {WHATSAPP_NUMBER}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Fastest
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Open WhatsApp Chat</span>
                    <ExternalLink className="h-3 w-3 opacity-80" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(WHATSAPP_NUMBER, 'whatsapp')}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
                    title="Copy WhatsApp Number"
                  >
                    {copiedKey === 'whatsapp' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Voice Hotlines */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Direct Call Hotlines</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Toll & Mobile Lines</span>
                </div>

                {/* Hotline 1 */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
                      Hotline 1 (Primary)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {HOTLINE_1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${HOTLINE_1}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(HOTLINE_1, 'hotline1')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Copy Number"
                    >
                      {copiedKey === 'hotline1' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Hotline 2 */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                      Hotline 2 (Secondary)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {HOTLINE_2}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${HOTLINE_2}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(HOTLINE_2, 'hotline2')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Copy Number"
                    >
                      {copiedKey === 'hotline2' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Official Email */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Official Support Email</h3>
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {SUPPORT_EMAIL}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={generateMailtoUrl()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-black text-white font-bold text-xs transition"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Send Email Now</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(SUPPORT_EMAIL, 'email')}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Copy Email"
                  >
                    {copiedKey === 'email' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Inquiry Form */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Send Instant Inquiry</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Direct Dispatch</span>
                </div>

                {submitted ? (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-300 dark:border-emerald-800 space-y-2 text-center">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">
                      Message Prepared Successfully!
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Forward your inquiry directly to our priority support team:
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href={generateWhatsAppUrl(
                          `[Support Request: ${subject}]\nMerchant: ${user?.fullName || 'Store Owner'}\nContact: ${senderContact || 'Not provided'}\nDetails: ${message}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Dispatch to WhatsApp Support</span>
                      </a>
                      <a
                        href={generateMailtoUrl()}
                        className="py-2 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-900"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Dispatch via Email</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline pt-1"
                      >
                        Write another inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleQuickSubmit} className="space-y-2.5">
                    <div>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="Inquiry & Assistance">General Inquiry & Assistance</option>
                        <option value="Inventory & Products">Inventory & Products</option>
                        <option value="Invoices & Receipts">Invoices & Receipts</option>
                        <option value="POS & Cashier">Sales POS & Cashier</option>
                        <option value="Account & Security">Account & Security</option>
                        <option value="Feedback / Feature Request">Feedback / Feature Request</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={senderContact}
                      onChange={(e) => setSenderContact(e.target.value)}
                      placeholder="Your Phone Number or Contact (Optional)"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />

                    <textarea
                      required
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we assist your business today?..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />

                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Prepare Support Ticket</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Founder Assurance & Dedication */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-blue-600/10 to-indigo-600/15 border border-amber-500/30 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  MADE WITH LOVE BY EAGLE STYLES (TUSUBIRA BENJAMIN)
                </p>
                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight mt-0.5">
                  FOUNDER OF THE EAGLE ICON MUSIC & THE EAGLE ICON FOUNDATION AFRICA
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
