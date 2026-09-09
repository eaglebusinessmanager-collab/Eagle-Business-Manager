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
  Heart,
  Star,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  MapPin,
  Send,
  Printer,
} from 'lucide-react';
import { Product, MarketplaceReview, ProductReport } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { generateProductQrDataUrl, renderBarcodeSvg, printProductLabel } from '../../utils/barcode';
import { getWhatsAppUrl, getTelUrl } from '../../utils/phone';

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

  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'new' | 'favourites'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeller, setSelectedSeller] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');

  // Favourites
  const [favourites, setFavourites] = useState<string[]>([]);

  // Modal inspection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductQr, setSelectedProductQr] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Product Reviews State
  const [productReviews, setProductReviews] = useState<MarketplaceReview[]>([]);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report Listing Modal
  const [reportProductTarget, setReportProductTarget] = useState<Product | null>(null);
  const [reportReason, setReportReason] = useState('Misleading product information or description');
  const [reportDetails, setReportDetails] = useState('');
  const [reportingSuccess, setReportingSuccess] = useState(false);

  // Dedicated Merchant Storefront View Mode
  const [storefrontMerchant, setStorefrontMerchant] = useState<string | null>(null);

  const defaultCurrency = business?.currency || 'UGX';

  const loadMarketplaceProducts = async () => {
    setLoading(true);
    try {
      const items = await dbService.getAllMarketplaceProducts();
      setProducts(items);

      // Load favourites
      const favs = await dbService.getFavourites(user?.id);
      setFavourites(favs);
    } catch (err) {
      console.error('Failed to load marketplace products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceProducts();
  }, [user?.id]);

  // Load reviews when modal opens
  useEffect(() => {
    if (selectedProduct) {
      dbService.getReviews(selectedProduct.id).then(setProductReviews);
      generateProductQrDataUrl(selectedProduct).then(setSelectedProductQr);
      // Track view
      dbService.trackMarketplaceAction(selectedProduct.id, 'view');
    }
  }, [selectedProduct]);

  // Handle favourite toggle
  const handleToggleFavourite = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFav = await dbService.toggleFavourite(productId, user?.id);
    setFavourites((prev) =>
      isFav ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  // Compute distinct categories and sellers
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [products]);

  const sellers = useMemo(() => {
    const list = Array.from(
      new Set(
        products
          .map((p) => p.businessName || p.sellerName)
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
        // Tab Filter
        if (activeTab === 'favourites' && !favourites.includes(p.id)) return false;
        if (activeTab === 'featured' && !p.featured && (p.rating || 0) < 4.8) return false;
        if (activeTab === 'new') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          if (p.createdAt < sevenDaysAgo) return false;
        }

        // Storefront Filter
        if (storefrontMerchant) {
          const bizName = p.businessName || p.sellerName;
          if (bizName !== storefrontMerchant) return false;
        }

        // Search query filter
        const matchQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
          (p.businessName && p.businessName.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q));

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
        if (sortBy === 'popular') return (b.marketplaceViews || 0) - (a.marketplaceViews || 0);
        // Default newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSeller,
    inStockOnly,
    sortBy,
    activeTab,
    favourites,
    storefrontMerchant,
  ]);

  const formatCurrency = (val: number) => `${defaultCurrency} ${val.toLocaleString()}`;

  const handleContactWhatsApp = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dbService.trackMarketplaceAction(product.id, 'enquiry');
    const phone = product.sellerPhone || '+256743566645';
    const sellerName = product.sellerName || 'Merchant';
    const message = `Hello ${sellerName}, I found your product "${product.name}" listed at ${formatCurrency(product.sellingPrice)} on Eagle Business Manager. Is it available for purchase?`;
    window.open(getWhatsAppUrl(phone, message), '_blank');
  };

  const handleCallSeller = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dbService.trackMarketplaceAction(product.id, 'enquiry');
    const phone = product.sellerPhone || '+256743566645';
    window.location.href = getTelUrl(phone);
  };

  const handleShareProduct = (product: Product) => {
    const origin = window.location.origin;
    const link = `${origin}/#marketplace?product=${product.id}`;
    const text = `Check out "${product.name}" on Eagle Marketplace: ${formatCurrency(product.sellingPrice)}\n${link}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewerName.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const newReview: MarketplaceReview = {
        id: 'rev-' + Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        reviewerName: reviewerName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
      };

      const added = await dbService.addReview(newReview);
      setProductReviews((prev) => [added, ...prev]);
      setReviewComment('');
      setReviewerName('');
      setReviewRating(5);

      // Update product rating in list
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, rating: reviewRating, reviewCount: (p.reviewCount || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to add review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit Report Listing
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportProductTarget) return;

    try {
      await dbService.reportProduct(reportProductTarget.id, {
        id: 'rep-' + Date.now(),
        productId: reportProductTarget.id,
        productName: reportProductTarget.name,
        reason: `${reportReason}: ${reportDetails}`,
        reporterId: user?.id || 'guest',
        reporterName: user?.fullName || 'Anonymous User',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setReportingSuccess(true);
      setTimeout(() => {
        setReportingSuccess(false);
        setReportProductTarget(null);
        setReportDetails('');
      }, 2000);
    } catch (e) {
      console.error('Report submission failed:', e);
    }
  };

  // Storefront merchant details
  const merchantInfo = useMemo(() => {
    if (!storefrontMerchant) return null;
    const sample = products.find(
      (p) => (p.businessName || p.sellerName) === storefrontMerchant
    );
    const count = products.filter(
      (p) => (p.businessName || p.sellerName) === storefrontMerchant
    ).length;
    return {
      name: storefrontMerchant,
      owner: sample?.sellerName || 'Merchant Partner',
      phone: sample?.sellerPhone || '+256 743 566 645',
      location: sample?.sellerLocation || 'Kampala, Uganda',
      productCount: count,
    };
  }, [storefrontMerchant, products]);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Merchant Storefront Showcase Banner (When active) */}
      {storefrontMerchant && merchantInfo ? (
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-900/50 relative overflow-hidden">
          <button
            onClick={() => setStorefrontMerchant(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Community Marketplace</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                {merchantInfo.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black">{merchantInfo.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/40 uppercase">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Eagle Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-400" />
                    <span>{merchantInfo.owner}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    <span>{merchantInfo.location}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getWhatsAppUrl(
                  merchantInfo.phone,
                  `Hello ${merchantInfo.owner}, I am browsing your verified storefront on Eagle Marketplace.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Storefront</span>
              </a>
              <a
                href={getTelUrl(merchantInfo.phone)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition"
              >
                <Phone className="h-4 w-4" />
                <span>Call Store</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Top Banner & Overview */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>EAGLE COMMUNITY MARKETPLACE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Discover, Compare & Trade with Verified Ugandan Merchants
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Find authentic products from local retail and wholesale businesses across Uganda. Verify items with QR codes, save your favourites, and chat directly with sellers via WhatsApp.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-semibold">
                <Package className="h-4 w-4 text-blue-300" />
                <span>{products.length} Products Listed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-semibold">
                <Building2 className="h-4 w-4 text-emerald-300" />
                <span>{sellers.length - 1} Verified Merchants</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-semibold">
                <Heart className="h-4 w-4 text-rose-300" />
                <span>{favourites.length} Saved Favourites</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Panel */}
      <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, SKU, barcode, seller name, or phone..."
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

        {/* Tabbed Quick Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>All Listings ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'featured'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Featured & Top Rated</span>
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'new'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="h-3.5 w-3.5 text-emerald-400" />
            <span>New Arrivals</span>
          </button>
          <button
            onClick={() => setActiveTab('favourites')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'favourites'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>Saved Favourites ({favourites.length})</span>
          </button>
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
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
              Filter by Merchant
            </label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Most Inquired / Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
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

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Popular:</span>
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

      {/* Results Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span> items
          {storefrontMerchant && (
            <span className="ml-1 text-blue-600 font-bold">from {storefrontMerchant}</span>
          )}
        </div>

        {(searchQuery || selectedCategory !== 'All' || selectedSeller !== 'All' || inStockOnly || activeTab !== 'all' || storefrontMerchant) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedSeller('All');
              setInStockOnly(false);
              setActiveTab('all');
              setStorefrontMerchant(null);
            }}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading marketplace listings...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No products found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or clearing selected category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.currentStock <= 0;
            const sellerName = p.sellerName || 'Verified Merchant';
            const sellerPhone = p.sellerPhone || '+256 743 566 645';
            const sellerBusiness = p.businessName || 'Eagle Business Store';
            const isFav = favourites.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="group cursor-pointer rounded-3xl bg-white p-4 shadow-xs hover:shadow-lg transition-all duration-200 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 relative"
              >
                <div>
                  {/* Photo Banner with Category, Stock, and Favourite Button */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-xs ${
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

                    {/* Favourite Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavourite(p.id, e)}
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center shadow-xs transition hover:scale-110"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title, Category & Price */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                        {p.category}
                      </span>
                      {p.rating && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span>{p.rating}</span>
                        </span>
                      )}
                    </div>

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

                  {/* Seller Details Box */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {sellerBusiness || sellerName}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold shrink-0">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instant Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleContactWhatsApp(p, e)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCallSeller(p, e)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
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
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Product Overview
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • SKU: {selectedProduct.sku}
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
                <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 relative">
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

                  <button
                    type="button"
                    onClick={() => handleToggleFavourite(selectedProduct.id)}
                    className="absolute top-2.5 right-2.5 h-9 w-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs flex items-center justify-center shadow-xs"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        favourites.includes(selectedProduct.id)
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
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
                      <span className="text-slate-500">Customer Rating:</span>
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500" />
                        <span>{selectedProduct.rating || 5.0} ({productReviews.length} reviews)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Product Description & Details
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  {selectedProduct.description ||
                    'Verified authentic product listed by verified merchant.'}
                </p>
              </div>

              {/* Public Verification QR Code & POS Barcode */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedProductQr ? (
                    <img
                      src={selectedProductQr}
                      alt="Verification QR Code"
                      className="h-20 w-20 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-slate-200 animate-pulse" />
                  )}
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 dark:text-white uppercase">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Authenticity QR Code</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                      Scan with any smartphone to verify official Eagle Business listing and share details.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto text-center sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                    Barcode (POS)
                  </span>
                  <div
                    className="inline-block max-w-[150px]"
                    dangerouslySetInnerHTML={{
                      __html: renderBarcodeSvg(
                        selectedProduct.barcode || selectedProduct.sku,
                        150,
                        44
                      ),
                    }}
                  />
                </div>
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
                          {selectedProduct.businessName || selectedProduct.sellerName || 'Verified Merchant'}
                        </h4>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedProduct.sellerLocation || 'Kampala, Uganda'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStorefrontMerchant(
                        selectedProduct.businessName || selectedProduct.sellerName || null
                      );
                      setSelectedProduct(null);
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Store className="h-3.5 w-3.5" />
                    <span>View Storefront</span>
                  </button>
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

              {/* Customer Reviews Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Customer Reviews & Feedback ({productReviews.length})</span>
                </h4>

                {/* Reviews List */}
                {productReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No community reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {productReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rev.reviewerName}
                          </span>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{rev.comment}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write a Review Form */}
                <form
                  onSubmit={handleSubmitReview}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Leave a Verified Review:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Your name or company..."
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-[11px] text-slate-500 mr-1">Rating:</span>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReviewRating(num)}
                          className="p-0.5 text-amber-500"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              num <= reviewRating ? 'fill-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with product quality, delivery speed, and customer service..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareProduct(selectedProduct)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>{copiedNotification ? 'Link Copied!' : 'Share Product'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportProductTarget(selectedProduct)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Report Listing</span>
                  </button>
                </div>

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

      {/* Report Listing Modal */}
      {reportProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Report Listing
                </h3>
              </div>
              <button
                onClick={() => setReportProductTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reportingSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Report Submitted
                </p>
                <p className="text-xs text-slate-500">
                  Our moderation team has received your report and will inspect this product listing promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="mt-4 space-y-3.5 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Reporting: <span className="font-bold text-slate-900 dark:text-white">{reportProductTarget.name}</span>
                </p>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Report:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Misleading product information or description">
                      Misleading product information or description
                    </option>
                    <option value="Suspected counterfeit or fake brand">
                      Suspected counterfeit or fake brand
                    </option>
                    <option value="Seller unresponsive or out of stock">
                      Seller unresponsive or out of stock
                    </option>
                    <option value="Inappropriate, offensive, or scam content">
                      Inappropriate, offensive, or scam content
                    </option>
                    <option value="Duplicate or spam listing">Duplicate or spam listing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Details / Explanation:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide specific details to help the admin team investigate..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReportProductTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm active:scale-95"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
