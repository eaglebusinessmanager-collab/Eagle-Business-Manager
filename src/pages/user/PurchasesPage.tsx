import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  AlertTriangle,
  ArrowDownRight,
  X,
  Building2,
  Search,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { PurchaseOrder, Product, Supplier } from '../../types';

export const PurchasesPage: React.FC = () => {
  const { business, user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New PO State
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    { productId?: string; productName: string; sku?: string; quantity: number; unitCost: number }[]
  >([]);

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [allProducts, allSuppliers] = await Promise.all([
        dbService.getProducts(business.id),
        dbService.getSuppliers(business.id),
      ]);
      setProducts(allProducts);
      setSuppliers(allSuppliers);

      // Load POs from localStorage or db
      const savedPOs = localStorage.getItem(`eagle_pos_${business.id}`);
      if (savedPOs) {
        setPurchaseOrders(JSON.parse(savedPOs));
      } else {
        // Initial sample PO
        const sample: PurchaseOrder = {
          id: 'po-001',
          businessId: business.id,
          poNumber: 'PO-2026-001',
          supplierName: 'Kampala Electronics Wholesalers',
          supplierPhone: '+256 701 234 567',
          items: [
            {
              productName: 'Solar Inverter 1000W Pure Sine',
              sku: 'SOL-INV-1K',
              quantity: 5,
              unitCost: 350000,
              totalCost: 1750000,
            },
          ],
          totalAmount: 1750000,
          status: 'ordered',
          orderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdBy: user?.id || 'admin',
        };
        setPurchaseOrders([sample]);
        localStorage.setItem(`eagle_pos_${business.id}`, JSON.stringify([sample]));
      }
    } catch (e) {
      console.error('Error loading purchase orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const savePOs = (pos: PurchaseOrder[]) => {
    if (!business) return;
    setPurchaseOrders(pos);
    localStorage.setItem(`eagle_pos_${business.id}`, JSON.stringify(pos));
  };

  // Auto-fill low stock items needing reorder
  const handleAutoSuggestLowStock = () => {
    const lowStock = products.filter((p) => p.currentStock <= (p.minStockAlert || 5));
    if (lowStock.length === 0) {
      alert('Great news! All products currently have healthy stock levels.');
      return;
    }

    const suggestedItems = lowStock.map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      quantity: Math.max(10, (p.minStockAlert || 5) * 2 - p.currentStock),
      unitCost: p.costPrice || Math.round(p.sellingPrice * 0.7),
    }));

    setPoItems(suggestedItems);
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    setPoItems([
      ...poItems,
      { productName: '', quantity: 1, unitCost: 10000 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleSelectProduct = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...poItems];
    updated[index] = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: updated[index].quantity || 1,
      unitCost: prod.costPrice || Math.round(prod.sellingPrice * 0.7),
    };
    setPoItems(updated);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !user || poItems.length === 0) return;

    const supp = suppliers.find((s) => s.id === supplierId);
    const totalAmount = poItems.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      businessId: business.id,
      poNumber: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId: supplierId || undefined,
      supplierName: supp?.name || supplierName || 'General Wholesaler',
      supplierPhone: supp?.phone,
      items: poItems.map((it) => ({
        ...it,
        totalCost: it.quantity * it.unitCost,
      })),
      totalAmount,
      status: 'ordered',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: expectedDate || undefined,
      notes: poNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
    };

    savePOs([newPO, ...purchaseOrders]);
    setShowCreateModal(false);
    setPoItems([]);
    setSupplierName('');
    setSupplierId('');
    setPoNotes('');
  };

  // Receive Purchase Order: Increment stock in products, log stock adjustment and expense
  const handleReceivePO = async (po: PurchaseOrder) => {
    if (!business || !user) return;
    if (!window.confirm(`Receive and stock in all items from ${po.poNumber}? This will automatically increase physical product stock levels.`)) return;

    for (const item of po.items) {
      if (item.productId) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const newQty = prod.currentStock + item.quantity;
          await dbService.recordStockAdjustment({
            businessId: business.id,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            previousQuantity: prod.currentStock,
            adjustmentAmount: item.quantity,
            newQuantity: newQty,
            reason: 'correction',
            notes: `Restock received from ${po.poNumber}`,
            userName: user.fullName || 'Admin',
            userId: user.id,
          });
        }
      }
    }

    // Record restock expense
    const nowIso = new Date().toISOString();
    await dbService.createExpense({
      id: `exp-${Date.now()}`,
      businessId: business.id,
      title: `Inventory Restock: ${po.poNumber} (${po.supplierName})`,
      amount: po.totalAmount,
      category: 'inventory',
      date: nowIso.split('T')[0],
      paymentMethod: 'cash',
      notes: `Restocked ${po.items.length} items from ${po.supplierName}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: user?.fullName || 'Admin',
    });

    // Update PO status
    const updated = purchaseOrders.map((p) =>
      p.id === po.id ? { ...p, status: 'received' as const, receivedDate: new Date().toISOString() } : p
    );
    savePOs(updated);
    await loadData();
    alert(`Successfully received ${po.poNumber}. Stock counts incremented and expense recorded!`);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span>Purchases & Supplier Procurement</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage purchase orders, restock procurement, and 1-click automatic stock-in reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoSuggestLowStock}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Restock Low Stock</span>
          </button>

          <button
            onClick={() => {
              setPoItems([{ productName: '', quantity: 1, unitCost: 10000 }]);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* PO List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Procurement Orders
          </h3>
          <span className="text-xs font-mono text-slate-400">{purchaseOrders.length} Orders</span>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Truck className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No purchase orders created yet.</p>
            <p className="text-xs mt-0.5">Use "New Purchase Order" to draft orders for wholesale inventory.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                      {po.poNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        po.status === 'received'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    Supplier: {po.supplierName} • {po.items.length} item types
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ordered: {new Date(po.orderDate).toLocaleDateString()}
                    {po.receivedDate && ` • Stocked in: ${new Date(po.receivedDate).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    UGX {po.totalAmount.toLocaleString()}
                  </span>

                  {po.status !== 'received' ? (
                    <button
                      onClick={() => handleReceivePO(po)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Stock In / Receive</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Received</span>
                    </span>
                  )}

                  <button
                    onClick={() => window.print()}
                    title="Print PO"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Restock Purchase Order
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Select Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => {
                      setSupplierId(e.target.value);
                      const s = suppliers.find((sp) => sp.id === e.target.value);
                      if (s) setSupplierName(s.name);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">-- Choose or enter custom --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Supplier Name / Business</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Mukwano Wholesalers"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Ordered Products & Quantities</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Add Product Line
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-5">
                      <select
                        onChange={(e) => handleSelectProduct(idx, e.target.value)}
                        value={item.productId || ''}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Cost"
                        value={item.unitCost}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].unitCost = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
                >
                  Save Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
