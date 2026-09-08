import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  User,
  Trash2,
  MessageCircle,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Customer, Invoice, Product } from '../../types';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const InvoicesPage: React.FC = () => {
  const { business, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // New Invoice Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [showCustomItemRow, setShowCustomItemRow] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }>
  >([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const currency = business?.currency || 'UGX';

  const loadInvoices = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [invList, custList, prodList] = await Promise.all([
        dbService.getInvoices(business.id),
        dbService.getCustomers(business.id),
        dbService.getProducts(business.id),
      ]);
      setInvoices(invList);
      setCustomers(custList);
      setProducts(prodList);
    } catch (e) {
      console.error('Error fetching invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [business?.id]);

  const handleAddItemToInvoice = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = invoiceItems.find((i) => i.productId === productId);
    if (existing) {
      setInvoiceItems(
        invoiceItems.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      setInvoiceItems([
        ...invoiceItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          total: product.sellingPrice,
        },
      ]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || customItemPrice <= 0) return;
    const customId = 'item-' + Date.now();
    setInvoiceItems([
      ...invoiceItems,
      {
        productId: customId,
        productName: customItemName.trim(),
        quantity: 1,
        unitPrice: customItemPrice,
        total: customItemPrice,
      },
    ]);
    setCustomItemName('');
    setCustomItemPrice(0);
    setShowCustomItemRow(false);
  };

  const handleUpdateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setInvoiceItems(invoiceItems.filter((i) => i.productId !== productId));
      return;
    }
    setInvoiceItems(
      invoiceItems.map((i) =>
        i.productId === productId ? { ...i, quantity: qty, total: qty * i.unitPrice } : i
      )
    );
  };

  const subtotal = invoiceItems.reduce((acc, item) => acc + item.total, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || invoiceItems.length === 0) return;

    let custName = customCustomerName || 'Walk-in Client';
    let custPhone = customCustomerPhone;
    if (selectedCustomerId) {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (found) {
        custName = found.name;
        custPhone = found.phone;
      }
    }

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      businessId: business.id,
      invoiceNumber: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      customerId: selectedCustomerId || undefined,
      customerName: custName,
      customerPhone: custPhone || undefined,
      items: invoiceItems,
      subtotal,
      discount,
      total,
      paymentStatus: 'pending',
      status: 'pending',
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || business.invoiceNotes || 'Payment due in 7 days.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.createInvoice(newInvoice);
    setShowCreateModal(false);
    setInvoiceItems([]);
    setDiscount(0);
    setNotes('');
    await loadInvoices();
    setSelectedInvoiceForPrint(newInvoice);
  };

  const handleUpdateStatus = async (invId: string, newStatus: 'paid' | 'pending' | 'overdue' | 'cancelled') => {
    if (!business) return;
    await dbService.updateInvoiceStatus(invId, business.id, newStatus);
    await loadInvoices();
    if (selectedInvoiceForPrint && selectedInvoiceForPrint.id === invId) {
      setSelectedInvoiceForPrint({ ...selectedInvoiceForPrint, status: newStatus });
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete || !business) return;
    await dbService.deleteInvoice(invoiceToDelete.id, business.id);
    if (selectedInvoiceForPrint?.id === invoiceToDelete.id) {
      setSelectedInvoiceForPrint(null);
    }
    setInvoiceToDelete(null);
    await loadInvoices();
  };

  const shareInvoiceViaWhatsApp = (inv: Invoice) => {
    const itemsText = inv.items
      .map((item) => `• ${item.quantity}x ${item.productName} = ${currency} ${(item.total || item.quantity * item.unitPrice).toLocaleString()}`)
      .join('\n');
    const text = `*OFFICIAL INVOICE: ${inv.invoiceNumber}*\nCompany: ${business?.name || 'Eagle Business Store'}\nTel: ${business?.phone || ''}\nClient: ${inv.customerName}\nDate Issued: ${new Date(inv.createdAt).toLocaleDateString()}\nDue Date: ${new Date(inv.dueDate).toLocaleDateString()}\n\n*INVOICE ITEMS:*\n${itemsText}\n\n*Subtotal:* ${currency} ${inv.subtotal.toLocaleString()}\n${inv.discount > 0 ? `*Discount:* -${currency} ${inv.discount.toLocaleString()}\n` : ''}*TOTAL DUE:* ${currency} ${inv.total.toLocaleString()}\n*Status:* ${inv.status.toUpperCase()}\n\nPayment Terms / Notes:\n${inv.notes}\n\nThank you for choosing us!\nPowered by Eagle Business Manager`;

    const phone = inv.customerPhone ? inv.customerPhone.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (val: number) => `${currency} ${val.toLocaleString()}`;

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Invoices & Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Issue formal customer invoices, track payment dates, and print proforma receipts.
          </p>
        </div>

        <button
          onClick={() => {
            setInvoiceItems([]);
            setShowCreateModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number or client name..."
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-auto"
          >
            <option value="all">Status: All Invoices</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
          <FileText className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-50" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No invoices found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click 'New Invoice' above to generate your first bill.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs"
                          title="View and print invoice"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => shareInvoiceViaWhatsApp(inv)}
                          className="p-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                          title="Send to WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                          title="Delete invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Invoice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4 text-xs">
              {/* Customer Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Custom / Walk-in Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {!selectedCustomerId && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Customer Name *"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone (Optional)"
                    value={customCustomerPhone}
                    onChange={(e) => setCustomCustomerPhone(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Add Product Items to Invoice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Add Item or Service
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomItemRow(!showCustomItemRow)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {showCustomItemRow ? 'Cancel Custom Item' : '+ Custom Service / Item'}
                  </button>
                </div>

                {showCustomItemRow ? (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Delivery fee, Repair, Custom item"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder={`Price (${currency})`}
                      value={customItemPrice || ''}
                      onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItemToInvoice(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Product from Inventory --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — {formatCurrency(p.sellingPrice)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Invoice Items Table */}
              <div className="space-y-2 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl max-h-48 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Invoice Items List ({invoiceItems.length})
                </span>

                {invoiceItems.length === 0 ? (
                  <p className="py-4 text-center text-slate-400">No items added to invoice yet.</p>
                ) : (
                  invoiceItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                    >
                      <div className="truncate mr-2 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQty(item.productId, Number(e.target.value))}
                          className="w-14 px-2 py-1 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                        <span className="font-mono font-bold w-20 text-right">
                          {formatCurrency(item.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.productId, 0)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Notes / Terms
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Payment due via Mobile Money"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-200">Total Invoice Amount:</span>
                <span className="font-mono font-extrabold text-base text-blue-600 dark:text-blue-400">
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceItems.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Invoice Modal */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 no-print">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Business Invoice
              </span>
              <button
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="printable-document flex-1 overflow-y-auto py-6 space-y-6 text-xs font-sans">
              {/* Top Banner: Brand and Invoice Meta */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {business?.name}
                  </h2>
                  <p className="text-slate-500 mt-1">{business?.address}</p>
                  <p className="text-slate-500">Phone: {business?.phone}</p>
                  <p className="text-slate-500">Category: {business?.category}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
                    INVOICE
                  </h3>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedInvoiceForPrint.invoiceNumber}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Date: {new Date(selectedInvoiceForPrint.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Due Date: {new Date(selectedInvoiceForPrint.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bill To Client
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedInvoiceForPrint.customerName}
                </p>
                {selectedInvoiceForPrint.customerPhone && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tel: {selectedInvoiceForPrint.customerPhone}
                  </p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedInvoiceForPrint.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoiceForPrint.subtotal)}</span>
                  </div>
                  {selectedInvoiceForPrint.discount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedInvoiceForPrint.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Due:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedInvoiceForPrint.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions & Status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Notes & Payment Terms:</p>
                <p className="text-slate-500 mt-1 leading-relaxed">{selectedInvoiceForPrint.notes}</p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                      selectedInvoiceForPrint.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedInvoiceForPrint.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 no-print">
              {selectedInvoiceForPrint.status !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedInvoiceForPrint.id, 'paid')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Mark as Paid
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedInvoiceForPrint.id, 'pending')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
                >
                  Mark as Pending
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => shareInvoiceViaWhatsApp(selectedInvoiceForPrint)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                  title="Share invoice directly to customer on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send to WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!invoiceToDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNumber}" for ${invoiceToDelete?.customerName}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        onConfirm={handleDeleteInvoice}
        onCancel={() => setInvoiceToDelete(null)}
      />
    </div>
  );
};
