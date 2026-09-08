import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  Receipt,
  User,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Printer,
  X,
  CreditCard,
  Phone,
  Clock,
  ChevronRight,
  Filter,
  Package,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Customer, Product, Sale, SaleItem } from '../../types';

export const SalesPage: React.FC = () => {
  const { business, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'terminal' (Make Sale) or 'history' (Past Sales)
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal');

  // Terminal Cart State
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [walkinName, setWalkinName] = useState<string>('Walk-in Customer');
  const [walkinPhone, setWalkinPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card' | 'bank_transfer'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // History & Receipt View Modal
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const currency = business?.currency || 'UGX';

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [sList, pList, cList] = await Promise.all([
        dbService.getSales(business.id),
        dbService.getProducts(business.id),
        dbService.getCustomers(business.id),
      ]);
      setSales(sList);
      setProducts(pList);
      setCustomers(cList);
    } catch (e) {
      console.error('Error loading sales data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`Cannot add "${product.name}" — product is out of stock!`);
      return;
    }

    const existingIndex = cartItems.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const currentCartQty = cartItems[existingIndex].quantity;
      if (currentCartQty + 1 > product.currentStock) {
        alert(`Cannot add more units. Available stock is ${product.currentStock}.`);
        return;
      }
      const updated = [...cartItems];
      const newQty = currentCartQty + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        total: newQty * updated[existingIndex].unitPrice,
      };
      setCartItems(updated);
    } else {
      const newItem: SaleItem = {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        buyingPrice: product.buyingPrice,
        subtotal: product.sellingPrice,
        total: product.sellingPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > product.currentStock) {
      alert(`Maximum available stock for ${product.name} is ${product.currentStock}.`);
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(cartItems.filter((i) => i.productId !== productId));
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.total, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleCompleteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || cartItems.length === 0) return;
    setSubmitting(true);

    try {
      // Find customer info
      let custName = walkinName;
      let custPhone = walkinPhone;
      if (selectedCustomerId) {
        const found = customers.find((c) => c.id === selectedCustomerId);
        if (found) {
          custName = found.name;
          custPhone = found.phone;
        }
      }

      const newSale: Sale = {
        id: 'sale-' + Date.now(),
        businessId: business.id,
        saleNumber: 'EBM-' + Math.floor(100000 + Math.random() * 900000),
        customerId: selectedCustomerId || undefined,
        customerName: custName,
        customerPhone: custPhone || undefined,
        items: cartItems.map((it) => ({
          ...it,
          subtotal: it.subtotal || it.total || it.quantity * it.unitPrice,
        })),
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        paymentStatus,
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
        createdBy: user?.fullName || 'User',
      };

      const createdSale = await dbService.createSale(newSale);

      // Reset cart
      setCartItems([]);
      setDiscountAmount(0);
      setNotes('');
      setSelectedCustomerId('');
      setWalkinName('Walk-in Customer');
      setWalkinPhone('');
      setSaleSuccessMessage(`Sale #${createdSale.saleNumber} completed successfully! Stock updated.`);
      setTimeout(() => setSaleSuccessMessage(null), 5000);

      // Reload products & sales
      await loadData();
      setSelectedSaleForReceipt(createdSale);
    } catch (err: any) {
      alert(err.message || 'Failed to complete sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePaymentStatus = async (saleId: string, newStatus: 'paid' | 'pending' | 'partial') => {
    if (!business) return;
    await dbService.updateSaleStatus(saleId, business.id, newStatus);
    await loadData();
    if (selectedSaleForReceipt && selectedSaleForReceipt.id === saleId) {
      setSelectedSaleForReceipt({ ...selectedSaleForReceipt, paymentStatus: newStatus });
    }
  };

  const formatCurrency = (val: number) => {
    return `${currency} ${val.toLocaleString()}`;
  };

  const shareReceiptViaWhatsApp = (sale: Sale) => {
    const itemsText = sale.items
      .map((item) => `• ${item.quantity}x ${item.productName} = ${currency} ${(item.total || item.quantity * item.unitPrice).toLocaleString()}`)
      .join('\n');
    const text = `*SALES RECEIPT: ${sale.saleNumber}*\nStore: ${business?.name || 'Eagle Business Store'}\nTel: ${business?.phone || ''}\nCustomer: ${sale.customerName || 'Walk-in Customer'}\nDate: ${new Date(sale.createdAt).toLocaleDateString()}\n\n*ITEMS PURCHASED:*\n${itemsText}\n\n*Subtotal:* ${currency} ${sale.subtotal.toLocaleString()}\n${sale.discount > 0 ? `*Discount:* -${currency} ${sale.discount.toLocaleString()}\n` : ''}*TOTAL PAID:* ${currency} ${sale.total.toLocaleString()}\n*Payment Method:* ${sale.paymentMethod.replace('_', ' ').toUpperCase()}\n*Status:* ${sale.paymentStatus.toUpperCase()}\n\nThank you for shopping with us!\nPowered by Eagle Business Manager`;

    const phone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtered sales for history tab
  const filteredSales = sales.filter((s) => {
    const matchSearch =
      s.saleNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(historySearch.toLowerCase()));
    const matchStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Sales & Point of Sale
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Process checkout sales, deduct inventory in real time, and generate official receipts.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'terminal'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>New Sale</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Sales History ({sales.length})</span>
          </button>
        </div>
      </div>

      {saleSuccessMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{saleSuccessMessage}</span>
        </div>
      )}

      {/* POS Terminal Tab */}
      {activeTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Product Selector (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to add to cart..."
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {products
                  .filter((p) =>
                    p.status === 'active' &&
                    (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category.toLowerCase().includes(productSearch.toLowerCase()))
                  )
                  .map((product) => {
                    const isOutOfStock = product.currentStock <= 0;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                          isOutOfStock
                            ? 'opacity-50 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-xs active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex gap-2.5 items-start">
                          {/* Product Image Thumbnail */}
                          <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400 opacity-60" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="font-mono truncate mr-1">{product.sku}</span>
                              <span
                                className={`font-semibold shrink-0 ${
                                  isOutOfStock
                                    ? 'text-rose-500'
                                    : product.currentStock <= product.minStockLevel
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                                }`}
                              >
                                {product.currentStock} in stock
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                              {product.name}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="text-xs font-extrabold font-mono text-blue-600 dark:text-blue-400">
                            {formatCurrency(product.sellingPrice)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            + Add
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Cart & Customer Selection (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Sale Order Details</span>
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </h2>

              {/* Items In Cart */}
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <ShoppingBag className="h-6 w-6 mx-auto mb-1 opacity-40" />
                    <p>No products in cart yet.</p>
                    <p className="text-[11px] mt-0.5">Select items from the catalog on the left.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="truncate mr-2 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          className="h-6 w-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          className="h-6 w-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                        >
                          +
                        </button>
                        <span className="font-mono font-bold text-slate-900 dark:text-white ml-2">
                          {formatCurrency(item.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Selector */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Walk-in Customer (Non-registered)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedCustomerId && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={walkinName}
                      onChange={(e) => setWalkinName(e.target.value)}
                      placeholder="Customer Name"
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={walkinPhone}
                      onChange={(e) => setWalkinPhone(e.target.value)}
                      placeholder="Phone (Optional)"
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Payment Method and Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money (MTN/Airtel)</option>
                      <option value="card">Bank Card (POS)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="paid">Fully Paid</option>
                      <option value="pending">Pending / On Credit</option>
                      <option value="partial">Partially Paid</option>
                    </select>
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Totals Summary */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                    <span>Grand Total:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={submitting || cartItems.length === 0}
                  onClick={handleCompleteSale}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{submitting ? 'Processing...' : 'Complete & Generate Receipt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by receipt # or customer name..."
                className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Status: All</option>
                <option value="paid">Fully Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No sales transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                    <th className="pb-2.5">Receipt #</th>
                    <th className="pb-2.5">Date & Time</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Method</th>
                    <th className="pb-2.5">Total Amount</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {sale.saleNumber}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px]">
                        {sale.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : sale.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {sale.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {selectedSaleForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Business Receipt
              </span>
              <button
                onClick={() => setSelectedSaleForReceipt(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Area */}
            <div id="printable-receipt" className="printable-document flex-1 overflow-y-auto py-4 space-y-4 text-xs font-mono">
              {/* Business Header */}
              <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {business?.name}
                </h2>
                <p className="text-[11px] text-slate-500">{business?.address}</p>
                <p className="text-[11px] text-slate-500">Tel: {business?.phone}</p>
                <p className="text-[10px] text-slate-400 mt-1">Receipt #: {selectedSaleForReceipt.saleNumber}</p>
                <p className="text-[10px] text-slate-400">
                  Date: {new Date(selectedSaleForReceipt.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Customer & Attendant Details */}
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <div>
                  <span>Client: </span>
                  <strong>{selectedSaleForReceipt.customerName || 'Walk-in'}</strong>
                </div>
                <div>
                  <span>Payment: </span>
                  <strong className="uppercase">{selectedSaleForReceipt.paymentMethod.replace('_', ' ')}</strong>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>ITEM</span>
                  <span>QTY x PRICE</span>
                  <span>TOTAL</span>
                </div>
                {selectedSaleForReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <span className="truncate max-w-[150px]">{item.productName}</span>
                    <span className="text-slate-500">
                      {item.quantity} x {item.unitPrice.toLocaleString()}
                    </span>
                    <span className="font-bold">{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSaleForReceipt.subtotal)}</span>
                </div>
                {selectedSaleForReceipt.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedSaleForReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>TOTAL ({currency}):</span>
                  <span>{selectedSaleForReceipt.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Status Pill in Receipt */}
              <div className="text-center pt-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    selectedSaleForReceipt.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  Payment Status: {selectedSaleForReceipt.paymentStatus}
                </span>
              </div>

              {/* Footer text */}
              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
                <p>{business?.receiptFooter || 'Thank you for your business!'}</p>
                <p className="mt-0.5">Powered by Eagle Business Manager</p>
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 no-print">
              {selectedSaleForReceipt.paymentStatus !== 'paid' && (
                <button
                  type="button"
                  onClick={() => handleUpdatePaymentStatus(selectedSaleForReceipt.id, 'paid')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Mark as Fully Paid
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => shareReceiptViaWhatsApp(selectedSaleForReceipt)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                  title="Share Receipt directly to Customer on WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Share to WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
