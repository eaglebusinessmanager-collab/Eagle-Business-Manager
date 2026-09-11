import {
  Announcement,
  AppSetting,
  AuditLog,
  Business,
  BusinessDocument,
  BusinessNote,
  CalendarEvent,
  Customer,
  DocumentPrefixConfig,
  Expense,
  FavouriteItem,
  FinanceReconciliationRecord,
  InAppNotification,
  InventoryMovement,
  Invoice,
  MarketplaceReview,
  ModerationStatus,
  PaymentMethod,
  PaymentStatus,
  PlatformStats,
  Product,
  ProductReport,
  Quotation,
  ReceiptCustomizationConfig,
  RecycleBinItem,
  Sale,
  SalePaymentRecord,
  StockAdjustment,
  Supplier,
  UserProfile,
} from '../types';
import { offlineSync } from './offlineSync';
import {
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'eagle_business_';

// Initial Mock / Pre-seeded Database State
const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz-001',
    name: 'Eagle Styles Store',
    category: 'Electronics & Retail',
    phone: '+256 743 566 645',
    address: 'Plot 45 Kampala Road, Shop 12, Kampala, Uganda',
    description: 'Premier supplier of high-grade home appliances, solar equipment, and consumer electronics.',
    currency: 'UGX',
    logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80',
    invoiceNotes: 'Payment is due within 14 days of invoice date. Thank you for doing business with us!',
    receiptFooter: 'Goods once sold are not returnable without an official receipt.',
    status: 'active',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'biz-002',
    name: 'Victoria Fresh Groceries',
    category: 'Retail & Supermarket',
    phone: '+256 772 888 999',
    address: 'Victoria Mall Basement, Entebbe, Uganda',
    description: 'Farm fresh produce, groceries, and daily essentials.',
    currency: 'UGX',
    status: 'active',
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'biz-003',
    name: 'Kampala Solar Hub',
    category: 'Solar & Clean Energy',
    phone: '+256 791 200 151',
    address: 'Nasser Road Commercial Complex, Kampala, Uganda',
    description: 'Certified solar deep cycle batteries, solar panels, and inverters.',
    currency: 'UGX',
    status: 'active',
    createdAt: '2025-01-16T08:00:00Z',
    updatedAt: '2025-01-16T08:00:00Z',
  },
  {
    id: 'biz-004',
    name: 'Apex Fashion & Apparel',
    category: 'Fashion & Footwear',
    phone: '+256 782 455 677',
    address: 'Equatorial Mall Level 2, Kampala, Uganda',
    description: 'Bespoke leather shoes, designer wear, and fashion accessories.',
    currency: 'UGX',
    status: 'active',
    createdAt: '2025-01-16T12:00:00Z',
    updatedAt: '2025-01-16T12:00:00Z',
  },
  {
    id: 'biz-005',
    name: 'Nile Organic Naturals',
    category: 'Cosmetics & Beauty',
    phone: '+256 755 900 123',
    address: 'Gulu Main Market, Gulu, Uganda',
    description: 'Direct producers of unrefined northern shea butter, black soap, and pure oils.',
    currency: 'UGX',
    status: 'active',
    createdAt: '2025-01-17T09:00:00Z',
    updatedAt: '2025-01-17T09:00:00Z',
  },
  {
    id: 'biz-006',
    name: 'Elgon Roast Artisans',
    category: 'Food & Beverage',
    phone: '+256 701 889 900',
    address: 'Republic Street, Mbale, Uganda',
    description: 'Specialty high-altitude organic Arabica coffee roasted to order.',
    currency: 'UGX',
    status: 'active',
    createdAt: '2025-01-17T10:00:00Z',
    updatedAt: '2025-01-17T10:00:00Z',
  },
];

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-002',
    email: 'eaglebusinessmanager@gmail.com',
    phone: '+256 743 566 645',
    username: 'eagleadmin',
    fullName: 'Eagle Styles (Tusubira Benjamin)',
    role: 'admin',
    status: 'active',
    businessId: 'biz-001',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
    password: '@Es%',
  },
  {
    id: 'user-003',
    email: 'john.merchant@gmail.com',
    phone: '+256 772 888 999',
    username: 'johnmukasa',
    fullName: 'John Mukasa',
    role: 'user',
    status: 'active',
    businessId: 'biz-002',
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-15T09:30:00Z',
    password: 'merchant123',
  },
  {
    id: 'user-004',
    email: 'kato.solar@gmail.com',
    phone: '+256 791 200 151',
    username: 'katosolar',
    fullName: 'Kato Ronald',
    role: 'user',
    status: 'active',
    businessId: 'biz-003',
    createdAt: '2025-01-16T08:00:00Z',
    updatedAt: '2025-01-16T08:00:00Z',
    password: 'merchant123',
  },
  {
    id: 'user-005',
    email: 'mary.fashion@gmail.com',
    phone: '+256 782 455 677',
    username: 'marynamubiru',
    fullName: 'Mary Namubiru',
    role: 'user',
    status: 'active',
    businessId: 'biz-004',
    createdAt: '2025-01-16T12:00:00Z',
    updatedAt: '2025-01-16T12:00:00Z',
    password: 'merchant123',
  },
  {
    id: 'user-006',
    email: 'sarah.naturals@gmail.com',
    phone: '+256 755 900 123',
    username: 'sarahakello',
    fullName: 'Sarah Akello',
    role: 'user',
    status: 'active',
    businessId: 'biz-005',
    createdAt: '2025-01-17T09:00:00Z',
    updatedAt: '2025-01-17T09:00:00Z',
    password: 'merchant123',
  },
  {
    id: 'user-007',
    email: 'denis.coffee@gmail.com',
    phone: '+256 701 889 900',
    username: 'denismugisha',
    fullName: 'Denis Mugisha',
    role: 'user',
    status: 'active',
    businessId: 'biz-006',
    createdAt: '2025-01-17T10:00:00Z',
    updatedAt: '2025-01-17T10:00:00Z',
    password: 'merchant123',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    businessId: 'biz-001',
    name: 'Smart 43" 4K UHD LED TV',
    sku: 'EL-TV-4301',
    category: 'Electronics',
    description: 'Frameless 4K Smart Android TV with HDR10, Bluetooth 5.0, and crystal-clear Dolby Audio.',
    buyingPrice: 850000,
    sellingPrice: 1150000,
    currentStock: 14,
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Eagle Styles Store (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    sellerLocation: 'Plot 45 Kampala Road, Shop 12, Kampala',
    businessName: 'Eagle Styles Store',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-11T10:00:00Z',
    updatedAt: '2025-01-11T10:00:00Z',
  },
  {
    id: 'prod-002',
    businessId: 'biz-001',
    name: 'Pure Sine Wave Solar Inverter 2.5kVA',
    sku: 'SL-INV-2500',
    category: 'Solar & Power',
    description: 'Heavy duty pure copper transformer inverter for solar backup and commercial power reliability.',
    buyingPrice: 1400000,
    sellingPrice: 1850000,
    currentStock: 6,
    minStockLevel: 4,
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Eagle Styles Store (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    sellerLocation: 'Plot 45 Kampala Road, Shop 12, Kampala',
    businessName: 'Eagle Styles Store',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-11T11:00:00Z',
    updatedAt: '2025-01-11T11:00:00Z',
  },
  {
    id: 'prod-003',
    businessId: 'biz-001',
    name: 'Rechargeable Solar Flood Light 200W',
    sku: 'SL-FLD-0200',
    category: 'Lighting',
    description: 'Dusk to dawn waterproof outdoor security flood light with monocrystalline panel and wireless remote.',
    buyingPrice: 110000,
    sellingPrice: 175000,
    currentStock: 8,
    minStockLevel: 8,
    imageUrl: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Eagle Styles Store (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    sellerLocation: 'Plot 45 Kampala Road, Shop 12, Kampala',
    businessName: 'Eagle Styles Store',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-12T09:00:00Z',
  },
  {
    id: 'prod-004',
    businessId: 'biz-001',
    name: 'Active Noise Cancelling Wireless Headphones',
    sku: 'AU-HD-099',
    category: 'Audio',
    description: '40-hour battery life, high-res audio certification, ambient mode, and plush memory foam ear cushions.',
    buyingPrice: 180000,
    sellingPrice: 280000,
    currentStock: 18,
    minStockLevel: 6,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Eagle Styles Store (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    sellerLocation: 'Plot 45 Kampala Road, Shop 12, Kampala',
    businessName: 'Eagle Styles Store',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-12T14:30:00Z',
    updatedAt: '2025-01-12T14:30:00Z',
  },
  {
    id: 'prod-005',
    businessId: 'biz-002',
    name: 'Fresh Organic Matooke Cluster (Grade A)',
    sku: 'GR-MT-001',
    category: 'Groceries',
    description: 'Freshly harvested large soft-cooking matooke from Masaka highlands. Sweet and tender.',
    buyingPrice: 22000,
    sellingPrice: 35000,
    currentStock: 45,
    minStockLevel: 10,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    sellerName: 'John Mukasa',
    sellerPhone: '+256 772 888 999',
    sellerLocation: 'Victoria Mall Basement, Entebbe',
    businessName: 'Victoria Fresh Groceries',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'prod-006',
    businessId: 'biz-003',
    name: 'Monocrystalline Solar Panel 350W',
    sku: 'SL-PNL-0350',
    category: 'Solar & Power',
    description: 'High efficiency tier 1 solar panel with anti-reflective tempered glass and 25-year performance warranty.',
    buyingPrice: 280000,
    sellingPrice: 395000,
    currentStock: 22,
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Kato Ronald',
    sellerPhone: '+256 791 200 151',
    sellerLocation: 'Nasser Road Commercial Complex, Kampala',
    businessName: 'Kampala Solar Hub',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-16T09:00:00Z',
  },
  {
    id: 'prod-007',
    businessId: 'biz-004',
    name: 'Handcrafted Genuine Leather Chelsea Boots',
    sku: 'AP-BT-002',
    category: 'Fashion & Footwear',
    description: 'Full-grain oiled Ugandan cowhide leather, Goodyear welted with durable rubber lug soles.',
    buyingPrice: 150000,
    sellingPrice: 240000,
    currentStock: 12,
    minStockLevel: 4,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Mary Namubiru',
    sellerPhone: '+256 782 455 677',
    sellerLocation: 'Equatorial Mall Level 2, Kampala',
    businessName: 'Apex Fashion & Apparel',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-16T13:00:00Z',
    updatedAt: '2025-01-16T13:00:00Z',
  },
  {
    id: 'prod-008',
    businessId: 'biz-005',
    name: 'Raw Unrefined Northern Shea Butter (500g)',
    sku: 'CS-SH-0500',
    category: 'Cosmetics & Beauty',
    description: 'Pure cold-pressed Nilotica shea butter harvested in Gulu. Deeply moisturizing for skin and hair.',
    buyingPrice: 18000,
    sellingPrice: 30000,
    currentStock: 35,
    minStockLevel: 10,
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Sarah Akello',
    sellerPhone: '+256 755 900 123',
    sellerLocation: 'Gulu Main Market, Gulu',
    businessName: 'Nile Organic Naturals',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-17T09:30:00Z',
    updatedAt: '2025-01-17T09:30:00Z',
  },
  {
    id: 'prod-009',
    businessId: 'biz-006',
    name: 'Mount Elgon Single-Origin Dark Roast (1kg)',
    sku: 'FD-CF-1000',
    category: 'Food & Beverage',
    description: 'High-altitude Arabica coffee with notes of dark cocoa and caramel, freshly roasted on the slopes of Mt Elgon.',
    buyingPrice: 35000,
    sellingPrice: 55000,
    currentStock: 25,
    minStockLevel: 8,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
    sellerName: 'Denis Mugisha',
    sellerPhone: '+256 701 889 900',
    sellerLocation: 'Republic Street, Mbale',
    businessName: 'Elgon Roast Artisans',
    status: 'active',
    moderationStatus: 'approved',
    createdAt: '2025-01-17T11:00:00Z',
    updatedAt: '2025-01-17T11:00:00Z',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    businessId: 'biz-001',
    name: 'Dr. Joseph Musoke',
    phone: '+256 701 112 233',
    email: 'jmusoke@gmail.com',
    address: 'Kololo Summit View, Kampala',
    notes: 'Premium VIP client for solar backup installations.',
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
  },
  {
    id: 'cust-002',
    businessId: 'biz-001',
    name: 'Florence Nakafeero',
    phone: '+256 782 334 455',
    address: 'Ntinda Commercial Center, Shop 4',
    notes: 'Wholesale electronics buyer.',
    createdAt: '2025-01-13T11:00:00Z',
    updatedAt: '2025-01-13T11:00:00Z',
  },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-001',
    businessId: 'biz-001',
    saleNumber: 'SL-2025-001',
    customerId: 'cust-001',
    customerName: 'Dr. Joseph Musoke',
    customerPhone: '+256 701 112 233',
    items: [
      {
        id: 'si-001',
        saleId: 'sale-001',
        productId: 'prod-002',
        productName: 'Pure Sine Wave Solar Inverter 2.5kVA',
        sku: 'SL-INV-2500',
        unitPrice: 1850000,
        quantity: 1,
        subtotal: 1850000,
        buyingPrice: 1400000,
      },
    ],
    subtotal: 1850000,
    discount: 50000,
    total: 1800000,
    paymentStatus: 'paid',
    paymentMethod: 'mobile_money',
    notes: 'Paid via MTN Mobile Money. Full warranty card issued.',
    createdAt: '2025-01-12T14:30:00Z',
    createdBy: 'user-002',
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'Platform Upgrade: Cloud Firestore & Community Marketplace',
    message: 'Welcome to the upgraded Eagle Business Manager powered by Google Cloud Firestore. Explore products from fellow merchants and list your own goods with direct WhatsApp buyer contact.',
    type: 'info',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    createdBy: 'user-002',
  },
];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-001',
    userId: 'user-002',
    title: 'Welcome to Cloud Firestore',
    message: 'Your Eagle Business Manager database is connected to Google Cloud Firestore with real-time replication.',
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_REPORTS: ProductReport[] = [];

const INITIAL_REVIEWS: MarketplaceReview[] = [
  {
    id: 'rev-001',
    productId: 'prod-001',
    productName: 'Smart 43" 4K UHD LED TV',
    reviewerName: 'Patrick Otim',
    reviewerPhone: '+256 772 110 099',
    rating: 5,
    comment: 'Super crisp picture quality! Delivered to Ntinda within 2 hours of WhatsApp enquiry.',
    createdAt: '2025-01-14T10:00:00Z',
  },
  {
    id: 'rev-002',
    productId: 'prod-002',
    productName: 'Pure Sine Wave Solar Inverter 2.5kVA',
    reviewerName: 'Grace Nalubega',
    reviewerPhone: '+256 701 445 566',
    rating: 5,
    comment: 'Runs our entire clinic lighting and ultrasound backup seamlessly during Umeme outages. Highly recommended.',
    createdAt: '2025-01-15T15:20:00Z',
  },
  {
    id: 'rev-003',
    productId: 'prod-008',
    productName: 'Raw Unrefined Northern Shea Butter (500g)',
    reviewerName: 'Amina Kigozi',
    reviewerPhone: '+256 782 899 001',
    rating: 5,
    comment: 'Genuine Ugandan Nilotica butter, very soft and soothing for dry skin.',
    createdAt: '2025-01-18T11:40:00Z',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-001',
    businessId: 'biz-001',
    name: 'East African Solar Supplies Ltd',
    phone: '+256 702 334 455',
    email: 'orders@easolar.co.ug',
    address: '6th Street Industrial Area, Kampala',
    contactPerson: 'Dennis Okello',
    category: 'Solar Equipment',
    notes: 'Main distributor for tier-1 solar panels and pure sine wave inverters.',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'supp-002',
    businessId: 'biz-001',
    name: 'Kampala Tech & Electronics Importers',
    phone: '+256 782 556 677',
    email: 'sales@kampalatech.ug',
    address: 'Nasser Road Commercial Plaza, Level 1',
    contactPerson: 'Anita Birungi',
    category: 'Consumer Electronics',
    notes: 'Direct importer of Android 4K LED TVs and audio accessories.',
    createdAt: '2025-01-12T11:00:00Z',
    updatedAt: '2025-01-12T11:00:00Z',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    businessId: 'biz-001',
    title: 'Plot 45 Kampala Road Showroom Rent (Monthly)',
    amount: 1200000,
    category: 'rent',
    date: '2025-01-05',
    paymentMethod: 'bank_transfer',
    notes: 'Paid via Stanbic Bank for Shop 12.',
    createdAt: '2025-01-05T12:00:00Z',
    updatedAt: '2025-01-05T12:00:00Z',
  },
  {
    id: 'exp-002',
    businessId: 'biz-001',
    title: 'Umeme Commercial Electricity Tokens',
    amount: 180000,
    category: 'utilities',
    date: '2025-01-14',
    paymentMethod: 'mobile_money',
    notes: 'Prepaid Yaka tokens for display TV lighting.',
    createdAt: '2025-01-14T09:30:00Z',
    updatedAt: '2025-01-14T09:30:00Z',
  },
  {
    id: 'exp-003',
    businessId: 'biz-001',
    title: 'Solar Inverter Cargo Transport from Mombasa',
    amount: 350000,
    category: 'transport',
    date: '2025-01-16',
    paymentMethod: 'cash',
    notes: 'Offloading and delivery logistics.',
    createdAt: '2025-01-16T14:00:00Z',
    updatedAt: '2025-01-16T14:00:00Z',
  },
];

const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quo-001',
    businessId: 'biz-001',
    quotationNumber: 'QUO-000001',
    customerId: 'cust-001',
    customerName: 'Dr. Joseph Musoke',
    customerPhone: '+256 701 112 233',
    customerAddress: 'Kololo Summit View, Kampala',
    items: [
      {
        id: 'qi-001',
        productId: 'prod-002',
        productName: 'Pure Sine Wave Solar Inverter 2.5kVA',
        sku: 'SL-INV-2500',
        unitPrice: 1850000,
        quantity: 2,
        subtotal: 3700000,
      },
      {
        id: 'qi-002',
        productId: 'prod-006',
        productName: 'Monocrystalline Solar Panel 350W',
        sku: 'SL-PNL-0350',
        unitPrice: 395000,
        quantity: 4,
        subtotal: 1580000,
      },
    ],
    subtotal: 5280000,
    discount: 180000,
    total: 5100000,
    validityDate: '2026-10-31',
    status: 'sent',
    notes: 'Includes full manufacturer warranty, heavy duty DC cables, and certified installation.',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
];

const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-001',
    businessId: 'biz-001',
    title: 'Solar Backup Site Survey — Dr. Musoke Residence',
    description: 'Assess rooftop angle and battery bank location for 2.5kVA hybrid installation.',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    allDay: false,
    type: 'appointment',
    status: 'pending',
    customerId: 'cust-001',
    customerName: 'Dr. Joseph Musoke',
    reminderMinutes: 60,
    color: '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-002',
    businessId: 'biz-001',
    title: 'Supplier Restock Delivery (East African Solar)',
    description: 'Receiving 10 units of 350W solar panels at main warehouse.',
    startDate: new Date(Date.now() + 172800000).toISOString(),
    endDate: new Date(Date.now() + 172800000 + 3600000).toISOString(),
    allDay: false,
    type: 'delivery',
    status: 'pending',
    reminderMinutes: 120,
    color: '#10b981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-003',
    businessId: 'biz-001',
    title: 'Wholesale Invoice Follow-up: Florence Nakafeero',
    description: 'Verify receipt of second batch of LED TV remotes and balance settlement.',
    startDate: new Date(Date.now() + 259200000).toISOString(),
    endDate: new Date(Date.now() + 259200000 + 1800000).toISOString(),
    allDay: false,
    type: 'payment_reminder',
    status: 'pending',
    customerId: 'cust-002',
    customerName: 'Florence Nakafeero',
    reminderMinutes: 30,
    color: '#f59e0b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_NOTES: BusinessNote[] = [
  {
    id: 'note-001',
    businessId: 'biz-001',
    title: 'Q1 Supplier Price Negotiations & Solar Battery Terms',
    content: 'Discussed 8% bulk discount with Dennis Okello at East African Solar for deep cycle gel batteries if we order 25 units upfront. Terms require 50% deposit with 30-day settlement on remaining balance.',
    category: 'supplier',
    isPinned: true,
    tags: ['solar', 'batteries', 'supplier'],
    relatedSupplierId: 'supp-001',
    createdAt: '2025-01-14T11:00:00Z',
    updatedAt: '2025-01-14T11:00:00Z',
  },
  {
    id: 'note-002',
    businessId: 'biz-001',
    title: 'Showroom Opening Procedures & Inverter Display Check',
    content: 'Ensure all 4K demonstration screens are tuned to high-definition loops by 8:30 AM. Check that the solar battery inverter backup indicator is green and test emergency cutoff switch every Monday.',
    category: 'daily',
    isPinned: true,
    tags: ['operations', 'showroom'],
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'note-003',
    businessId: 'biz-001',
    title: 'Dr. Joseph Musoke — Customer Preference Notes',
    content: 'Prefers communication via WhatsApp. Requests weekend site surveys when he is off clinic duty. Always wants official receipts printed with Eagle Styles stamp.',
    category: 'customer',
    isPinned: false,
    tags: ['vip', 'customer'],
    relatedCustomerId: 'cust-001',
    relatedCustomerName: 'Dr. Joseph Musoke',
    createdAt: '2025-01-16T10:00:00Z',
    updatedAt: '2025-01-16T10:00:00Z',
  },
];

