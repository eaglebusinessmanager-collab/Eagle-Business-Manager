import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  ShoppingBag,
  ChevronRight,
  MessageCircle,
  Tag,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Customer, Sale, CustomerType } from '../../types';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { AddRecipientModal } from '../../components/common/AddRecipientModal';
import { RecipientProfileModal } from '../../components/common/RecipientProfileModal';
import { getWhatsAppUrl, getTelUrl } from '../../utils/phone';

export const CustomersPage: React.FC = () => {
  const { business } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const currency = business?.currency || 'UGX';

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [cList, sList] = await Promise.all([
        dbService.getCustomers(business.id),
        dbService.getSales(business.id),
      ]);
      setCustomers(cList);
      setSales(sList);
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const handleRecipientSaved = (saved: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? saved : c));
      }
      return [saved, ...prev];
    });
    // If we're editing the one currently being viewed, update viewing state
    if (viewingCustomer && viewingCustomer.id === saved.id) {
      setViewingCustomer(saved);
    }
  };

  const handleDelete = async () => {
    if (!business || !customerToDelete) return;
    await dbService.deleteCustomer(customerToDelete.id, business.id);
    setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
    setCustomerToDelete(null);
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      let matchType = false;
      if (selectedType === 'all') {
        matchType = true;
      } else if (selectedType === 'with_debt') {
        const custSales = sales.filter((s) => s.customerId === c.id || s.customerName?.toLowerCase() === c.name.toLowerCase());
        matchType = custSales.some((s) => (s.paymentStatus === 'pending' || s.paymentStatus === 'partial') && (s.total - (s.amountPaid || 0)) > 0);
      } else {
        matchType = (c.customerType || 'regular') === selectedType;
      }

      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      return matchType && matchQuery;
    });
  }, [customers, searchQuery, selectedType, sales]);

  const formatCurrency = (val: number) => `${currency} ${val.toLocaleString()}`;

  // Customer Types for Filter Chips
  const customerTypes: { label: string; value: string }[] = [
    { label: 'All Recipients', value: 'all' },
    { label: 'Credit Debts Owed', value: 'with_debt' },
    { label: 'Regular', value: 'regular' },
    { label: 'Retail', value: 'retail' },
    { label: 'Wholesale', value: 'wholesale' },
    { label: 'VIP', value: 'vip' },
    { label: 'Distributor', value: 'distributor' },
  ];

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Recipients & Customer Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage recipient profiles, phone numbers, WhatsApp contact, credit balances, and order histories.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Recipient</span>
        </button>
      </div>

      {/* Search & Customer Type Filter Chips */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipients by name, phone (07XX / +256), email, or location..."
            className="block w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Filter:</span>
          {customerTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition ${
                selectedType === t.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Overview */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-white">{filteredCustomers.length}</strong> recipients
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-blue-600 font-bold hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-400">Loading recipient directory...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <Users className="h-10 w-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No recipients found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No records match your search criteria. Try a different search query.'
              : 'Add your first customer or recipient to start recording sales and sending digital receipts.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            + Add Recipient
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCustomers.map((cust) => {
            const historyForCust = sales.filter((s) => s.customerId === cust.id);
            const totalSpent = historyForCust.reduce((acc, s) => acc + s.total, 0);
            const unpaidSales = historyForCust.filter(
              (s) => s.paymentStatus === 'pending' || s.paymentStatus === 'partial'
            );
            const pendingBalance = unpaidSales.reduce(
              (acc, s) => acc + (s.total - (s.amountPaid || 0)),
              0
            );

            return (
              <div
                key={cust.id}
                onClick={() => setViewingCustomer(cust)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cust.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Customer Type Badge */}
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-tight shrink-0 border border-blue-200/60 dark:border-blue-900/50">
                      {cust.customerType || 'Regular'}
                    </span>
                  </div>

                  {/* Contact & Location */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {cust.address && (
                      <div className="flex items-center gap-1.5 text-[11px] truncate">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    )}
                    {cust.email && (
                      <div className="flex items-center gap-1.5 text-[11px] truncate">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Orders & Spend Metrics */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Orders</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {historyForCust.length}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Volume</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalSpent)}
                      </span>
                    </div>
                  </div>

                  {/* Outstanding Balance Flag */}
                  {pendingBalance > 0 && (
                    <div className="mt-2 flex items-center justify-between p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[10px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-rose-600" />
                        <span>Credit / Pending Balance:</span>
                      </span>
                      <span className="font-mono">{formatCurrency(pendingBalance)}</span>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                  <a
                    href={getWhatsAppUrl(cust.phone, `Hello ${cust.name}, contacting you from ${business?.name || 'our business'}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => setViewingCustomer(cust)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <span>Profile</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleOpenEdit(cust, e)}
                    className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    title="Edit Recipient"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomerToDelete(cust);
                    }}
                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Recipient"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Recipient Modal */}
      <AddRecipientModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCustomer(null);
        }}
        onSave={handleRecipientSaved}
        initialData={editingCustomer || undefined}
        title={editingCustomer ? 'Edit Recipient Profile' : 'Add New Recipient'}
      />

      {/* View Recipient Profile & Purchase History Modal */}
      {viewingCustomer && (
        <RecipientProfileModal
          isOpen={!!viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          customer={viewingCustomer}
          sales={sales}
          invoices={[]}
          currency={currency}
          onPaymentRecorded={loadData}
          onDelete={(cust) => {
            setViewingCustomer(null);
            setCustomerToDelete(cust);
          }}
          onEdit={(cust) => {
            setViewingCustomer(null);
            setEditingCustomer(cust);
            setShowAddModal(true);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!customerToDelete}
        title="Delete Recipient"
        message={`Are you sure you want to delete "${customerToDelete?.name}"? Previous recorded sales and invoices will preserve customer historical records.`}
        confirmLabel="Delete Recipient"
        onConfirm={handleDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
