import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Store,
  Phone,
  MessageCircle,
  User,
  ShoppingBag,
  Filter,
  CheckCircle2,
  ExternalLink,
  Share2,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  X,
  Building2,
  Package,
  Layers,
  Sparkles,
  PhoneCall,
  Info,
} from 'lucide-react';
import { Product } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface MarketplacePageProps {
  onNavigate?: (view: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const { user, business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('eagle_marketplace_search') || '';
  });

  useEffect(() => {
    const saved = localStorage.getItem('eagle_marketplace_search');
    if (saved) {
      setSearchQuery(saved);
      localStorage.removeItem('eagle_marketplace_search');
    }
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeller, setSelectedSeller] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock'>('newest');

  // Modal inspection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const defaultCurrency = business?.currency || 'UGX';

  const loadMarketplaceProducts = async () => {
    setLoading(true);
    try {
      const items = await dbService.getAllMarketplaceProducts();
      setProducts(items);
    } catch (err) {
      console.error('Failed to load marketplace products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceProducts();
  }, []);

  // Compute distinct categories and sellers
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [products]);

  const sellers = useMemo(() => {
    const list = Array.from(
      new Set(
        products
          .map((p) => p.sellerName || p.businessName)
          .filter(Boolean) as string[]
      )
    );
    return ['All', ...list.sort()];
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products
      .filter((p) => {
        // Search query filter
        const matchQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
          (p.businessName && p.businessName.toLowerCase().includes(q)) ||
          (p.sellerPhone && p.sellerPhone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')));

        // Category filter
        const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

        // Seller filter
        const matchSeller =
          selectedSeller === 'All' ||
          p.sellerName === selectedSeller ||
          p.businessName === selectedSeller;

        // Stock filter
        const matchStock = !inStockOnly || p.currentStock > 0;

        return matchQuery && matchCategory && matchSeller && matchStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
        if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'stock') return b.currentStock - a.currentStock;
        // Default newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, searchQuery, selectedCategory, selectedSeller, inStockOnly, sortBy]);

  const formatCurrency = (val: number) => `${defaultCurrency} ${val.toLocaleString()}`;

  const handleContactWhatsApp = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const phone = (product.sellerPhone || '').replace(/\D/g, '');
    const sellerName = product.sellerName || 'Merchant';
    const message = `Hello ${sellerName}, I saw your product "${product.name}" listed at ${formatCurrency(product.sellingPrice)} on Eagle Business Manager. Is it currently in stock and available for purchase?`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCallSeller = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const phone = product.sellerPhone || '';
    if (phone) {
      window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
    }
  };

  const handleShareProduct = (product: Product) => {
    const text = `Check out "${product.name}" by ${product.sellerName || product.businessName} on Eagle Business Manager: ${formatCurrency(product.sellingPrice)}. Contact: ${product.sellerPhone || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>COMMUNITY MARKETPLACE & MERCHANT NETWORK</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Connect, Explore & Trade with Verified Merchants
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Discover products listed by business owners and merchants across the platform. Find
            inventory, compare prices, search across categories, and reach sellers directly via
            phone or WhatsApp.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-semibold">
              <Package className="h-4 w-4 text-blue-300" />
              <span>{products.length} Total Products Listed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-semibold">
              <Building2 className="h-4 w-4 text-emerald-300" />
              <span>{sellers.length - 1} Registered Merchants</span>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('products')}
                className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
              >
                <Store className="h-3.5 w-3.5" />
                <span>Manage My Catalog</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Search and Filter Panel */}
      <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, seller name, or phone number..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Seller / Merchant Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filter by Seller
            </label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Verified Sellers</option>
              {sellers.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="newest">Newest Arrivals First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Highest Stock Availability</option>
            </select>
          </div>

          {/* In-Stock Toggle */}
          <div className="flex items-end">
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-full h-[38px] px-3 py-2 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                inStockOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${inStockOnly ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>In Stock Only</span>
            </button>
          </div>
        </div>

        {/* Quick Category Chips for Fast Browsing */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Quick Filter:</span>
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Results Count and Active Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span>{' '}
          {filteredProducts.length === 1 ? 'product' : 'products'}
          {(searchQuery || selectedCategory !== 'All' || selectedSeller !== 'All' || inStockOnly) && (
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">(Filtered)</span>
          )}
        </div>

        {(searchQuery || selectedCategory !== 'All' || selectedSeller !== 'All' || inStockOnly) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedSeller('All');
              setInStockOnly(false);
            }}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Loading products from community merchants...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl bg-white p-12 text-center shadow-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No products found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            We couldn't find any products matching your search criteria. Try modifying your search
            keywords or changing the selected category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedSeller('All');
              setInStockOnly(false);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.currentStock <= 0;
            const sellerName = p.sellerName || 'Verified Merchant';
            const sellerPhone = p.sellerPhone || '+256 743 566 645';
            const sellerBusiness = p.businessName || 'Eagle Business Store';

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="group cursor-pointer rounded-3xl bg-white p-4 shadow-xs hover:shadow-lg transition-all duration-200 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700"
              >
                <div>
                  {/* Photo Banner with Category & Stock Badges */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3.5">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-4 text-center">
                        <Package className="h-10 w-10 mb-1 opacity-50" />
                        <span className="text-[11px] font-semibold">Standard Catalog Item</span>
                      </div>
                    )}

                    {/* Stock status overlay badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase shadow-xs ${
                          isOutOfStock
                            ? 'bg-rose-500 text-white'
                            : p.currentStock <= p.minStockLevel
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isOutOfStock ? 'Sold Out' : `${p.currentStock} in stock`}
                      </span>
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                        {p.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Title and Price */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                      {p.description || 'Verified authentic product listed by verified merchant.'}
                    </p>

                    <div className="pt-2 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.sku}
                      </span>
                    </div>
                  </div>

                  {/* Seller & Merchant Details Box */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {sellerName}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold shrink-0">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="truncate max-w-[140px] text-[10px]">
                        {sellerBusiness}
                      </span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                        {sellerPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instant Contact Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleContactWhatsApp(p, e)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                    title={`Send WhatsApp message to ${sellerName}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCallSeller(p, e)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition"
                    title={`Direct phone call to ${sellerPhone}`}
                  >
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <span>Call</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail & Inspection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Product Overview
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • {selectedProduct.sku}
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-5">
              {/* Product Photo & Main Spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <Package className="h-12 w-12 mb-2 opacity-50" />
                      <span className="text-xs font-semibold">Standard Catalog Item</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between space-y-3">
                  <div>
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold">
                      {selectedProduct.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-2 leading-snug">
                      {selectedProduct.name}
                    </h2>
                    <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(selectedProduct.sellingPrice)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stock Availability:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedProduct.currentStock > 0
                          ? `${selectedProduct.currentStock} units available`
                          : 'Currently Out of Stock'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Listed on:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(selectedProduct.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Product Description & Specifications
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  {selectedProduct.description ||
                    'No detailed description provided by seller. Please contact the seller directly for full specifications and warranties.'}
                </p>
              </div>

              {/* Seller Information Card */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedProduct.sellerName || 'Verified Merchant'}
                        </h4>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedProduct.businessName || 'Eagle Business Network'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active Seller
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono font-semibold">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>{selectedProduct.sellerPhone || '+256 743 566 645'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleContactWhatsApp(selectedProduct)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallSeller(selectedProduct)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>Call Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleShareProduct(selectedProduct)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{copiedNotification ? 'Details Copied!' : 'Share Product'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
