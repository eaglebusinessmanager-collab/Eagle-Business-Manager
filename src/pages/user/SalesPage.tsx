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
  ScanLine,
  Share2,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { Customer, Product, Sale, SaleItem } from '../../types';
import { CameraScannerModal } from '../../components/common/CameraScannerModal';
import { AddRecipientModal } from '../../components/common/AddRecipientModal';
import { ReceiptStudioModal } from '../../components/receipts/ReceiptStudioModal';

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
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Recipient selection mode: 'walkin' or 'existing'
  const [recipientMode, setRecipientMode] = useState<'walkin' | 'existing'>('walkin');
  const [recipientSearch, setRecipientSearch] = useState('');

  // Barcode / QR Scanner & Add Recipient Modal states
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);

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

  const handleScannedCode = async (decodedText: string) => {
    if (!business) return;
    const foundProduct = await dbService.lookupProductByBarcodeOrSku(business.id, decodedText);
    if (foundProduct) {
      handleAddToCart(foundProduct);
      setShowCameraScanner(false);
      setSaleSuccessMessage(`Scanned & added "${foundProduct.name}" to cart!`);
      setTimeout(() => setSaleSuccessMessage(null), 3000);
    } else {
      alert(`No product found with Barcode/SKU: "${decodedText}". Please verify or add this barcode in Products.`);
    }
  };

  const handleRecipientSaved = (saved: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      if (exists) return prev.map((c) => (c.id === saved.id ? saved : c));
      return [saved, ...prev];
    });
    setRecipientMode('existing');
    setSelectedCustomerId(saved.id);
    setShowAddRecipientModal(false);
  };

  const generateReceiptText = (sale: Sale) => {
    const itemsText = sale.items
      .map(
        (i) =>
          `• ${i.productName} (${i.quantity}x @ ${currency} ${i.unitPrice.toLocaleString()}) = ${currency} ${(i.total || i.quantity * i.unitPrice).toLocaleString()}`
      )
      .join('\n');

    return (
      `==============================\n` +
      `EAGLE BUSINESS MANAGER\n` +
      `==============================\n` +
      `Business: ${business?.name || 'Eagle Business Store'}\n` +
      (business?.phone ? `Tel: ${business.phone}\n` : '') +
      (business?.address ? `Location: ${business.address}\n` : '') +
      `Receipt No: ${sale.saleNumber}\n` +
      `Date: ${new Date(sale.createdAt).toLocaleDateString()} ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `Recipient: ${sale.customerName || 'WALK-IN CUSTOMER'}\n` +
      `------------------------------\n` +
      `ITEMS PURCHASED:\n${itemsText}\n` +
      `------------------------------\n` +
      `Subtotal: ${currency} ${sale.subtotal.toLocaleString()}\n` +
      (sale.discount > 0 ? `Discount: -${currency} ${sale.discount.toLocaleString()}\n` : '') +
      `TOTAL: ${currency} ${sale.total.toLocaleString()}\n` +
      `Payment Method: ${sale.paymentMethod.replace('_', ' ').toUpperCase()}\n` +
      `Amount Paid: ${currency} ${(sale.paymentStatus === 'paid' ? sale.total : 0).toLocaleString()}\n` +
      `Balance: ${currency} ${(sale.paymentStatus === 'paid' ? 0 : sale.total).toLocaleString()}\n` +
      `Status: ${sale.paymentStatus.toUpperCase()}\n` +
      `==============================\n` +
      `Thank you for your business!\n` +
      `Powered by Eagle Business Manager`
    );
  };

  const shareReceiptViaWhatsApp = (sale: Sale) => {
    const text = generateReceiptText(sale);
    const phone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareReceipt = async (sale: Sale) => {
    const text = generateReceiptText(sale);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${sale.saleNumber} - ${business?.name || 'Eagle Business Manager'}`,
          text,
        });
        return;
      } catch (err) {
        // User cancelled or share unhandled; fall back to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    alert('Receipt copied to clipboard! You can paste and share it anywhere.');
  };

  const handleDownloadPdf = () => {
    window.print();
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
      setLastCompletedSale(createdSale);
      setSaleSuccessMessage(`SALE COMPLETED ✓ Receipt #${createdSale.saleNumber} generated!`);
      setTimeout(() => setSaleSuccessMessage(null), 8000);

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

      {lastCompletedSale && (
        <div
          id="sale-completed-banner"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 shadow-sm animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg shadow-sm">
              ✓
            </div>
            <div>
              <p className="text-sm font-black tracking-wide text-emerald-900 dark:text-emerald-100">
                SALE COMPLETED ✓
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Receipt #{lastCompletedSale.saleNumber} • Total: {currency} {lastCompletedSale.total.toLocaleString()} • Items: {lastCompletedSale.items.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-receipt-btn"
              type="button"
              onClick={() => setSelectedSaleForReceipt(lastCompletedSale)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="h-4 w-4" />
              <span>[ VIEW RECEIPT ]</span>
            </button>
            <button
              type="button"
              onClick={() => setLastCompletedSale(null)}
              className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {saleSuccessMessage && !lastCompletedSale && (
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
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name or SKU..."
                    className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition shrink-0 cursor-pointer"
                  title="Scan product barcode or QR label"
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Scan</span>
                </button>
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

              {/* SELECT RECIPIENT */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Select Recipient
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddRecipientModal(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add New Recipient</span>
                  </button>
                </div>

                {/* 2 Recipient Segment Modes */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientMode('walkin');
                      setSelectedCustomerId('');
                    }}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      recipientMode === 'walkin'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Walk-in Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientMode('existing')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      recipientMode === 'existing'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Existing Recipient ({customers.length})
                  </button>
                </div>

                {recipientMode === 'walkin' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={walkinName}
                      onChange={(e) => setWalkinName(e.target.value)}
                      placeholder="Customer Name (Walk-in)"
                      className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={walkinPhone}
                      onChange={(e) => setWalkinPhone(e.target.value)}
                      placeholder="Phone (Optional)"
                      className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search existing recipients by name or phone..."
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="">-- Choose Existing Recipient --</option>
                      {customers
                        .filter(
                          (c) =>
                            !recipientSearch ||
                            c.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            c.phone.includes(recipientSearch)
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} • {c.phone} {c.address ? `(${c.address})` : ''}
                          </option>
                        ))}
                    </select>
                    {selectedCustomerId && (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300">
                        <span>
                          Selected: <strong>{customers.find((c) => c.id === selectedCustomerId)?.name}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerId('')}
                          className="text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
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

      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <CameraScannerModal
          isOpen={showCameraScanner}
          onClose={() => setShowCameraScanner(false)}
          onScanSuccess={handleScannedCode}
          title="Scan Product Barcode or QR"
          subtitle="Point at any product packaging or shelf tag to add to sale"
        />
      )}

      {/* Add Recipient Modal */}
      {showAddRecipientModal && (
        <AddRecipientModal
          isOpen={showAddRecipientModal}
          onClose={() => setShowAddRecipientModal(false)}
          onSaved={handleRecipientSaved}
        />
      )}

      {/* Official Printable Receipt Studio Modal */}
      {selectedSaleForReceipt && (
        <ReceiptStudioModal
          isOpen={!!selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          sale={selectedSaleForReceipt}
          business={business}
        />
      )}
    </div>
  );
};
