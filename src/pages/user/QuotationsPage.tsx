import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Trash2,
  ArrowRightCircle,
  Eye,
  Edit2,
  User,
  Building,
  AlertCircle,
  X,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Quotation, QuotationStatus, Product, Customer, SaleItem } from '../../types';

export const QuotationsPage: React.FC = () => {
  const { business, user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);

  // Form State
  const [quotationNumber, setQuotationNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customCustomerAddress, setCustomCustomerAddress] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [validityDate, setValidityDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    if (!business?.id) return;
    try {
      const [qList, pList, cList] = await Promise.all([
        dbService.getQuotations(business.id),
        dbService.getProducts(business.id),
        dbService.getCustomers(business.id),
      ]);
      setQuotations(qList);
      setProducts(pList);
      setCustomers(cList);
    } catch (err) {
      console.error('Error loading quotations data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const openCreateModal = async () => {
    if (!business?.id) return;
    const nextNum = await dbService.getNextDocumentNumber(business.id, 'quotation');
    setQuotationNumber(nextNum);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setCustomCustomerAddress('');
    setItems([]);
    setDiscount(0);
    // default 30 days validity
    const d = new Date(Date.now() + 30 * 86400000);
    setValidityDate(d.toISOString().split('T')[0]);
    setNotes('Prices are valid for 30 days. Includes delivery and official tax invoice upon settlement.');
    setIsCreateModalOpen(true);
  };

  const addItem = (product: Product) => {
    const existing = items.find((it) => it.productId === product.id);
    if (existing) {
      setItems(
        items.map((it) =>
          it.productId === product.id
            ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.unitPrice }
            : it
        )
      );
    } else {
      setItems([
        ...items,
        {
          id: `qi-${Date.now()}-${items.length}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          quantity: 1,
          subtotal: product.sellingPrice,
        },
      ]);
    }
  };

  const updateItemQty = (index: number, delta: number) => {
    const next = [...items];
    const newQty = next[index].quantity + delta;
    if (newQty <= 0) {
      next.splice(index, 1);
    } else {
      next[index].quantity = newQty;
      next[index].subtotal = newQty * next[index].unitPrice;
    }
    setItems(next);
  };

  const removeItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || items.length === 0) {
      alert('Please add at least one product item to the quotation.');
      return;
    }

    const matchedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const customerName = matchedCustomer ? matchedCustomer.name : customCustomerName.trim() || 'Walk-in Customer';
    const customerPhone = matchedCustomer ? matchedCustomer.phone : customCustomerPhone.trim();
    const customerAddress = matchedCustomer ? matchedCustomer.address : customCustomerAddress.trim();

    const newQuotation: Quotation = {
      id: `quo-${Date.now()}`,
      businessId: business.id,
      quotationNumber,
      customerId: selectedCustomerId || undefined,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      discount,
      total,
      validityDate,
      status: 'sent',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.createQuotation(newQuotation);
    setIsCreateModalOpen(false);
    loadData();
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    if (!user?.id) return;
    if (
      window.confirm(
        `Convert quotation ${quotation.quotationNumber} into an official Invoice? This will automatically generate an invoice number and link it.`
      )
    ) {
      try {
        const invoice = await dbService.convertQuotationToInvoice(quotation.id, user.id);
        alert(`Successfully converted to Invoice #${invoice.invoiceNumber}! You can view it under Invoices.`);
        loadData();
      } catch (e) {
        alert('Failed to convert quotation: ' + e);
      }
    }
  };

  const handleDeleteQuotation = async (quotation: Quotation) => {
    if (!user) return;
    if (window.confirm(`Move quotation ${quotation.quotationNumber} to Recycle Bin?`)) {
      await dbService.deleteQuotation(quotation.id, { id: user.id, name: user.name });
      loadData();
    }
  };

  const handleShareWhatsApp = (q: Quotation) => {
    const currency = business?.currency || 'UGX';
    let text = `*QUOTATION: ${q.quotationNumber}*\n`;
    text += `From: *${business?.name || 'Eagle Business Manager'}*\n`;
    text += `Client: ${q.customerName}\n`;
    text += `Validity: ${q.validityDate}\n\n`;
    text += `*ITEMS:*\n`;
    q.items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.productName} (${it.quantity}x) = ${currency} ${it.subtotal.toLocaleString()}\n`;
    });
    if (q.discount > 0) {
      text += `Discount: -${currency} ${q.discount.toLocaleString()}\n`;
    }
    text += `*TOTAL: ${currency} ${q.total.toLocaleString()}*\n\n`;
    if (q.notes) text += `Notes: ${q.notes}\n\n`;
    text += `Thank you for your business!`;

    const phone = q.customerPhone ? q.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = quotations.filter((q) => {
    const matchTerm =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'all' || q.status === selectedStatus;
    return matchTerm && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Quotations & Estimates
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create professional pricing proposals, share directly with clients, and convert to invoices in one click.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Quotation</span>
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
            placeholder="Search by quotation number or customer name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter quotations by status"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="invoiced">Invoiced</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {/* Quotations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-indigo-500/40 transition space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {q.quotationNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    q.status === 'invoiced'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : q.status === 'accepted'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : q.status === 'declined'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {q.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                {q.customerName}
              </h3>
              {q.customerPhone && (
                <p className="text-[11px] text-slate-400 font-mono">{q.customerPhone}</p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">{q.items.length} item{q.items.length > 1 ? 's' : ''}</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                  {q.total.toLocaleString()} {business?.currency || 'UGX'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Valid until: {new Date(q.validityDate).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewQuotation(q)}
                  title="View / Print Document"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShareWhatsApp(q)}
                  title="Share via WhatsApp"
                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuotation(q)}
                  title="Move to Recycle Bin"
                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {q.status !== 'invoiced' ? (
                <button
                  onClick={() => handleConvertToInvoice(q)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                >
                  <ArrowRightCircle className="h-3.5 w-3.5" />
                  <span>Convert to Invoice</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Invoiced ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FileText className="h-10 w-10 text-indigo-400/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Quotations Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create quotation proposals with your custom branding and convert them instantly to sales.
          </p>
        </div>
      )}

      {/* Create Quotation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Generate New Quotation
              </h2>
              <span className="font-mono font-bold text-indigo-600 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs">
                {quotationNumber}
              </span>
            </div>

            <form onSubmit={handleSaveQuotation} className="mt-4 space-y-4">
              {/* Customer Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Or enter new customer details below</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Validity Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {!selectedCustomerId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={customCustomerName}
                      onChange={(e) => setCustomCustomerName(e.target.value)}
                      placeholder="e.g. Dennis Okello"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customCustomerPhone}
                      onChange={(e) => setCustomCustomerPhone(e.target.value)}
                      placeholder="+256..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Location / Address
                    </label>
                    <input
                      type="text"
                      value={customCustomerAddress}
                      onChange={(e) => setCustomCustomerAddress(e.target.value)}
                      placeholder="Kampala Road..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Product Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Add Product to Quotation
                </label>
                <div className="flex gap-2">
                  <select
                    id="productPickerSelect"
                    defaultValue=""
                    onChange={(e) => {
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p) addItem(p);
                      e.target.value = '';
                    }}
                    aria-label="Add product to quotation"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="" disabled>
                      Choose a product from catalog...
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.sellingPrice.toLocaleString()} {business?.currency || 'UGX'} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Added Line Items Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it, idx) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                          {it.productName}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">
                          {it.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, -1)}
                              className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold w-4 text-center">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, 1)}
                              className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {it.subtotal.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">
                          No items added yet. Select products from the dropdown above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Terms & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">
                      {subtotal.toLocaleString()} {business?.currency || 'UGX'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-300">Discount:</span>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs outline-none font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Grand Total:</span>
                    <span className="font-mono">
                      {total.toLocaleString()} {business?.currency || 'UGX'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  Save & Issue Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Preview Sheet Modal */}
      {previewQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white text-slate-900 shadow-2xl p-6 sm:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Document Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewQuotation(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="pt-4 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {business?.name || 'Eagle Business'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">{business?.address}</p>
                  <p className="text-xs text-slate-500">Tel: {business?.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-700 font-mono block">
                    QUOTATION
                  </span>
                  <span className="text-xs font-bold text-slate-600 font-mono">
                    #{previewQuotation.quotationNumber}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Date: {new Date(previewQuotation.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Valid Until: {new Date(previewQuotation.validityDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Quotation Prepared For:
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {previewQuotation.customerName}
                </span>
                {previewQuotation.customerPhone && (
                  <p className="text-slate-500">{previewQuotation.customerPhone}</p>
                )}
                {previewQuotation.customerAddress && (
                  <p className="text-slate-500">{previewQuotation.customerAddress}</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Total ({business?.currency || 'UGX'})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewQuotation.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 font-semibold text-slate-800">
                        {it.productName}
                        {it.sku && <span className="block text-[10px] text-slate-400 font-mono">SKU: {it.sku}</span>}
                      </td>
                      <td className="py-2.5 text-right font-mono">{it.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 text-center font-mono font-bold">{it.quantity}</td>
                      <td className="py-2.5 text-right font-mono font-bold">{it.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-56 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{previewQuotation.subtotal.toLocaleString()}</span>
                  </div>
                  {previewQuotation.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">-{previewQuotation.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-indigo-700 pt-2 border-t border-slate-200">
                    <span>Total ({business?.currency || 'UGX'}):</span>
                    <span className="font-mono">{previewQuotation.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {previewQuotation.notes && (
                <div className="pt-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-700 block">Terms & Conditions:</span>
                  <p className="mt-1 leading-relaxed">{previewQuotation.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
