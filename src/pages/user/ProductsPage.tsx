import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  History,
  X,
  CheckCircle,
  Tag,
  DollarSign,
  Barcode,
  Image as ImageIcon,
  ZoomIn,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import { InventoryMovement, Product } from '../../types';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ProductImageUploader } from '../../components/products/ProductImageUploader';

export const ProductsPage: React.FC = () => {
  const { business, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'created'>('name');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Stock intake / restock');
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movementHistory, setMovementHistory] = useState<InventoryMovement[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [zoomImage, setZoomImage] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'General',
    description: '',
    buyingPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStockLevel: 5,
    imageUrl: '',
    status: 'active' as 'active' | 'inactive',
  });

  const currency = business?.currency || 'UGX';

  const loadProducts = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const list = await dbService.getProducts(business.id);
      setProducts(list);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [business?.id]);

  const categories = Array.from(new Set(['All', ...products.map((p) => p.category).filter(Boolean)]));

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      category: 'Electronics',
      description: '',
      buyingPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minStockLevel: 5,
      imageUrl: '',
      status: 'active',
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      description: prod.description,
      buyingPrice: prod.buyingPrice,
      sellingPrice: prod.sellingPrice,
      currentStock: prod.currentStock,
      minStockLevel: prod.minStockLevel,
      imageUrl: prod.imageUrl || '',
      status: prod.status,
    });
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (editingProduct) {
      await dbService.updateProduct(editingProduct.id, business.id, {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        description: formData.description,
        buyingPrice: Number(formData.buyingPrice),
        sellingPrice: Number(formData.sellingPrice),
        minStockLevel: Number(formData.minStockLevel),
        imageUrl: formData.imageUrl,
        status: formData.status,
      });
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        businessId: business.id,
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        description: formData.description,
        buyingPrice: Number(formData.buyingPrice),
        sellingPrice: Number(formData.sellingPrice),
        currentStock: Number(formData.currentStock),
        minStockLevel: Number(formData.minStockLevel),
        imageUrl: formData.imageUrl,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbService.createProduct(newProd);
    }

    setShowAddModal(false);
    await loadProducts();
  };

  const handleDeleteProduct = async () => {
    if (!business || !productToDelete) return;
    await dbService.deleteProduct(productToDelete.id, business.id);
    setProductToDelete(null);
    await loadProducts();
  };

  const handleOpenAdjustStock = (prod: Product) => {
    setAdjustingProduct(prod);
    setAdjustmentQty(0);
    setAdjustmentReason('Stock intake / restock');
  };

  const handleConfirmStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !adjustingProduct || adjustmentQty === 0) return;

    await dbService.adjustStock(
      adjustingProduct.id,
      business.id,
      adjustmentQty,
      adjustmentReason,
      user?.fullName || 'User'
    );

    setAdjustingProduct(null);
    await loadProducts();
  };

  const handleOpenHistory = async (prod: Product) => {
    if (!business) return;
    setHistoryProduct(prod);
    const movs = await dbService.getInventoryMovements(business.id, prod.id);
    setMovementHistory(movs);
  };

  // Filter & Sort
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.currentStock <= p.minStockLevel && p.currentStock > 0;
    } else if (stockFilter === 'out') {
      matchesStock = p.currentStock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  filteredProducts.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'stock') return a.currentStock - b.currentStock;
    if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Inventory & Products
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your stock items, buying/selling prices, minimum alerts, and adjustments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or category..."
              className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Stock: All</option>
              <option value="low">Stock: Low Alerts</option>
              <option value="out">Stock: Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <ArrowUpDown className="h-3 w-3" /> Sort by:
          </span>
          <button
            onClick={() => setSortBy('name')}
            className={`px-2 py-1 rounded-lg font-semibold ${
              sortBy === 'name'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Name
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={`px-2 py-1 rounded-lg font-semibold ${
              sortBy === 'price'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setSortBy('stock')}
            className={`px-2 py-1 rounded-lg font-semibold ${
              sortBy === 'stock'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Stock Level
          </button>
          <button
            onClick={() => setSortBy('created')}
            className={`px-2 py-1 rounded-lg font-semibold ${
              sortBy === 'created'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Date Added
          </button>
        </div>
      </div>

      {/* Products Cards / Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
          <Package className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-50" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No products found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search query or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map((p) => {
            const isLowStock = p.currentStock <= p.minStockLevel && p.currentStock > 0;
            const isOutOfStock = p.currentStock === 0;

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  {/* Product Photo Area */}
                  <div
                    onClick={() => {
                      if (p.imageUrl) {
                        setZoomImage(p);
                      } else {
                        handleOpenEdit(p);
                      }
                    }}
                    className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 mb-3 border border-slate-200/60 dark:border-slate-800 group cursor-pointer"
                  >
                    {p.imageUrl ? (
                      <>
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition px-2.5 py-1 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center gap-1">
                            <ZoomIn className="h-3 w-3" />
                            <span>Inspect Photo</span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <Camera className="h-7 w-7 mb-1 opacity-40 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          + Add Product Photo
                        </span>
                      </div>
                    )}

                    {/* Category overlay */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs uppercase tracking-wider">
                        {p.category}
                      </span>
                    </div>

                    {/* Stock Status Badge overlay */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="h-3 w-3" /> Low
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-600/90 text-white shadow-xs">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    SKU: {p.sku}
                  </p>

                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Price and Stock Metrics */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Selling Price</span>
                      <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Available Units</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isOutOfStock
                            ? 'text-rose-600 dark:text-rose-400'
                            : isLowStock
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {p.currentStock} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    onClick={() => handleOpenAdjustStock(p)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Adjust Stock</span>
                  </button>

                  <button
                    onClick={() => handleOpenHistory(p)}
                    className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="View Stock History"
                  >
                    <History className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    title="Edit Product"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setProductToDelete(p)}
                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Smart 43-inch LED TV"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. EL-TV-4301"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Electronics"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Buying Price ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.buyingPrice}
                    onChange={(e) => setFormData({ ...formData, buyingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Stock Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Min Stock Alert Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Product Image Uploader with Presets & Camera/File Support */}
              <ProductImageUploader
                imageUrl={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                productName={formData.name}
              />

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Specs, warranty, features..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Stock Adjustment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjusting stock for: <strong className="text-slate-800 dark:text-slate-200">{adjustingProduct.name}</strong>
            </p>

            <form onSubmit={handleConfirmStockAdjustment} className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono">
                <span className="text-slate-400 block text-[11px]">Current On-Hand Stock</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {adjustingProduct.currentStock} units
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity to Add or Subtract (+ / -)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  placeholder="e.g. +10 or -2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  New stock will become: <strong className="font-mono">{Math.max(0, adjustingProduct.currentStock + adjustmentQty)}</strong> units
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="New stock delivery from supplier">New stock delivery from supplier</option>
                  <option value="Inventory audit physical recount">Inventory audit physical recount</option>
                  <option value="Damaged or expired stock write-off">Damaged or expired stock write-off</option>
                  <option value="Customer return / restock">Customer return / restock</option>
                  <option value="Internal business use / demo">Internal business use / demo</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Stock Movement History
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{historyProduct.name}</p>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2 text-xs">
              {movementHistory.length === 0 ? (
                <p className="text-center py-6 text-slate-400">No stock movements recorded yet.</p>
              ) : (
                movementHistory.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          m.quantityChange > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} units
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{m.reason}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Stock: {m.previousStock} → {m.newStock}</span>
                      {m.createdBy && <span>By: {m.createdBy}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />

      {/* High-Resolution Product Image Inspection Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative h-72 sm:h-80 w-full bg-slate-950 flex items-center justify-center">
              <img
                src={zoomImage.imageUrl}
                alt={zoomImage.name}
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                    {zoomImage.category}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {zoomImage.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: {zoomImage.sku}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium block">Price</span>
                  <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">
                    {formatCurrency(zoomImage.sellingPrice)}
                  </span>
                </div>
              </div>

              {zoomImage.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {zoomImage.description}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Stock Units: <span className="font-bold text-slate-800 dark:text-slate-200">{zoomImage.currentStock}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prod = zoomImage;
                      setZoomImage(null);
                      handleOpenEdit(prod);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                  >
                    Edit Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomImage(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
