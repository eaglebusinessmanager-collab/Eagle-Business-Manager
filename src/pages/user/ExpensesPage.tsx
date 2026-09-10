import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  DollarSign,
  PieChart,
  Tag,
  ArrowDownRight,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';

export const ExpensesPage: React.FC = () => {
  const { business, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    if (!business?.id) return;
    try {
      const list = await dbService.getExpenses(business.id);
      setExpenses(list);
    } catch (err) {
      console.error('Error loading expenses:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount(0);
    setCategory('utilities');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(exp.amount);
    setCategory(exp.category);
    setDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !title.trim() || amount <= 0) {
      alert('Please enter a valid title and positive amount.');
      return;
    }

    if (editingExpense) {
      await dbService.updateExpense(editingExpense.id, {
        title,
        amount,
        category,
        date,
        paymentMethod,
        notes,
      });
    } else {
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        businessId: business.id,
        title,
        amount,
        category,
        date,
        paymentMethod,
        notes,
        createdBy: user?.name || 'Staff User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbService.createExpense(newExpense);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (exp: Expense) => {
    if (!user) return;
    if (window.confirm(`Move expense "${exp.title}" to Recycle Bin?`)) {
      await dbService.deleteExpense(exp.id, { id: user.id, name: user.name });
      loadData();
    }
  };

  // Metrics
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const filtered = expenses.filter((e) => {
    const matchTerm =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchTerm && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-rose-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Business Expenses
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track overhead costs, supplier payments, utilities, and daily business disbursements.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">This Month's Overhead</span>
            <span className="text-xl font-black text-rose-600 font-mono mt-0.5 block">
              {thisMonthTotal.toLocaleString()} {business?.currency || 'UGX'}
            </span>
            <span className="text-[10px] text-slate-400">{thisMonthExpenses.length} transactions recorded</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Expenses (All Time)</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {totalExpenseAmount.toLocaleString()} {business?.currency || 'UGX'}
            </span>
            <span className="text-[10px] text-slate-400">{expenses.length} total expense entries</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses by title or notes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter expenses by category"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Expense Categories</option>
          <option value="rent">Rent</option>
          <option value="utilities">Utilities & Electricity</option>
          <option value="salaries">Salaries & Wages</option>
          <option value="inventory">Inventory & Restock</option>
          <option value="transport">Transport & Logistics</option>
          <option value="marketing">Marketing & Promotion</option>
          <option value="equipment">Equipment & Assets</option>
          <option value="maintenance">Repairs & Maintenance</option>
          <option value="taxes">Taxes & Fees</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Title & Category</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-right">Amount ({business?.currency || 'UGX'})</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-500 whitespace-nowrap font-medium">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {exp.title}
                    </span>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {exp.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                    -{exp.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">
                    {exp.notes || '—'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp)}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingExpense ? 'Edit Expense Record' : 'Record Business Expense'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shop electricity tokens, Inverter transport cargo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ({business?.currency || 'UGX'}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
                  >
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities & Electricity</option>
                    <option value="salaries">Salaries & Wages</option>
                    <option value="inventory">Inventory & Restock</option>
                    <option value="transport">Transport & Logistics</option>
                    <option value="marketing">Marketing & Ads</option>
                    <option value="equipment">Equipment & Tools</option>
                    <option value="maintenance">Repairs & Maintenance</option>
                    <option value="taxes">Taxes & Fees</option>
                    <option value="other">Other Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money (MTN / Airtel)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Reference Number
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Receipt number, invoice reference, payment confirmation code..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