const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-001',
    businessId: 'biz-001',
    productId: 'prod-003',
    productName: 'Rechargeable Solar Flood Light 200W',
    sku: 'SL-FLD-0200',
    previousQuantity: 9,
    adjustmentAmount: -1,
    newQuantity: 8,
    reason: 'damaged',
    notes: 'Glass panel cracked during showroom re-arrangement. Decommissioned for spare parts.',
    userName: 'Eagle Styles (Tusubira Benjamin)',
    userId: 'user-002',
    createdAt: '2025-01-13T16:00:00Z',
  },
];

const INITIAL_RECYCLE_BIN: RecycleBinItem[] = [];

// Local Storage Helper with Type Safety
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Database Service Implementation
export const dbService = {
  // Profiles & Auth
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const d = userDoc.data() as UserProfile;
          // sync local
          const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
          const idx = profiles.findIndex((p) => p.id === userId);
          if (idx >= 0) profiles[idx] = d;
          else profiles.push(d);
          setStored('profiles', profiles);
          return d;
        }
      } catch (err) {
        console.warn('Firebase getProfile fallback to local:', err);
      }
    }
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    return profiles.find((p) => p.id === userId) || null;
  },

  async getProfileByUsernameOrPhone(identifier: string): Promise<UserProfile | null> {
    const cleanId = identifier.trim().toLowerCase();
    if (isFirebaseConfigured() && db) {
      try {
        // Query users by username or email
        const qEmail = query(collection(db, 'users'), where('email', '==', cleanId));
        const emailSnap = await getDocs(qEmail);
        if (!emailSnap.empty) {
          return emailSnap.docs[0].data() as UserProfile;
        }
        const qUsername = query(collection(db, 'users'), where('username', '==', cleanId));
        const userSnap = await getDocs(qUsername);
        if (!userSnap.empty) {
          return userSnap.docs[0].data() as UserProfile;
        }
      } catch (err) {
        console.warn('Firebase getProfileByUsernameOrPhone fallback to local:', err);
      }
    }
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    return (
      profiles.find(
        (p) =>
          p.username.toLowerCase() === cleanId ||
          p.email?.toLowerCase() === cleanId ||
          (p.phone && p.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
      ) || null
    );
  },

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    profiles.push(profile);
    setStored('profiles', profiles);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'users', profile.id), profile);
      } catch (err) {
        console.warn('Firebase createProfile sync warning:', err);
      }
    }
    return profile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    const index = profiles.findIndex((p) => p.id === userId);
    if (index === -1) return null;

    profiles[index] = { ...profiles[index], ...updates, updatedAt: new Date().toISOString() };
    setStored('profiles', profiles);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateProfile sync warning:', err);
      }
    }
    return profiles[index];
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as UserProfile);
          setStored('profiles', list);
          return list;
        }
      } catch (err) {
        console.warn('Firebase getAllProfiles fallback to local:', err);
      }
    }
    return getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
  },

  // Businesses
  async getBusiness(businessId: string): Promise<Business | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'businesses', businessId));
        if (snap.exists()) {
          const d = snap.data() as Business;
          return d;
        }
      } catch (err) {
        console.warn('Firebase getBusiness fallback to local:', err);
      }
    }
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    return businesses.find((b) => b.id === businessId) || null;
  },

  async getAllBusinesses(): Promise<Business[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'businesses'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Business);
          setStored('businesses', list);
          return list;
        }
      } catch (err) {
        console.warn('Firebase getAllBusinesses fallback to local:', err);
      }
    }
    return getStored<Business[]>('businesses', INITIAL_BUSINESSES);
  },

  async createBusiness(business: Business): Promise<Business> {
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    businesses.push(business);
    setStored('businesses', businesses);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'businesses', business.id), business);
      } catch (err) {
        console.warn('Firebase createBusiness sync warning:', err);
      }
    }
    return business;
  },

  async updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business | null> {
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    const index = businesses.findIndex((b) => b.id === businessId);
    if (index === -1) return null;

    businesses[index] = { ...businesses[index], ...updates, updatedAt: new Date().toISOString() };
    setStored('businesses', businesses);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'businesses', businessId), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateBusiness sync warning:', err);
      }
    }
    return businesses[index];
  },

  // Products (Data Isolation enforced by businessId)
  async getProducts(businessId: string): Promise<Product[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'products'), where('businessId', '==', businessId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Product);
        }
      } catch (err) {
        console.warn('Firebase getProducts fallback to local:', err);
      }
    }
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    return products.filter((p) => p.businessId === businessId);
  },

  // Community Marketplace: Multi-Merchant Product Explorer & Search
  async getAllMarketplaceProducts(): Promise<Product[]> {
    let products: Product[] = [];
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          products = snap.docs.map((d) => d.data() as Product);
        }
      } catch (err) {
        console.warn('Firebase getAllMarketplaceProducts fallback to local:', err);
      }
    }

    if (products.length === 0) {
      products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    }

    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);

    return products
      .filter((p) => p.status === 'active' && (p.moderationStatus === 'approved' || !p.moderationStatus))
      .map((p) => {
        const b = businesses.find((biz) => biz.id === p.businessId);
        const owner = profiles.find((prof) => prof.businessId === p.businessId);
        return {
          ...p,
          businessName: p.businessName || b?.name || 'Local Merchant',
          sellerName: p.sellerName || owner?.fullName || owner?.username || 'Verified Seller',
          sellerPhone: p.sellerPhone || owner?.phone || b?.phone || '+256 743 566 645',
          sellerLocation: p.sellerLocation || b?.address || 'Kampala, Uganda',
          moderationStatus: p.moderationStatus || 'approved',
        };
      });
  },

  // Admin view of all products across all vendors
  async getAllProductsAdmin(): Promise<Product[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Product);
        }
      } catch (err) {
        console.warn('Firebase getAllProductsAdmin fallback to local:', err);
      }
    }
    return getStored<Product[]>('products', INITIAL_PRODUCTS);
  },

  async createProduct(product: Product): Promise<Product> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const item: Product = {
      ...product,
      moderationStatus: product.moderationStatus || 'approved',
      sellerLocation: product.sellerLocation || 'Kampala, Uganda',
    };
    products.unshift(item);
    setStored('products', products);

    // Record initial inventory movement
    await this.recordInventoryMovement({
      id: 'mov-' + Date.now(),
      businessId: item.businessId,
      productId: item.id,
      productName: item.name,
      type: 'restock',
      quantityChange: item.currentStock,
      previousStock: 0,
      newStock: item.currentStock,
      reason: 'Initial stock intake upon product creation',
      createdAt: new Date().toISOString(),
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'products', item.id), item);
      } catch (err) {
        console.warn('Firebase createProduct sync warning:', err);
      }
    }

    return item;
  },

  async updateProduct(
    id: string,
    updatesOrBizId: Partial<Product> | string,
    maybeUpdates?: Partial<Product>
  ): Promise<Product | null> {
    const updates = (typeof updatesOrBizId === 'string' ? maybeUpdates : updatesOrBizId) || {};
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
    setStored('products', products);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'products', id), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateProduct sync warning:', err);
      }
    }
    return products[index];
  },

  async deleteProduct(id: string, businessId?: string, _deletedBy?: string): Promise<boolean> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const filtered = businessId
      ? products.filter((p) => !(p.id === id && p.businessId === businessId))
      : products.filter((p) => p.id !== id);

    setStored('products', filtered);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.warn('Firebase deleteProduct sync warning:', err);
      }
    }
    return true;
  },

  // Marketplace Safety & Abuse Reports
  async reportProduct(reportOrProductId: ProductReport | string, maybeReport?: ProductReport): Promise<void> {
    const report: ProductReport = typeof reportOrProductId === 'string' ? maybeReport! : reportOrProductId;
    const reports = getStored<ProductReport[]>('reports', INITIAL_REPORTS);
    reports.unshift(report);
    setStored('reports', reports);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'reports', report.id), report);
      } catch (err) {
        console.warn('Firebase reportProduct error:', err);
      }
    }
  },

  async getReports(): Promise<ProductReport[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'reports'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as ProductReport);
        }
      } catch (err) {
        console.warn('Firebase getReports fallback to local:', err);
      }
    }
    return getStored<ProductReport[]>('reports', INITIAL_REPORTS);
  },

  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'resolved' | 'dismissed',
    actionTaken?: string,
    resolvedBy?: string
  ): Promise<void> {
    const reports = getStored<ProductReport[]>('reports', INITIAL_REPORTS);
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx !== -1) {
      reports[idx] = {
        ...reports[idx],
        status,
        actionTaken,
        resolvedBy,
        resolvedAt: new Date().toISOString(),
      };
      setStored('reports', reports);
    }

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          status,
          actionTaken: actionTaken || '',
          resolvedBy: resolvedBy || 'admin',
          resolvedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateReportStatus error:', err);
      }
    }
  },

  // Notifications
  async getNotifications(userId: string): Promise<InAppNotification[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', 'in', [userId, 'all'])
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as InAppNotification);
        }
      } catch (err) {
        console.warn('Firebase getNotifications fallback to local:', err);
      }
    }
    const notifs = getStored<InAppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => n.userId === userId || n.userId === 'all');
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const notifs = getStored<InAppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      setStored('notifications', notifs);
    }
    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (err) {
        console.warn('Firebase markNotificationAsRead error:', err);
      }
    }
  },

  async createNotification(notif: InAppNotification): Promise<void> {
    const notifs = getStored<InAppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    notifs.unshift(notif);
    setStored('notifications', notifs);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      } catch (err) {
        console.warn('Firebase createNotification error:', err);
      }
    }
  },

  // Inventory Movements
  async recordInventoryMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    const movements = getStored<InventoryMovement[]>('inventory_movements', []);
    movements.unshift(movement);
    setStored('inventory_movements', movements);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'inventory_movements', movement.id), movement);
      } catch (err) {
        console.warn('Firebase recordInventoryMovement error:', err);
      }
    }
    return movement;
  },

  async getInventoryMovements(businessId: string, productId?: string): Promise<InventoryMovement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = productId
          ? query(
              collection(db, 'inventory_movements'),
              where('businessId', '==', businessId),
              where('productId', '==', productId)
            )
          : query(
              collection(db, 'inventory_movements'),
              where('businessId', '==', businessId)
            );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as InventoryMovement);
        }
      } catch (err) {
        console.warn('Firebase getInventoryMovements fallback:', err);
      }
    }
    const movements = getStored<InventoryMovement[]>('inventory_movements', []);
    return movements.filter(
      (m) => m.businessId === businessId && (!productId || m.productId === productId)
    );
  },

  // Customers
  async getCustomers(businessId: string): Promise<Customer[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'customers'), where('businessId', '==', businessId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Customer);
        }
      } catch (err) {
        console.warn('Firebase getCustomers fallback:', err);
      }
    }
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    return customers.filter((c) => c.businessId === businessId);
  },

  async createCustomer(customer: Customer): Promise<Customer> {
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    customers.unshift(customer);
    setStored('customers', customers);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'customers', customer.id), customer);
      } catch (err) {
        console.warn('Firebase createCustomer error:', err);
      }
    }
    return customer;
  },

  async updateCustomer(
    id: string,
    updatesOrBizId: Partial<Customer> | string,
    maybeUpdates?: Partial<Customer>
  ): Promise<Customer | null> {
    const updates = (typeof updatesOrBizId === 'string' ? maybeUpdates : updatesOrBizId) || {};
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    customers[index] = { ...customers[index], ...updates, updatedAt: new Date().toISOString() };
    setStored('customers', customers);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'customers', id), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateCustomer error:', err);
      }
    }
    return customers[index];
  },

  async deleteCustomer(id: string, businessId: string, _deletedBy?: string): Promise<boolean> {
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    const filtered = customers.filter((c) => !(c.id === id && c.businessId === businessId));
    setStored('customers', filtered);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (err) {
        console.warn('Firebase deleteCustomer error:', err);
      }
    }
    return true;
  },

  // Sales
  async getSales(businessId: string): Promise<Sale[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'sales'), where('businessId', '==', businessId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Sale);
        }
      } catch (err) {
        console.warn('Firebase getSales fallback:', err);
      }
    }
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    return sales.filter((s) => s.businessId === businessId);
  },

  async getAllSalesAdmin(): Promise<Sale[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'sales'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Sale);
        }
      } catch (err) {
        console.warn('Firebase getAllSalesAdmin fallback:', err);
      }
    }
    return getStored<Sale[]>('sales', INITIAL_SALES);
  },

  async createSale(sale: Sale): Promise<Sale> {
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    sales.unshift(sale);
    setStored('sales', sales);

    // Decrement stock and record movements
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    for (const item of sale.items) {
      const pIndex = products.findIndex(
        (p) => p.id === item.productId && p.businessId === sale.businessId
      );
      if (pIndex !== -1) {
        const prevStock = products[pIndex].currentStock;
        const newStock = Math.max(0, prevStock - item.quantity);
        products[pIndex].currentStock = newStock;
        products[pIndex].updatedAt = new Date().toISOString();

        await this.recordInventoryMovement({
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          businessId: sale.businessId,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `Sale ${sale.saleNumber}`,
          createdAt: new Date().toISOString(),
          createdBy: sale.createdBy,
        });

        if (isFirebaseConfigured() && db) {
          try {
            await updateDoc(doc(db, 'products', item.productId), {
              currentStock: newStock,
              updatedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Product stock sync error:', e);
          }
        }
      }
    }
    setStored('products', products);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'sales', sale.id), sale);
      } catch (err) {
        console.warn('Firebase createSale error:', err);
      }
    }
    return sale;
  },

  async updateSalePaymentStatus(
    saleId: string,
    paymentStatus: PaymentStatus,
    amountPaid?: number
  ): Promise<void> {
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    const idx = sales.findIndex((s) => s.id === saleId);
    if (idx !== -1) {
      sales[idx] = {
        ...sales[idx],
        paymentStatus,
        amountPaid: amountPaid !== undefined ? amountPaid : sales[idx].amountPaid,
      };
      setStored('sales', sales);
    }
    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'sales', saleId), {
          paymentStatus,
          ...(amountPaid !== undefined ? { amountPaid } : {}),
        });
      } catch (err) {
        console.warn('Firebase updateSalePaymentStatus error:', err);
      }
    }
  },

  async recordSalePayment(
    saleId: string,
    payment: {
      amount: number;
      paymentMethod: PaymentMethod | string;
      notes?: string;
      receivedBy?: string;
    }
  ): Promise<Sale | null> {
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    const idx = sales.findIndex((s) => s.id === saleId);
    if (idx === -1) return null;

    const currentSale = sales[idx];
    const previousPaid = currentSale.amountPaid || 0;
    const newAmountPaid = previousPaid + payment.amount;
    const isFullyPaid = newAmountPaid >= currentSale.total;
    const newStatus: PaymentStatus = isFullyPaid ? 'paid' : 'partial';

    const newPaymentRecord: SalePaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod as any,
      date: new Date().toISOString(),
      notes: payment.notes,
      receivedBy: payment.receivedBy,
    };

    const updatedSale: Sale = {
      ...currentSale,
      paymentStatus: newStatus,
      amountPaid: newAmountPaid,
      paymentRecords: [...(currentSale.paymentRecords || []), newPaymentRecord],
    };

    sales[idx] = updatedSale;
    setStored('sales', sales);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'sales', saleId), {
          paymentStatus: newStatus,
          amountPaid: newAmountPaid,
          paymentRecords: updatedSale.paymentRecords,
        });
      } catch (err) {
        console.warn('Firebase recordSalePayment error:', err);
      }
    }

    return updatedSale;
  },

  // Invoices
  async getInvoices(businessId: string): Promise<Invoice[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'invoices'), where('businessId', '==', businessId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Invoice);
        }
      } catch (err) {
        console.warn('Firebase getInvoices fallback:', err);
      }
    }
    const invoices = getStored<Invoice[]>('invoices', []);
    return invoices.filter((inv) => inv.businessId === businessId);
  },

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    const invoices = getStored<Invoice[]>('invoices', []);
    invoices.unshift(invoice);
    setStored('invoices', invoices);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'invoices', invoice.id), invoice);
      } catch (err) {
        console.warn('Firebase createInvoice error:', err);
      }
    }
    return invoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const invoices = getStored<Invoice[]>('invoices', []);
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return null;

    invoices[index] = { ...invoices[index], ...updates, updatedAt: new Date().toISOString() };
    setStored('invoices', invoices);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'invoices', id), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateInvoice error:', err);
      }
    }
    return invoices[index];
  },

  async deleteInvoice(id: string, businessId: string): Promise<boolean> {
    const invoices = getStored<Invoice[]>('invoices', []);
    const filtered = invoices.filter((inv) => !(inv.id === id && inv.businessId === businessId));
    setStored('invoices', filtered);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
      } catch (err) {
        console.warn('Firebase deleteInvoice error:', err);
      }
    }
    return true;
  },

  // Announcements
  async getActiveAnnouncements(): Promise<Announcement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Announcement);
          return list.filter((a) => a.isActive);
        }
      } catch (err) {
        console.warn('Firebase getActiveAnnouncements fallback:', err);
      }
    }
    const announcements = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    return announcements.filter((a) => a.isActive);
  },

  async getAllAnnouncements(_callerRole?: string): Promise<Announcement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Announcement);
        }
      } catch (err) {
        console.warn('Firebase getAllAnnouncements fallback:', err);
      }
    }
    return getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  },

  async createAnnouncement(announcement: Announcement, _callerEmail?: string): Promise<Announcement> {
    const list = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    list.unshift(announcement);
    setStored('announcements', list);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'announcements', announcement.id), announcement);
      } catch (err) {
        console.warn('Firebase createAnnouncement error:', err);
      }
    }
    return announcement;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const list = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates };
    setStored('announcements', list);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'announcements', id), updates);
      } catch (err) {
        console.warn('Firebase updateAnnouncement error:', err);
      }
    }
    return list[index];
  },

  async toggleAnnouncementActive(id: string, isActive?: boolean): Promise<boolean> {
    const list = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return false;
    const newActive = isActive !== undefined ? isActive : !list[index].isActive;
    list[index].isActive = newActive;
    setStored('announcements', list);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'announcements', id), { isActive: newActive });
      } catch (err) {
        console.warn('Firebase toggleAnnouncementActive error:', err);
      }
    }
    return true;
  },

  async deleteAnnouncement(id: string, _deletedBy?: string): Promise<boolean> {
    const list = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    setStored('announcements', list.filter((a) => a.id !== id));

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (err) {
        console.warn('Firebase deleteAnnouncement error:', err);
      }
    }
    return true;
  },

  // Audit Logs (Never storing passwords)
  async addAuditLog(log: AuditLog): Promise<void> {
    const logs = getStored<AuditLog[]>('audit_logs', []);
    logs.unshift(log);
    setStored('audit_logs', logs.slice(0, 100));

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'auditLogs', log.id), log);
      } catch (err) {
        console.warn('Firebase addAuditLog error:', err);
      }
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'auditLogs'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as AuditLog);
        }
      } catch (err) {
        console.warn('Firebase getAuditLogs fallback:', err);
      }
    }
    return getStored<AuditLog[]>('audit_logs', []);
  },

  // Platform Analytics & Statistics
  async getPlatformStats(): Promise<PlatformStats> {
    const [profiles, businesses, products, sales, reports, logs] = await Promise.all([
      this.getAllProfiles(),
      this.getAllBusinesses(),
      this.getAllProductsAdmin(),
      this.getAllSalesAdmin(),
      this.getReports(),
      this.getAuditLogs(),
    ]);

    const activeUsers = profiles.filter((p) => p.status === 'active').length;
    const suspendedUsers = profiles.filter((p) => p.status === 'suspended').length;
    const totalSalesAmount = sales.reduce((acc, s) => acc + s.total, 0);

    const pendingProducts = products.filter((p) => p.moderationStatus === 'pending').length;
    const approvedProducts = products.filter(
      (p) => p.moderationStatus === 'approved' || !p.moderationStatus
    ).length;
    const rejectedProducts = products.filter((p) => p.moderationStatus === 'rejected').length;

    return {
      totalUsers: profiles.length,
      activeUsers,
      suspendedUsers,
      totalBusinesses: businesses.length,
      totalProducts: products.length,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      totalReports: reports.filter((r) => r.status === 'pending').length,
      totalSales: totalSalesAmount,
      totalTransactions: sales.length,
      recentRegistrations: profiles.slice(0, 5),
      recentActivity: logs.slice(0, 10),
    };
  },

  // Platform and Admin Aliases & Helpers
  async getAllUsers(): Promise<UserProfile[]> {
    return this.getAllProfiles();
  },

  async getAllProductsPlatform(): Promise<Product[]> {
    return this.getAllProductsAdmin();
  },

  async getAllSalesPlatform(): Promise<Sale[]> {
    return this.getAllSalesAdmin();
  },

  async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended',
    adminId?: string,
    _adminName?: string
  ): Promise<UserProfile | null> {
    const updated = await this.updateProfile(userId, { status });
    if (adminId) {
      await this.addAuditLog({
        id: 'log-' + Date.now(),
        adminId,
        action: 'UPDATE_USER_STATUS',
        targetType: 'user',
        targetId: userId,
        timestamp: new Date().toISOString(),
        details: { status },
      });
    }
    return updated;
  },

  async resetUserPassword(
    userId: string,
    newPassword: string,
    adminId?: string,
    _adminName?: string
  ): Promise<UserProfile | null> {
    const updated = await this.updateProfile(userId, { password: newPassword });
    if (adminId) {
      await this.addAuditLog({
        id: 'log-' + Date.now(),
        adminId,
        action: 'RESET_USER_PASSWORD',
        targetType: 'user',
        targetId: userId,
        timestamp: new Date().toISOString(),
        details: { reset: true },
      });
    }
    return updated;
  },

  async updateBusinessStatus(
    businessId: string,
    status: 'active' | 'suspended',
    adminId?: string,
    _adminName?: string
  ): Promise<Business | null> {
    const updated = await this.updateBusiness(businessId, { status });
    if (adminId) {
      await this.addAuditLog({
        id: 'log-' + Date.now(),
        adminId,
        action: 'UPDATE_BUSINESS_STATUS',
        targetType: 'business',
        targetId: businessId,
        timestamp: new Date().toISOString(),
        details: { status },
      });
    }
    return updated;
  },

  async updateInvoiceStatus(
    id: string,
    paymentStatus: any,
    _userId?: string
  ): Promise<Invoice | null> {
    return this.updateInvoice(id, { paymentStatus });
  },

  async updateSaleStatus(
    id: string,
    paymentStatus: PaymentStatus,
    _userId?: string
  ): Promise<Sale | null> {
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    const idx = sales.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    sales[idx].paymentStatus = paymentStatus;
    setStored('sales', sales);
    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'sales', id), { paymentStatus });
      } catch (e) {
        console.warn('Firebase updateSaleStatus error:', e);
      }
    }
    return sales[idx];
  },

  async adjustStock(
    businessId: string,
    productId: string,
    newStock: number,
    reason?: string,
    createdBy?: string
  ): Promise<Product | null> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === productId && p.businessId === businessId);
    if (idx === -1) return null;
    const prevStock = products[idx].currentStock;
    products[idx].currentStock = newStock;
    products[idx].updatedAt = new Date().toISOString();
    setStored('products', products);

    await this.recordInventoryMovement({
      id: 'mov-' + Date.now(),
      businessId,
      productId,
      productName: products[idx].name,
      type: 'adjustment',
      quantityChange: newStock - prevStock,
      previousStock: prevStock,
      newStock,
      reason: reason || 'Manual stock adjustment',
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'user',
    });

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          currentStock: newStock,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firebase adjustStock sync error:', e);
      }
    }
    return products[idx];
  },

  // Marketplace Reviews
  async getReviews(productId: string): Promise<MarketplaceReview[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', productId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as MarketplaceReview);
        }
      } catch (err) {
        console.warn('Firebase getReviews fallback:', err);
      }
    }
    const reviews = getStored<MarketplaceReview[]>('marketplace_reviews', INITIAL_REVIEWS);
    return reviews.filter((r) => r.productId === productId);
  },

  async addReview(review: MarketplaceReview): Promise<MarketplaceReview> {
    const reviews = getStored<MarketplaceReview[]>('marketplace_reviews', INITIAL_REVIEWS);
    reviews.unshift(review);
    setStored('marketplace_reviews', reviews);

    // Update product rating summary
    const prodReviews = reviews.filter((r) => r.productId === review.productId);
    const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;

    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const pIdx = products.findIndex((p) => p.id === review.productId);
    if (pIdx !== -1) {
      products[pIdx].rating = Number(avgRating.toFixed(1));
      products[pIdx].reviewCount = prodReviews.length;
      setStored('products', products);

      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'products', review.productId), {
            rating: Number(avgRating.toFixed(1)),
            reviewCount: prodReviews.length,
          });
        } catch (e) {
          console.warn('Product rating update error:', e);
        }
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'reviews', review.id), review);
      } catch (err) {
        console.warn('Firebase addReview error:', err);
      }
    }
    return review;
  },

  // Marketplace Favourites
  async getFavourites(userId?: string): Promise<string[]> {
    const key = userId ? `favourites_${userId}` : 'favourites_guest';
    return getStored<string[]>(key, []);
  },

  async toggleFavourite(productId: string, userId?: string): Promise<boolean> {
    const key = userId ? `favourites_${userId}` : 'favourites_guest';
    const favs = getStored<string[]>(key, []);
    const exists = favs.includes(productId);
    let updated: string[];
    if (exists) {
      updated = favs.filter((id) => id !== productId);
    } else {
      updated = [...favs, productId];
    }
    setStored(key, updated);
    return !exists;
  },

  // Marketplace Analytics (Views and WhatsApp/Call Enquiries)
  async trackMarketplaceAction(productId: string, action: 'view' | 'enquiry'): Promise<void> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return;

    if (action === 'view') {
      products[idx].marketplaceViews = (products[idx].marketplaceViews || 0) + 1;
    } else {
      products[idx].marketplaceEnquiries = (products[idx].marketplaceEnquiries || 0) + 1;
    }
    setStored('products', products);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          marketplaceViews: products[idx].marketplaceViews || 0,
          marketplaceEnquiries: products[idx].marketplaceEnquiries || 0,
        });
      } catch (err) {
        // Silent analytics sync
      }
    }
  },

  // Merchant toggle marketplace publishing
  async toggleMarketplacePublish(productId: string, isPublished: boolean): Promise<Product | null> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return null;

    products[idx].isMarketplacePublished = isPublished;
    products[idx].updatedAt = new Date().toISOString();
    setStored('products', products);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          isMarketplacePublished: isPublished,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase toggleMarketplacePublish error:', err);
      }
    }
    return products[idx];
  },

  // Admin Listing Moderation
  async updateProductModeration(
    productId: string,
    moderationStatus: ModerationStatus,
    reason?: string,
    adminId?: string
  ): Promise<Product | null> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return null;

    products[idx].moderationStatus = moderationStatus;
    if (reason) products[idx].moderationReason = reason;
    products[idx].moderatedBy = adminId || 'admin';
    products[idx].moderatedAt = new Date().toISOString();
    products[idx].updatedAt = new Date().toISOString();
    setStored('products', products);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          moderationStatus,
          moderationReason: reason || '',
          moderatedBy: adminId || 'admin',
          moderatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase updateProductModeration error:', err);
      }
    }

    if (adminId) {
      await this.addAuditLog({
        id: 'log-' + Date.now(),
        adminId,
        action: `PRODUCT_MODERATION_${moderationStatus.toUpperCase()}`,
        targetType: 'product',
        targetId: productId,
        targetName: products[idx].name,
        timestamp: new Date().toISOString(),
        details: { moderationStatus, reason },
      });
    }

    return products[idx];
  },

  // Barcode / SKU Product Lookup
  async getProductByBarcode(code: string, businessId?: string): Promise<Product | null> {
    const cleanCode = code.trim().toLowerCase();
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const found = products.find((p) => {
      const matchBiz = !businessId || p.businessId === businessId;
      const matchBarcode = p.barcode && p.barcode.toLowerCase() === cleanCode;
      const matchSku = p.sku && p.sku.toLowerCase() === cleanCode;
      const matchId = p.id.toLowerCase() === cleanCode;
      return matchBiz && (matchBarcode || matchSku || matchId);
    });
    return found || null;
  },

  async lookupProductByBarcodeOrSku(businessId: string, code: string): Promise<Product | null> {
    return this.getProductByBarcode(code, businessId);
  },

  // ==========================================
  // 1. SUPPLIERS MODULE
  // ==========================================
  async getSuppliers(businessId: string): Promise<Supplier[]> {
    const list = getStored<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    return list.filter((s) => s.businessId === businessId);
  },

  async createSupplier(supplier: Supplier): Promise<Supplier> {
    const list = getStored<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    list.unshift(supplier);
    setStored('suppliers', list);

    offlineSync.enqueue({
      collection: 'suppliers',
      action: 'create',
      data: supplier as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'suppliers', supplier.id), supplier);
      } catch (e) {
        console.warn('Firebase createSupplier fallback to local:', e);
      }
    }
    return supplier;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
    const list = getStored<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    setStored('suppliers', list);

    offlineSync.enqueue({
      collection: 'suppliers',
      action: 'update',
      data: list[idx] as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'suppliers', id), updates);
      } catch (e) {
        console.warn('Firebase updateSupplier fallback:', e);
      }
    }
    return list[idx];
  },

  async deleteSupplier(id: string, deletedBy: { id: string; name: string }): Promise<boolean> {
    const list = getStored<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    const item = list.find((s) => s.id === id);
    if (!item) return false;

    // Move to recycle bin
    await this.moveToRecycleBin({
      businessId: item.businessId,
      itemType: 'supplier',
      originalId: item.id,
      itemName: item.name,
      itemData: item as unknown as Record<string, unknown>,
      deletedBy: deletedBy.id,
      deletedByName: deletedBy.name,
    });

    const filtered = list.filter((s) => s.id !== id);
    setStored('suppliers', filtered);

    offlineSync.enqueue({
      collection: 'suppliers',
      action: 'delete',
      data: { id },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
      } catch (e) {
        console.warn('Firebase deleteSupplier fallback:', e);
      }
    }
    return true;
  },

  // ==========================================
  // 2. EXPENSES MODULE
  // ==========================================
  async getExpenses(businessId: string): Promise<Expense[]> {
    const list = getStored<Expense[]>('expenses', INITIAL_EXPENSES);
    return list.filter((e) => e.businessId === businessId);
  },

  async createExpense(expense: Expense): Promise<Expense> {
    const list = getStored<Expense[]>('expenses', INITIAL_EXPENSES);
    list.unshift(expense);
    setStored('expenses', list);

    offlineSync.enqueue({
      collection: 'expenses',
      action: 'create',
      data: expense as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'expenses', expense.id), expense);
      } catch (e) {
        console.warn('Firebase createExpense fallback:', e);
      }
    }
    return expense;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const list = getStored<Expense[]>('expenses', INITIAL_EXPENSES);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    setStored('expenses', list);

    offlineSync.enqueue({
      collection: 'expenses',
      action: 'update',
      data: list[idx] as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'expenses', id), updates);
      } catch (e) {
        console.warn('Firebase updateExpense fallback:', e);
      }
    }
    return list[idx];
  },

  async deleteExpense(id: string, deletedBy: { id: string; name: string }): Promise<boolean> {
    const list = getStored<Expense[]>('expenses', INITIAL_EXPENSES);
    const item = list.find((e) => e.id === id);
    if (!item) return false;

    await this.moveToRecycleBin({
      businessId: item.businessId,
      itemType: 'expense',
      originalId: item.id,
      itemName: item.title,
      itemData: item as unknown as Record<string, unknown>,
      deletedBy: deletedBy.id,
      deletedByName: deletedBy.name,
    });

    const filtered = list.filter((e) => e.id !== id);
    setStored('expenses', filtered);

    offlineSync.enqueue({
      collection: 'expenses',
      action: 'delete',
      data: { id },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (e) {
        console.warn('Firebase deleteExpense fallback:', e);
      }
    }
    return true;
  },

  // Reconciliation records
  async getReconciliations(businessId: string): Promise<FinanceReconciliationRecord[]> {
    const list = getStored<FinanceReconciliationRecord[]>('finance_reconciliations', []);
    return list.filter((r) => r.businessId === businessId);
  },

  async createReconciliation(rec: FinanceReconciliationRecord): Promise<FinanceReconciliationRecord> {
    const list = getStored<FinanceReconciliationRecord[]>('finance_reconciliations', []);
    list.unshift(rec);
    setStored('finance_reconciliations', list);

    offlineSync.enqueue({
      collection: 'finance_reconciliations',
      action: 'create',
      data: rec as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'finance_reconciliations', rec.id), rec);
      } catch (e) {
        console.warn('Firebase createReconciliation fallback:', e);
      }
    }
    return rec;
  },

  // ==========================================
  // 3. QUOTATIONS MODULE
  // ==========================================
  async getQuotations(businessId: string): Promise<Quotation[]> {
    const list = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
    return list.filter((q) => q.businessId === businessId);
  },

  async createQuotation(quotation: Quotation): Promise<Quotation> {
    const list = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
    list.unshift(quotation);
    setStored('quotations', list);

    offlineSync.enqueue({
      collection: 'quotations',
      action: 'create',
      data: quotation as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'quotations', quotation.id), quotation);
      } catch (e) {
        console.warn('Firebase createQuotation fallback:', e);
      }
    }
    return quotation;
  },

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation | null> {
    const list = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
    const idx = list.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    setStored('quotations', list);

    offlineSync.enqueue({
      collection: 'quotations',
      action: 'update',
      data: list[idx] as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'quotations', id), updates);
      } catch (e) {
        console.warn('Firebase updateQuotation fallback:', e);
      }
    }
    return list[idx];
  },

  async deleteQuotation(id: string, deletedBy: { id: string; name: string }): Promise<boolean> {
    const list = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
    const item = list.find((q) => q.id === id);
    if (!item) return false;

    await this.moveToRecycleBin({
      businessId: item.businessId,
      itemType: 'quotation',
      originalId: item.id,
      itemName: `${item.quotationNumber} - ${item.customerName}`,
      itemData: item as unknown as Record<string, unknown>,
      deletedBy: deletedBy.id,
      deletedByName: deletedBy.name,
    });

    const filtered = list.filter((q) => q.id !== id);
    setStored('quotations', filtered);

    offlineSync.enqueue({
      collection: 'quotations',
      action: 'delete',
      data: { id },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'quotations', id));
      } catch (e) {
        console.warn('Firebase deleteQuotation fallback:', e);
      }
    }
    return true;
  },

  async convertQuotationToInvoice(quotationId: string, userId: string): Promise<Invoice> {
    const quotations = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const nextInvoiceNumber = await this.getNextDocumentNumber(quotation.businessId, 'invoice');
    const invoiceId = `inv-${Date.now()}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      businessId: quotation.businessId,
      invoiceNumber: nextInvoiceNumber,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      customerAddress: quotation.customerAddress,
      items: quotation.items,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      total: quotation.total,
      paymentStatus: 'pending',
      status: 'pending',
      dueDate: quotation.validityDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Converted from Quotation ${quotation.quotationNumber}. ${quotation.notes || ''}`,
    };

    // Save invoice
    await this.createInvoice(newInvoice);

    // Update quotation status
    await this.updateQuotation(quotationId, {
      status: 'invoiced',
      convertedInvoiceId: invoiceId,
    });

    return newInvoice;
  },

  // ==========================================
  // 4. BUSINESS CALENDAR MODULE
  // ==========================================
  async getCalendarEvents(businessId: string): Promise<CalendarEvent[]> {
    const list = getStored<CalendarEvent[]>('calendar_events', INITIAL_CALENDAR_EVENTS);
    return list.filter((e) => e.businessId === businessId);
  },

  async createCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const list = getStored<CalendarEvent[]>('calendar_events', INITIAL_CALENDAR_EVENTS);
    list.unshift(event);
    setStored('calendar_events', list);

    offlineSync.enqueue({
      collection: 'calendar_events',
      action: 'create',
      data: event as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'calendar_events', event.id), event);
      } catch (e) {
        console.warn('Firebase createCalendarEvent fallback:', e);
      }
    }
    return event;
  },

  async updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const list = getStored<CalendarEvent[]>('calendar_events', INITIAL_CALENDAR_EVENTS);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    setStored('calendar_events', list);

    offlineSync.enqueue({
      collection: 'calendar_events',
      action: 'update',
      data: list[idx] as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'calendar_events', id), updates);
      } catch (e) {
        console.warn('Firebase updateCalendarEvent fallback:', e);
      }
    }
    return list[idx];
  },

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const list = getStored<CalendarEvent[]>('calendar_events', INITIAL_CALENDAR_EVENTS);
    const filtered = list.filter((e) => e.id !== id);
    setStored('calendar_events', filtered);

    offlineSync.enqueue({
      collection: 'calendar_events',
      action: 'delete',
      data: { id },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'calendar_events', id));
      } catch (e) {
        console.warn('Firebase deleteCalendarEvent fallback:', e);
      }
    }
    return true;
  },

  // ==========================================
  // 5. NOTES & BUSINESS JOURNAL MODULE
  // ==========================================
  async getNotes(businessId: string): Promise<BusinessNote[]> {
    const list = getStored<BusinessNote[]>('notes', INITIAL_NOTES);
    return list.filter((n) => n.businessId === businessId);
  },

  async createNote(note: BusinessNote): Promise<BusinessNote> {
    const list = getStored<BusinessNote[]>('notes', INITIAL_NOTES);
    list.unshift(note);
    setStored('notes', list);

    offlineSync.enqueue({
      collection: 'notes',
      action: 'create',
      data: note as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'notes', note.id), note);
      } catch (e) {
        console.warn('Firebase createNote fallback:', e);
      }
    }
    return note;
  },

  async updateNote(id: string, updates: Partial<BusinessNote>): Promise<BusinessNote | null> {
    const list = getStored<BusinessNote[]>('notes', INITIAL_NOTES);
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    setStored('notes', list);

    offlineSync.enqueue({
      collection: 'notes',
      action: 'update',
      data: list[idx] as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'notes', id), updates);
      } catch (e) {
        console.warn('Firebase updateNote fallback:', e);
      }
    }
    return list[idx];
  },

  async deleteNote(id: string, deletedBy: { id: string; name: string }): Promise<boolean> {
    const list = getStored<BusinessNote[]>('notes', INITIAL_NOTES);
    const item = list.find((n) => n.id === id);
    if (!item) return false;

    await this.moveToRecycleBin({
      businessId: item.businessId,
      itemType: 'note',
      originalId: item.id,
      itemName: item.title,
      itemData: item as unknown as Record<string, unknown>,
      deletedBy: deletedBy.id,
      deletedByName: deletedBy.name,
    });

    const filtered = list.filter((n) => n.id !== id);
    setStored('notes', filtered);

    offlineSync.enqueue({
      collection: 'notes',
      action: 'delete',
      data: { id },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (e) {
        console.warn('Firebase deleteNote fallback:', e);
      }
    }
    return true;
  },

  // ==========================================
  // 6. STOCK ADJUSTMENTS MODULE
  // ==========================================
  async getStockAdjustments(businessId: string): Promise<StockAdjustment[]> {
    const list = getStored<StockAdjustment[]>('stock_adjustments', INITIAL_STOCK_ADJUSTMENTS);
    return list.filter((a) => a.businessId === businessId);
  },

  async recordStockAdjustment(
    adjustmentData: Omit<StockAdjustment, 'id' | 'createdAt'>
  ): Promise<StockAdjustment> {
    const id = `adj-${Date.now()}`;
    const adjustment: StockAdjustment = {
      ...adjustmentData,
      id,
      createdAt: new Date().toISOString(),
    };

    // Save adjustment log
    const adjustments = getStored<StockAdjustment[]>('stock_adjustments', INITIAL_STOCK_ADJUSTMENTS);
    adjustments.unshift(adjustment);
    setStored('stock_adjustments', adjustments);

    // Update the product's currentStock
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const pIdx = products.findIndex((p) => p.id === adjustment.productId);
    if (pIdx !== -1) {
      products[pIdx].currentStock = adjustment.newQuantity;
      products[pIdx].updatedAt = new Date().toISOString();
      setStored('products', products);

      // Record inventory movement
      await this.recordMovement({
        id: `mov-${Date.now()}`,
        businessId: adjustment.businessId,
        productId: adjustment.productId,
        productName: adjustment.productName,
        type: 'adjustment',
        quantityChange: adjustment.adjustmentAmount,
        previousStock: adjustment.previousQuantity,
        newStock: adjustment.newQuantity,
        reason: `Stock Adjustment (${adjustment.reason}): ${adjustment.notes || 'Manual correction'}`,
        createdAt: new Date().toISOString(),
        createdBy: adjustment.userId,
      });

      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'products', adjustment.productId), {
            currentStock: adjustment.newQuantity,
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Firebase product stock sync warning:', e);
        }
      }
    }

    offlineSync.enqueue({
      collection: 'stock_adjustments',
      action: 'create',
      data: adjustment as unknown as Record<string, unknown>,
    });

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'stock_adjustments', id), adjustment);
      } catch (e) {
        console.warn('Firebase stock adjustment fallback:', e);
      }
    }

    return adjustment;
  },

  // ==========================================
  // 7. AUTOMATIC DOCUMENT NUMBERING
  // ==========================================
  async getNextDocumentNumber(
    businessId: string,
    type: 'invoice' | 'receipt' | 'quotation' | 'estimate' | 'purchase_order' | 'delivery_note'
  ): Promise<string> {
    const config = await this.getReceiptConfig(businessId);
    const prefixes = config.prefixes || {
      invoicePrefix: 'INV-',
      receiptPrefix: 'REC-',
      quotationPrefix: 'QUO-',
      estimatePrefix: 'EST-',
      purchaseOrderPrefix: 'PO-',
      deliveryNotePrefix: 'DN-',
    };

    let prefix = 'DOC-';
    let currentMaxNumber = 0;

    if (type === 'invoice') {
      prefix = prefixes.invoicePrefix || 'INV-';
      const invoices = getStored<Invoice[]>('invoices', []);
      invoices.forEach((inv) => {
        if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)) {
          const num = parseInt(inv.invoiceNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > currentMaxNumber) currentMaxNumber = num;
        }
      });
    } else if (type === 'receipt') {
      prefix = prefixes.receiptPrefix || 'REC-';
      const sales = getStored<Sale[]>('sales', INITIAL_SALES);
      sales.forEach((s) => {
        if (s.saleNumber && s.saleNumber.startsWith(prefix)) {
          const num = parseInt(s.saleNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > currentMaxNumber) currentMaxNumber = num;
        }
      });
    } else if (type === 'quotation') {
      prefix = prefixes.quotationPrefix || 'QUO-';
      const quotations = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
      quotations.forEach((q) => {
        if (q.quotationNumber && q.quotationNumber.startsWith(prefix)) {
          const num = parseInt(q.quotationNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > currentMaxNumber) currentMaxNumber = num;
        }
      });
    } else if (type === 'estimate') {
      prefix = prefixes.estimatePrefix || 'EST-';
    } else if (type === 'purchase_order') {
      prefix = prefixes.purchaseOrderPrefix || 'PO-';
    } else if (type === 'delivery_note') {
      prefix = prefixes.deliveryNotePrefix || 'DN-';
    }

    const nextNumber = currentMaxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  },

  // ==========================================
  // 8. RECEIPT CUSTOMIZATION & CONFIG
  // ==========================================
  async getReceiptConfig(businessId: string): Promise<ReceiptCustomizationConfig> {
    const key = `receipt_config_${businessId}`;
    const biz = (await this.getBusiness(businessId)) || INITIAL_BUSINESSES[0];
    const fallback: ReceiptCustomizationConfig = {
      businessName: biz?.name || 'Eagle Styles Store',
      logoUrl: biz?.logoUrl || '',
      phone: biz?.phone || '+256 743 566 645',
      whatsapp: '+256743566645',
      address: biz?.address || 'Plot 45 Kampala Road, Shop 12, Kampala',
      email: 'eaglebusinessmanager@gmail.com',
      receiptFooter: biz?.receiptFooter || 'Goods once sold are not returnable without an official receipt.',
      thankYouMessage: 'Thank you for choosing us! Powered by Eagle Business Manager.',
      currency: biz?.currency || 'UGX',
      layout: 'standard',
      prefixes: {
        invoicePrefix: 'INV-',
        receiptPrefix: 'REC-',
        quotationPrefix: 'QUO-',
        estimatePrefix: 'EST-',
        purchaseOrderPrefix: 'PO-',
        deliveryNotePrefix: 'DN-',
      },
    };
    return getStored<ReceiptCustomizationConfig>(key, fallback);
  },

  async saveReceiptConfig(
    businessId: string,
    updates: Partial<ReceiptCustomizationConfig>
  ): Promise<ReceiptCustomizationConfig> {
    const current = await this.getReceiptConfig(businessId);
    const updated: ReceiptCustomizationConfig = {
      ...current,
      ...updates,
      prefixes: {
        ...current.prefixes,
        ...(updates.prefixes || {}),
      },
    };
    const key = `receipt_config_${businessId}`;
    setStored(key, updated);

    // Also update business profile fields if modified
    if (updates.businessName || updates.receiptFooter || updates.phone || updates.address || updates.currency) {
      await this.updateBusiness(businessId, {
        ...(updates.businessName && { name: updates.businessName }),
        ...(updates.receiptFooter && { receiptFooter: updates.receiptFooter }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.address && { address: updates.address }),
        ...(updates.currency && { currency: updates.currency }),
        ...(updates.logoUrl && { logoUrl: updates.logoUrl }),
      });
    }

    return updated;
  },

  // ==========================================
  // 9. RECYCLE BIN MODULE
  // ==========================================
  async getRecycleBinItems(businessId: string): Promise<RecycleBinItem[]> {
    const list = getStored<RecycleBinItem[]>('recycle_bin', INITIAL_RECYCLE_BIN);
    return list.filter((item) => item.businessId === businessId);
  },

  async moveToRecycleBin(itemData: Omit<RecycleBinItem, 'id' | 'deletedAt'>): Promise<RecycleBinItem> {
    const bin = getStored<RecycleBinItem[]>('recycle_bin', INITIAL_RECYCLE_BIN);
    const item: RecycleBinItem = {
      ...itemData,
      id: `bin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deletedAt: new Date().toISOString(),
    };
    bin.unshift(item);
    setStored('recycle_bin', bin);
    return item;
  },

  async restoreRecycleBinItem(id: string): Promise<boolean> {
    const bin = getStored<RecycleBinItem[]>('recycle_bin', INITIAL_RECYCLE_BIN);
    const item = bin.find((i) => i.id === id);
    if (!item) return false;

    // Restore to respective collection
    switch (item.itemType) {
      case 'product': {
        const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
        products.unshift(item.itemData as unknown as Product);
        setStored('products', products);
        break;
      }
      case 'customer': {
        const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
        customers.unshift(item.itemData as unknown as Customer);
        setStored('customers', customers);
        break;
      }
      case 'supplier': {
        const suppliers = getStored<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
        suppliers.unshift(item.itemData as unknown as Supplier);
        setStored('suppliers', suppliers);
        break;
      }
      case 'note': {
        const notes = getStored<BusinessNote[]>('notes', INITIAL_NOTES);
        notes.unshift(item.itemData as unknown as BusinessNote);
        setStored('notes', notes);
        break;
      }
      case 'quotation': {
        const quotations = getStored<Quotation[]>('quotations', INITIAL_QUOTATIONS);
        quotations.unshift(item.itemData as unknown as Quotation);
        setStored('quotations', quotations);
        break;
      }
      case 'expense': {
        const expenses = getStored<Expense[]>('expenses', INITIAL_EXPENSES);
        expenses.unshift(item.itemData as unknown as Expense);
        setStored('expenses', expenses);
        break;
      }
    }

    // Remove from bin
    const filtered = bin.filter((i) => i.id !== id);
    setStored('recycle_bin', filtered);
    return true;
  },

  async permanentDeleteRecycleBinItem(id: string): Promise<boolean> {
    const bin = getStored<RecycleBinItem[]>('recycle_bin', INITIAL_RECYCLE_BIN);
    const filtered = bin.filter((i) => i.id !== id);
    setStored('recycle_bin', filtered);
    return true;
  },

  async emptyRecycleBin(businessId: string): Promise<boolean> {
    const bin = getStored<RecycleBinItem[]>('recycle_bin', INITIAL_RECYCLE_BIN);
    const filtered = bin.filter((i) => i.businessId !== businessId);
    setStored('recycle_bin', filtered);
    return true;
  },

  // Soft delete for Product
  async deleteProductWithRecycleBin(
    productId: string,
    deletedBy: { id: string; name: string }
  ): Promise<boolean> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const p = products.find((prod) => prod.id === productId);
    if (!p) return false;

    await this.moveToRecycleBin({
      businessId: p.businessId,
      itemType: 'product',
      originalId: p.id,
      itemName: `${p.name} (SKU: ${p.sku})`,
      itemData: p as unknown as Record<string, unknown>,
      deletedBy: deletedBy.id,
      deletedByName: deletedBy.name,
    });

    const filtered = products.filter((prod) => prod.id !== productId);
    setStored('products', filtered);

    offlineSync.enqueue({
      collection: 'products',
      action: 'delete',
      data: { id: productId },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (e) {
        console.warn('Firebase delete product fallback:', e);
      }
    }
    return true;
  },

  // Soft delete for Customer
  async deleteCustomerWithRecycleBin(
    customerId: string,
    deletedBy: { id: string; name: string }
  ): Promise<boolean> {
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    const c = customers.find((cust) => cust.id === customerId);
    if (!c) return false;

    await this.moveToRecycleBin({
      businessId: c.businessId,
      itemType: 'customer',
      originalId: c.id,
      itemName: `${c.name} (${c.phone})`,
      itemData: c as unknown as Record<string, unknown>,
      deletedBy: deletedBy.id,
      deletedByName: deletedBy.name,
    });

    const filtered = customers.filter((cust) => cust.id !== customerId);
    setStored('customers', filtered);

    offlineSync.enqueue({
      collection: 'customers',
      action: 'delete',
      data: { id: customerId },
    });

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
      } catch (e) {
        console.warn('Firebase delete customer fallback:', e);
      }
    }
    return true;
  },

  // ==========================================
  // 10. FAST OFFLINE GLOBAL SEARCH
  // ==========================================
  async searchAll(businessId: string, queryText: string) {
    const term = queryText.trim().toLowerCase();
    if (!term) {
      return {
        products: [],
        customers: [],
        suppliers: [],
        sales: [],
        invoices: [],
        quotations: [],
        expenses: [],
        notes: [],
        adjustments: [],
      };
    }

    const [products, customers, suppliers, sales, invoices, quotations, expenses, notes, adjustments] =
      await Promise.all([
        this.getProducts(businessId),
        this.getCustomers(businessId),
        this.getSuppliers(businessId),
        this.getSales(businessId),
        this.getInvoices(businessId),
        this.getQuotations(businessId),
        this.getExpenses(businessId),
        this.getNotes(businessId),
        this.getStockAdjustments(businessId),
      ]);

    return {
      products: products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.barcode && p.barcode.toLowerCase().includes(term)) ||
          p.category.toLowerCase().includes(term)
      ),
      customers: customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term) ||
          (c.email && c.email.toLowerCase().includes(term))
      ),
      suppliers: suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.phone.toLowerCase().includes(term) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(term))
      ),
      sales: sales.filter(
        (s) =>
          s.saleNumber.toLowerCase().includes(term) ||
          (s.customerName && s.customerName.toLowerCase().includes(term)) ||
          s.items.some((it) => it.productName.toLowerCase().includes(term))
      ),
      invoices: invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.customerName.toLowerCase().includes(term)
      ),
      quotations: quotations.filter(
        (q) =>
          q.quotationNumber.toLowerCase().includes(term) ||
          q.customerName.toLowerCase().includes(term)
      ),
      expenses: expenses.filter(
        (e) => e.title.toLowerCase().includes(term) || e.category.toLowerCase().includes(term)
      ),
      notes: notes.filter(
        (n) => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
      ),
      adjustments: adjustments.filter(
        (a) => a.productName.toLowerCase().includes(term) || a.reason.toLowerCase().includes(term)
      ),
    };
  },
};
