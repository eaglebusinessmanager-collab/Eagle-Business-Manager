import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Tag,
  Trash2,
  Edit2,
  Calendar,
  User,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { BusinessNote, NoteCategory, Customer, Supplier } from '../../types';

export const NotesPage: React.FC = () => {
  const { business, user } = useAuth();
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BusinessNote | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [isPinned, setIsPinned] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [relatedCustomerId, setRelatedCustomerId] = useState('');
  const [relatedSupplierId, setRelatedSupplierId] = useState('');

  const loadData = async () => {
    if (!business?.id) return;
    try {
      const [nList, cList, sList] = await Promise.all([
        dbService.getNotes(business.id),
        dbService.getCustomers(business.id),
        dbService.getSuppliers(business.id),
      ]);
      setNotes(nList);
      setCustomers(cList);
      setSuppliers(sList);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('general');
    setIsPinned(false);
    setTagsInput('');
    setRelatedCustomerId('');
    setRelatedSupplierId('');
    setIsModalOpen(true);
  };

  const openEditModal = (note: BusinessNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setIsPinned(note.isPinned);
    setTagsInput((note.tags || []).join(', '));
    setRelatedCustomerId(note.relatedCustomerId || '');
    setRelatedSupplierId(note.relatedSupplierId || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const matchedCustomer = customers.find((c) => c.id === relatedCustomerId);

    if (editingNote) {
      await dbService.updateNote(editingNote.id, {
        title,
        content,
        category,
        isPinned,
        tags,
        relatedCustomerId: relatedCustomerId || undefined,
        relatedCustomerName: matchedCustomer?.name,
        relatedSupplierId: relatedSupplierId || undefined,
      });
    } else {
      const newNote: BusinessNote = {
        id: `note-${Date.now()}`,
        businessId: business.id,
        title,
        content,
        category,
        isPinned,
        tags,
        relatedCustomerId: relatedCustomerId || undefined,
        relatedCustomerName: matchedCustomer?.name,
        relatedSupplierId: relatedSupplierId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbService.createNote(newNote);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleTogglePin = async (note: BusinessNote) => {
    await dbService.updateNote(note.id, { isPinned: !note.isPinned });
    loadData();
  };

  const handleDelete = async (note: BusinessNote) => {
    if (!user) return;
    if (window.confirm(`Move note "${note.title}" to Recycle Bin?`)) {
      await dbService.deleteNote(note.id, { id: user.id, name: user.name });
      loadData();
    }
  };

  const filtered = notes
    .filter((n) => {
      const matchTerm =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchCat = selectedCategory === 'all' || n.category === selectedCategory;
      return matchTerm && matchCat;
    })
    .sort((a, b) => {
      // Pinned notes always on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Business Notes & Journal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Keep meeting notes, client requirements, supplier deals, and daily operational logs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes by keyword, tags, or content..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter notes by category"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="customer">Customer Notes</option>
          <option value="supplier">Supplier Terms</option>
          <option value="daily">Daily Log / Procedures</option>
          <option value="reminder">Reminders</option>
        </select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((note) => (
          <div
            key={note.id}
            className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
              note.isPinned
                ? 'bg-purple-50/40 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/60'
                : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-purple-500/40'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {note.category}
                  </span>
                  {note.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      <Pin className="h-3 w-3 fill-purple-600 dark:fill-purple-400" />
                      Pinned
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePin(note)}
                    title={note.isPinned ? 'Unpin' : 'Pin to top'}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-purple-600"
                  >
                    <Pin className={`h-3.5 w-3.5 ${note.isPinned ? 'fill-purple-600 text-purple-600' : ''}`} />
                  </button>
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note)}
                    className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5">
                {note.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
            </div>

            {/* Note Metadata and Tags */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                {note.relatedCustomerName && (
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                    <User className="h-3 w-3" />
                    {note.relatedCustomerName}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <BookOpen className="h-10 w-10 text-purple-400/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Notes Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "New Note" to keep records of negotiations, vendor contacts, and daily checklists.
          </p>
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingNote ? 'Edit Business Note' : 'Write Business Note'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Supplier pricing agreement, Showroom morning opening checklist"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="general">General</option>
                    <option value="customer">Customer Specific</option>
                    <option value="supplier">Supplier Specific</option>
                    <option value="daily">Daily Log / Procedures</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Related Customer (Optional)
                  </label>
                  <select
                    value={relatedCustomerId}
                    onChange={(e) => setRelatedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">None</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Content *
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Record full details, terms, observations, phone notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="solar, warranty, discounts"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>Pin to top of notes</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingNote ? 'Save Changes' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
