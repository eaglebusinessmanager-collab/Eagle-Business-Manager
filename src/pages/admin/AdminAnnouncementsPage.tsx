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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Announcement } from '../../types';

export const AdminAnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'promotion' | 'update'>('info');

  const loadAnnouncements = async () => {
    const list = await dbService.getAllAnnouncements('admin');
    setAnnouncements(list);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !user) return;

    const newAnn: Announcement = {
      id: 'ann-' + Date.now(),
      title,
      message,
      type,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: user.fullName || 'Admin',
    };

    await dbService.createAnnouncement(newAnn, user.email || 'admin@eagle.com');

    setTitle('');
    setMessage('');
    setShowModal(false);
    await loadAnnouncements();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await dbService.toggleAnnouncementActive(id, !current);
    await loadAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteAnnouncement(id);
    await loadAnnouncements();
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="h-5 w-5 text-purple-600" />
            <span>Platform Broadcast Announcements</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Publish system banners and maintenance advisories visible to all business users.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
            <Radio className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-50" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active announcements</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create a broadcast to notify all business owners of system updates or notices.
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
                      {ann.isActive ? 'Broadcasting' : 'Inactive'}
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New System Announcement
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Upgrade"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Severity / Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
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
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type the message that will appear on merchant dashboards..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-sm"
                >
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
