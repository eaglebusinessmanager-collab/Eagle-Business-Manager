import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Bell,
  Volume2,
  Send,
  Sparkles,
  Users,
  Building2,
  Play,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Announcement, Business, InAppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';
import { soundEngine } from '../../utils/audio';

export const AdminAnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'push' | 'banner'>('push');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [sentNotifications, setSentNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Banner announcement state
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState<'info' | 'warning' | 'promotion' | 'update'>('info');

  // Push notification state
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushType, setPushType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [pushSound, setPushSound] = useState<'chime' | 'alert' | 'bell' | 'cash' | 'none'>('chime');
  const [pushPriority, setPushPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific_business'>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [actionView, setActionView] = useState('');
  const [actionLabel, setActionLabel] = useState('View Now');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annList, bizList] = await Promise.all([
        dbService.getAllAnnouncements('admin'),
        dbService.getAllBusinesses(),
      ]);
      setAnnouncements(annList);
      setBusinesses(bizList);
      setSentNotifications(notificationService.getStoredNotifications());
    } catch (e) {
      console.error('Error loading announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestSound = (sound: 'chime' | 'alert' | 'bell' | 'cash') => {
    soundEngine.playSound(sound);
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) return;

    setIsSendingPush(true);
    try {
      const selectedBiz = businesses.find((b) => b.id === selectedBusinessId);
      const targetUserId = targetAudience === 'all' ? 'all' : selectedBusinessId;

      await notificationService.sendPushNotification({
        userId: targetUserId,
        title: pushTitle.trim(),
        message: pushMessage.trim(),
        type: pushType,
        sound: pushSound,
        priority: pushPriority,
        targetType: targetAudience,
        targetBusinessId: targetAudience === 'specific_business' ? selectedBusinessId : undefined,
        targetBusinessName: selectedBiz?.name,
        actionView: actionView || undefined,
        actionLabel: actionView ? actionLabel : undefined,
      });

      setSuccessToast(`Push notification successfully dispatched with ${pushSound} audio!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset form
      setPushTitle('');
      setPushMessage('');
      setActionView('');
      setSentNotifications(notificationService.getStoredNotifications());
    } catch (err) {
      alert('Failed to send push notification: ' + err);
    } finally {
      setIsSendingPush(false);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle || !bannerMessage || !user) return;

    const newAnn: Announcement = {
      id: 'ann-' + Date.now(),
      title: bannerTitle,
      message: bannerMessage,
      type: bannerType,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: user.fullName || 'Admin',
    };

    await dbService.createAnnouncement(newAnn, user.email || 'admin@eagle.com');

    setBannerTitle('');
    setBannerMessage('');
    setShowBannerModal(false);
    setSuccessToast('Dashboard banner broadcast published successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
    await loadData();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await dbService.toggleAnnouncementActive(id, !current);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this broadcast banner?')) {
      await dbService.deleteAnnouncement(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <span>Broadcasts & Push Notification Console</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dispatch audible real-time push notification popups and persistent dashboard banners to Ugandan merchants.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('push')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'push'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Direct Push & Sound</span>
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'banner'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Dashboard Banners</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* TAB 1: DIRECT PUSH NOTIFICATIONS */}
      {activeTab === 'push' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Push Notification Composer Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Compose Instant Push Alert
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Immediately rings sound and displays a floating notification popup on merchant devices.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendPush} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="e.g. ⚡ Flash Wholesale Restock Available in Kampala"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={3}
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  placeholder="Type the message body that will popup on the merchant's screen and notification center..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audience Targeting
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="all">📢 All Registered Merchants ({businesses.length} businesses)</option>
                    <option value="specific_business">🎯 Single Specific Business</option>
                  </select>
                </div>

                {targetAudience === 'specific_business' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Recipient Business *
                    </label>
                    <select
                      required
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="">-- Choose Business --</option>
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.phone || b.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sound and Priority Options */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-purple-600" />
                    <span>Notification Audio & Alert Sound</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Preview:</span>
                    <button
                      type="button"
                      onClick={() => handleTestSound('chime')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                    >
                      Chime
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestSound('cash')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50"
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestSound('alert')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Alert
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'chime', label: 'Pleasant Chime (Default)' },
                    { id: 'alert', label: 'High Alert Tone' },
                    { id: 'bell', label: 'Desk Bell' },
                    { id: 'cash', label: 'Cash Register' },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] cursor-pointer transition ${
                        pushSound === s.id
                          ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sound"
                        value={s.id}
                        checked={pushSound === s.id}
                        onChange={() => setPushSound(s.id as any)}
                        className="text-purple-600"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Visual Banner Color / Type
                    </label>
                    <select
                      value={pushType}
                      onChange={(e) => setPushType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="info">Blue (Informational)</option>
                      <option value="success">Emerald (Success / Promotion)</option>
                      <option value="warning">Amber (Notice / Maintenance)</option>
                      <option value="alert">Rose (Critical / Security)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Priority Behavior
                    </label>
                    <select
                      value={pushPriority}
                      onChange={(e) => setPushPriority(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="normal">Normal (Auto-dismisses in 10s)</option>
                      <option value="urgent">Urgent (Stays until merchant clicks)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Link / Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Action Link (Optional)
                  </label>
                  <select
                    value={actionView}
                    onChange={(e) => setActionView(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">None (Message only)</option>
                    <option value="marketplace">Open Community Marketplace</option>
                    <option value="sales">Open Sales & Checkout</option>
                    <option value="tools">Open Eagle Business Tools</option>
                    <option value="cash-register">Open Cash Register</option>
                    <option value="products">Open Products & Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="e.g. View Marketplace"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSendingPush}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSendingPush ? 'Broadcasting Push...' : 'Send Push Notification Now'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Push Tips & Live Preview Card */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl border border-purple-800/50 shadow-md">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Real-Time Push Architecture</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                When you click <strong>Send Push Notification Now</strong>:
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                <li>Plays synthesized Web Audio chime without needing downloads.</li>
                <li>Displays an animated popup badge right on the user's screen.</li>
                <li>Triggers native browser push notifications on desktop/Android.</li>
                <li>Archives to the merchant's Notification Center bell history.</li>
              </ul>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] text-purple-200">
                  Target: {targetAudience === 'all' ? 'All Active Merchants' : 'Targeted Business'}
                </p>
              </div>
            </div>

            {/* Sent Notifications History */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                <span>Recent Sent Alerts</span>
                <span className="text-[10px] font-mono text-slate-400">{sentNotifications.length} items</span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sentNotifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{n.title}</span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSISTENT DASHBOARD BANNERS */}
      {activeTab === 'banner' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sticky Top Announcement Banners
            </h3>
            <button
              onClick={() => setShowBannerModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Banner</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
                <Radio className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-50" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active announcement banners</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create a banner to display on the top of merchant dashboards.
                </p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    ann.isActive
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {ann.type === 'update' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                      {ann.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      {ann.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                      {ann.type === 'promotion' && <Info className="h-5 w-5 text-purple-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            ann.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {ann.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {ann.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        By {ann.createdBy} • {new Date(ann.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center text-xs">
                    <button
                      onClick={() => handleToggle(ann.id, ann.isActive)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                        ann.isActive
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                      }`}
                    >
                      {ann.isActive ? 'Deactivate' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Banner Create Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New Dashboard Announcement Banner
              </h3>
              <button
                onClick={() => setShowBannerModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Upgrade Tonight"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Severity / Color
                </label>
                <select
                  value={bannerType}
                  onChange={(e) => setBannerType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="info">Info (Blue notice)</option>
                  <option value="warning">Warning (Amber maintenance)</option>
                  <option value="update">Update / Critical (Red advisory)</option>
                  <option value="promotion">Promotion (Purple announcement)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={3}
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="Type the announcement details that will appear at top of merchant dashboards..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-sm"
                >
                  Publish Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
