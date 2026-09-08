import {
  Announcement,
  AppSetting,
  AuditLog,
  Business,
  Customer,
  InventoryMovement,
  Invoice,
  PaymentStatus,
  PlatformStats,
  Product,
  Sale,
  UserProfile,
} from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
    phone: '+256701234567',
    username: 'eaglebusinessmanager',
    fullName: 'Eagle Styles (Tusubira Benjamin)',
    role: 'admin',
    status: 'active',
    businessId: 'biz-001',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    lastLoginAt: '2025-01-20T08:00:00Z',
    password: '@Es%',
  },
  {
    id: 'user-003',
    email: 'grace@entebbe.com',
    phone: '+256772888999',
    username: 'gracenam',
    fullName: 'Grace Namatovu',
    role: 'user',
    status: 'active',
    businessId: 'biz-002',
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-15T09:30:00Z',
    lastLoginAt: '2025-01-18T14:20:00Z',
    password: '123456',
  },
  {
    id: 'user-004',
    email: 'kato.solar@gmail.com',
    phone: '+256791200151',
    username: 'katoronald',
    fullName: 'Kato Ronald',
    role: 'user',
    status: 'active',
    businessId: 'biz-003',
    createdAt: '2025-01-16T08:00:00Z',
    updatedAt: '2025-01-16T08:00:00Z',
    password: '123456',
  },
  {
    id: 'user-005',
    email: 'amina.fashion@gmail.com',
    phone: '+256782455677',
    username: 'aminanabbanja',
    fullName: 'Amina Nabbanja',
    role: 'user',
    status: 'active',
    businessId: 'biz-004',
    createdAt: '2025-01-16T12:00:00Z',
    updatedAt: '2025-01-16T12:00:00Z',
    password: '123456',
  },
  {
    id: 'user-006',
    email: 'sarah.naturals@gmail.com',
    phone: '+256755900123',
    username: 'sarahakello',
    fullName: 'Sarah Akello',
    role: 'user',
    status: 'active',
    businessId: 'biz-005',
    createdAt: '2025-01-17T09:00:00Z',
    updatedAt: '2025-01-17T09:00:00Z',
    password: '123456',
  },
  {
    id: 'user-007',
    email: 'denis.coffee@gmail.com',
    phone: '+256701889900',
    username: 'denismugisha',
    fullName: 'Denis Mugisha',
    role: 'user',
    status: 'active',
    businessId: 'biz-006',
    createdAt: '2025-01-17T10:00:00Z',
    updatedAt: '2025-01-17T10:00:00Z',
    password: '123456',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    businessId: 'biz-001',
    name: 'Smart 43" 4K UHD LED TV',
    sku: 'EL-TV-4301',
    category: 'Electronics',
    description: 'Frameless 4K Smart Android TV with HDR10 and Dolby Audio.',
    buyingPrice: 850000,
    sellingPrice: 1150000,
    currentStock: 14,
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Eagle Styles (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    businessName: 'Eagle Styles Store',
    status: 'active',
    createdAt: '2025-01-11T10:00:00Z',
    updatedAt: '2025-01-11T10:00:00Z',
  },
  {
    id: 'prod-002',
    businessId: 'biz-001',
    name: 'Pure Sine Wave Solar Inverter 2.5kVA',
    sku: 'SL-INV-2500',
    category: 'Solar & Power',
    description: 'Heavy duty copper transformer inverter for solar backup and commercial backup.',
    buyingPrice: 1400000,
    sellingPrice: 1850000,
    currentStock: 6,
    minStockLevel: 4,
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Eagle Styles (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    businessName: 'Eagle Styles Store',
    status: 'active',
    createdAt: '2025-01-11T11:00:00Z',
    updatedAt: '2025-01-11T11:00:00Z',
  },
  {
    id: 'prod-003',
    businessId: 'biz-001',
    name: 'Rechargeable Solar Flood Light 200W',
    sku: 'SL-FLD-0200',
    category: 'Lighting',
    description: 'Dusk to dawn waterproof outdoor security flood light with remote control.',
    buyingPrice: 110000,
    sellingPrice: 175000,
    currentStock: 3, // Low stock warning!
    minStockLevel: 8,
    imageUrl: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Eagle Styles (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    businessName: 'Eagle Styles Store',
    status: 'active',
    createdAt: '2025-01-11T12:00:00Z',
    updatedAt: '2025-01-11T12:00:00Z',
  },
  {
    id: 'prod-004',
    businessId: 'biz-001',
    name: 'Fast Charging USB-C Data Cable (2M)',
    sku: 'AC-CBL-002M',
    category: 'Accessories',
    description: 'Braided 65W nylon USB-C fast charging cable for smartphones and laptops.',
    buyingPrice: 12000,
    sellingPrice: 25000,
    currentStock: 48,
    minStockLevel: 15,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Eagle Styles (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    businessName: 'Eagle Styles Store',
    status: 'active',
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-12T09:00:00Z',
  },
  {
    id: 'prod-005',
    businessId: 'biz-001',
    name: 'Wireless Bluetooth Noise-Cancelling Headphones',
    sku: 'AU-HDP-700B',
    category: 'Audio',
    description: 'Over-ear 40-hour battery life with deep bass and clear voice mic.',
    buyingPrice: 95000,
    sellingPrice: 160000,
    currentStock: 2, // Low stock!
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Eagle Styles (Tusubira Benjamin)',
    sellerPhone: '+256 743 566 645',
    businessName: 'Eagle Styles Store',
    status: 'active',
    createdAt: '2025-01-12T14:30:00Z',
    updatedAt: '2025-01-12T14:30:00Z',
  },
  // Product for Business 2 (Grace Namatovu)
  {
    id: 'prod-006',
    businessId: 'biz-002',
    name: 'Organic Matooke Bunch (Premium)',
    sku: 'GR-MTK-001',
    category: 'Fresh Produce',
    description: 'Direct farm harvested soft cooking green plantain bananas.',
    buyingPrice: 20000,
    sellingPrice: 35000,
    currentStock: 25,
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Grace Namatovu',
    sellerPhone: '+256 772 888 999',
    businessName: 'Victoria Fresh Groceries',
    status: 'active',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  // Products from other community merchants
  {
    id: 'prod-007',
    businessId: 'biz-003',
    name: 'Solar Deep Cycle Gel Battery 200Ah 12V',
    sku: 'SL-BAT-200AH',
    category: 'Solar & Power',
    description: 'Maintenance-free sealed gel battery with 2,400 life cycles. Perfect for home and business inverter setups.',
    buyingPrice: 750000,
    sellingPrice: 920000,
    currentStock: 8,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Kato Ronald',
    sellerPhone: '+256 791 200 151',
    businessName: 'Kampala Solar Hub',
    status: 'active',
    createdAt: '2025-01-16T11:20:00Z',
    updatedAt: '2025-01-16T11:20:00Z',
  },
  {
    id: 'prod-008',
    businessId: 'biz-004',
    name: 'Men Handcrafted Leather Oxford Shoes',
    sku: 'FSH-SH-OX01',
    category: 'Fashion',
    description: 'Genuine leather handcrafted formal shoes with durable rubber sole. Sizes 40-45 available.',
    buyingPrice: 90000,
    sellingPrice: 150000,
    currentStock: 18,
    minStockLevel: 4,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Amina Nabbanja',
    sellerPhone: '+256 782 455 677',
    businessName: 'Apex Fashion & Apparel',
    status: 'active',
    createdAt: '2025-01-16T14:45:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
  },
  {
    id: 'prod-009',
    businessId: 'biz-005',
    name: 'Pure Raw Shea Butter Cream (500g)',
    sku: 'COS-SH-500G',
    category: 'Cosmetics',
    description: '100% organic grade A unrefined shea butter from Northern Uganda for skin moisturization and hair care.',
    buyingPrice: 18000,
    sellingPrice: 32000,
    currentStock: 35,
    minStockLevel: 10,
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Sarah Akello',
    sellerPhone: '+256 755 900 123',
    businessName: 'Nile Organic Naturals',
    status: 'active',
    createdAt: '2025-01-17T09:15:00Z',
    updatedAt: '2025-01-17T09:15:00Z',
  },
  {
    id: 'prod-010',
    businessId: 'biz-006',
    name: 'Mount Elgon Arabica Whole Coffee Beans (1kg)',
    sku: 'BV-CF-ELG01',
    category: 'Food & Beverage',
    description: 'Medium-dark roast single origin Arabica coffee beans grown on the volcanic slopes of Mount Elgon.',
    buyingPrice: 28000,
    sellingPrice: 48000,
    currentStock: 40,
    minStockLevel: 12,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
    sellerName: 'Denis Mugisha',
    sellerPhone: '+256 701 889 900',
    businessName: 'Elgon Roast Artisans',
    status: 'active',
    createdAt: '2025-01-17T15:00:00Z',
    updatedAt: '2025-01-17T15:00:00Z',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    businessId: 'biz-001',
    name: 'John Baptist Katende',
    phone: '+256 752 111 222',
    email: 'jbkatende@gmail.com',
    address: 'Ntinda Commercial Area, Kampala',
    notes: 'Regular buyer of solar lighting for residential properties.',
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
  },
  {
    id: 'cust-002',
    businessId: 'biz-001',
    name: 'Brenda Ainembabazi',
    phone: '+256 704 333 444',
    email: 'brenda.aine@outlook.com',
    address: 'Kololo Terrace, Kampala',
    notes: 'Purchased TV and home audio.',
    createdAt: '2025-01-14T11:20:00Z',
    updatedAt: '2025-01-14T11:20:00Z',
  },
  {
    id: 'cust-003',
    businessId: 'biz-001',
    name: 'Eng. Patrick Ssebuliba',
    phone: '+256 779 555 666',
    email: 'ssebuliba.eng@gmail.com',
    address: 'Mukono Industrial Park',
    notes: 'Contractor. Requests invoices for all supplies.',
    createdAt: '2025-01-16T15:45:00Z',
    updatedAt: '2025-01-16T15:45:00Z',
  },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-001',
    businessId: 'biz-001',
    saleNumber: 'EBM-2025-001',
    customerId: 'cust-001',
    customerName: 'John Baptist Katende',
    customerPhone: '+256 752 111 222',
    items: [
      {
        id: 'item-001',
        productId: 'prod-003',
        productName: 'Rechargeable Solar Flood Light 200W',
        sku: 'SL-FLD-0200',
        unitPrice: 175000,
        quantity: 2,
        subtotal: 350000,
      },
    ],
    subtotal: 350000,
    discount: 15000,
    total: 335000,
    paymentStatus: 'paid',
    paymentMethod: 'mobile_money',
    notes: 'Paid via MTN Mobile Money MoMoPay.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    createdBy: 'Store Manager',
  },
  {
    id: 'sale-002',
    businessId: 'biz-001',
    saleNumber: 'EBM-2025-002',
    customerId: 'cust-002',
    customerName: 'Brenda Ainembabazi',
    customerPhone: '+256 704 333 444',
    items: [
      {
        id: 'item-002',
        productId: 'prod-001',
        productName: 'Smart 43" 4K UHD LED TV',
        sku: 'EL-TV-4301',
        unitPrice: 1150000,
        quantity: 1,
        subtotal: 1150000,
      },
      {
        id: 'item-003',
        productId: 'prod-004',
        productName: 'Fast Charging USB-C Data Cable (2M)',
        sku: 'AC-CBL-002M',
        unitPrice: 25000,
        quantity: 2,
        subtotal: 50000,
      },
    ],
    subtotal: 1200000,
    discount: 50000,
    total: 1150000,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    notes: 'Card payment via POS terminal.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    createdBy: 'Store Manager',
  },
  {
    id: 'sale-003',
    businessId: 'biz-001',
    saleNumber: 'EBM-2025-003',
    customerId: 'cust-003',
    customerName: 'Eng. Patrick Ssebuliba',
    customerPhone: '+256 779 555 666',
    items: [
      {
        id: 'item-004',
        productId: 'prod-002',
        productName: 'Pure Sine Wave Solar Inverter 2.5kVA',
        sku: 'SL-INV-2500',
        unitPrice: 1850000,
        quantity: 1,
        subtotal: 1850000,
      },
    ],
    subtotal: 1850000,
    discount: 0,
    total: 1850000,
    paymentStatus: 'partial',
    paymentMethod: 'bank_transfer',
    notes: 'Paid 1,000,000 UGX deposit. Balance due on installation.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    createdBy: 'Store Manager',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    businessId: 'biz-001',
    invoiceNumber: 'INV-2025-0001',
    saleId: 'sale-003',
    customerId: 'cust-003',
    customerName: 'Eng. Patrick Ssebuliba',
    customerPhone: '+256 779 555 666',
    customerAddress: 'Mukono Industrial Park',
    items: [
      {
        id: 'inv-item-001',
        productId: 'prod-002',
        productName: 'Pure Sine Wave Solar Inverter 2.5kVA',
        sku: 'SL-INV-2500',
        unitPrice: 1850000,
        quantity: 1,
        subtotal: 1850000,
      },
    ],
    subtotal: 1850000,
    discount: 0,
    total: 1850000,
    paymentStatus: 'partial',
    status: 'partial',
    dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 10).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    notes: 'Initial deposit paid. Balance of 850,000 UGX due upon delivery.',
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'UGX Zero Free-Tier System Online',
    message: 'Welcome to Eagle Business Manager! Track sales, inventory, invoices, and customers seamlessly across mobile and desktop.',
    type: 'info',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'eagleadmin',
  },
  {
    id: 'ann-002',
    title: 'Android PWA Offline Capability Enabled',
    message: 'You can install Eagle Business Manager to your Android home screen for one-tap access and quick inventory checks.',
    type: 'update',
    startDate: '2025-01-10T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
    createdBy: 'eagleadmin',
  },
];

const INITIAL_APP_SETTINGS: AppSetting[] = [
  {
    id: 'set-001',
    key: 'application_name',
    value: 'Eagle Business Manager',
    description: 'The global branding title for the platform.',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'eagleadmin',
  },
  {
    id: 'set-002',
    key: 'default_currency',
    value: 'UGX',
    description: 'Default financial currency code for all new businesses.',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'eagleadmin',
  },
  {
    id: 'set-003',
    key: 'allow_registration',
    value: 'true',
    description: 'Whether new business owners can register freely.',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'eagleadmin',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    adminId: 'user-002',
    adminEmail: 'admin@eagle.com',
    action: 'PLATFORM_INITIALIZATION',
    targetType: 'settings',
    targetId: 'set-001',
    targetName: 'Application Launch',
    timestamp: '2025-01-01T00:00:00Z',
    details: { status: 'UGX 0 Tier Operational' },
  },
  {
    id: 'log-002',
    adminId: 'user-002',
    adminEmail: 'admin@eagle.com',
    action: 'BUSINESS_VERIFICATION',
    targetType: 'business',
    targetId: 'biz-001',
    targetName: 'Kampala Electronics & General Supplies',
    timestamp: '2025-01-10T08:30:00Z',
    details: { verificationStatus: 'approved' },
  },
];

// Helper to initialize local storage safely
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(fallback));
      return fallback;
    }
    const data = JSON.parse(raw);

    // Auto-migrate profiles: ensure shop owner user-001 is removed, and master admin account is strictly secured
    if (key === 'profiles' && Array.isArray(data)) {
      let profiles = data as UserProfile[];
      let updated = false;

      // Strictly purge any legacy 'shop owner' demo accounts (user-001, eagleuser, user@eagle.com)
      const filtered = profiles.filter(
        (p) =>
          p.id !== 'user-001' &&
          p.username?.toLowerCase() !== 'eagleuser' &&
          p.email?.toLowerCase() !== 'user@eagle.com' &&
          !p.fullName?.toLowerCase().includes('david mukasa')
      );
      if (filtered.length !== profiles.length) {
        profiles = filtered;
        updated = true;
      }

      // Check if current cached auth user was the deleted user-001
      const currentAuthId = localStorage.getItem('eagle_auth_user_id');
      if (currentAuthId === 'user-001') {
        localStorage.removeItem('eagle_auth_user_id');
      }

      const adminIdx = profiles.findIndex(
        (p) =>
          p.role === 'admin' ||
          p.email?.toLowerCase() === 'eaglebusinessmanager@gmail.com' ||
          p.email?.toLowerCase() === 'admin@eagle.com' ||
          p.id === 'user-002'
      );

      const securedAdmin: UserProfile = {
        id: adminIdx >= 0 ? profiles[adminIdx].id : 'user-002',
        email: 'eaglebusinessmanager@gmail.com',
        phone: '+256701234567',
        username: 'eaglebusinessmanager',
        fullName: 'Eagle Styles (Tusubira Benjamin)',
        role: 'admin',
        status: 'active',
        businessId: 'biz-001',
        createdAt: adminIdx >= 0 ? profiles[adminIdx].createdAt : '2025-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        password: '@Es%',
      };

      if (adminIdx >= 0) {
        profiles[adminIdx] = { ...profiles[adminIdx], ...securedAdmin };
        updated = true;
      } else {
        profiles.push(securedAdmin);
        updated = true;
      }

      if (updated) {
        localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(profiles));
      }
      return profiles as unknown as T;
    }

    return data;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            email: data.email,
            phone: data.phone,
            username: data.username,
            fullName: data.full_name,
            role: data.role,
            status: data.status,
            businessId: data.business_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastLoginAt: data.last_login_at,
          };
        }
      } catch (err) {
        console.warn('Supabase getProfile fallback to local:', err);
      }
    }
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    return profiles.find((p) => p.id === userId) || null;
  },

  async getProfileByUsernameOrPhone(identifier: string): Promise<UserProfile | null> {
    const cleanId = identifier.trim().toLowerCase();
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

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('profiles').insert({
          id: profile.id,
          username: profile.username,
          full_name: profile.fullName,
          phone: profile.phone,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          business_id: profile.businessId,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        });
      } catch (e) {
        console.warn('Supabase createProfile error:', e);
      }
    }
    return profile;
  },

  // Business
  async getBusiness(businessId: string): Promise<Business | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            category: data.category,
            phone: data.phone,
            address: data.address,
            description: data.description,
            currency: data.currency || 'UGX',
            logoUrl: data.logo_url,
            invoiceNotes: data.invoice_notes,
            receiptFooter: data.receipt_footer,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase getBusiness fallback to local:', err);
      }
    }
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    return businesses.find((b) => b.id === businessId) || null;
  },

  async createBusiness(business: Business): Promise<Business> {
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    businesses.push(business);
    setStored('businesses', businesses);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('businesses').insert({
          id: business.id,
          name: business.name,
          category: business.category,
          phone: business.phone,
          address: business.address,
          description: business.description,
          currency: business.currency,
          logo_url: business.logoUrl,
          invoice_notes: business.invoiceNotes,
          receipt_footer: business.receiptFooter,
          status: business.status,
          created_at: business.createdAt,
          updated_at: business.updatedAt,
        });
      } catch (e) {
        console.warn('Supabase createBusiness error:', e);
      }
    }
    return business;
  },

  async updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business | null> {
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    const index = businesses.findIndex((b) => b.id === businessId);
    if (index === -1) return null;

    businesses[index] = {
      ...businesses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setStored('businesses', businesses);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('businesses')
          .update({
            name: updates.name,
            category: updates.category,
            phone: updates.phone,
            address: updates.address,
            description: updates.description,
            currency: updates.currency,
            logo_url: updates.logoUrl,
            invoice_notes: updates.invoiceNotes,
            receipt_footer: updates.receiptFooter,
            status: updates.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);
      } catch (e) {
        console.warn('Supabase updateBusiness error:', e);
      }
    }
    return businesses[index];
  },

  // Products (Data Isolation enforced by businessId)
  async getProducts(businessId: string): Promise<Product[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .order('name', { ascending: true });
        if (!error && data) {
          return data.map((p) => ({
            id: p.id,
            businessId: p.business_id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            description: p.description || '',
            buyingPrice: Number(p.buying_price),
            sellingPrice: Number(p.selling_price),
            currentStock: Number(p.current_stock),
            minStockLevel: Number(p.min_stock_level),
            imageUrl: p.image_url,
            sellerName: p.seller_name,
            sellerPhone: p.seller_phone,
            businessName: p.business_name,
            status: p.status,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getProducts fallback to local:', err);
      }
    }
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    return products.filter((p) => p.businessId === businessId);
  },

  // Community Marketplace: Multi-Merchant Product Explorer & Search
  async getAllMarketplaceProducts(): Promise<Product[]> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);

    return products
      .filter((p) => p.status === 'active')
      .map((p) => {
        const b = businesses.find((biz) => biz.id === p.businessId);
        const owner = profiles.find((prof) => prof.businessId === p.businessId);
        return {
          ...p,
          businessName: p.businessName || b?.name || 'Local Merchant',
          sellerName: p.sellerName || owner?.fullName || owner?.username || 'Verified Seller',
          sellerPhone: p.sellerPhone || owner?.phone || b?.phone || '+256 743 566 645',
        };
      });
  },

  async createProduct(product: Product): Promise<Product> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    products.unshift(product);
    setStored('products', products);

    // Record initial inventory movement
    await this.recordInventoryMovement({
      id: 'mov-' + Date.now(),
      businessId: product.businessId,
      productId: product.id,
      productName: product.name,
      type: 'restock',
      quantityChange: product.currentStock,
      previousStock: 0,
      newStock: product.currentStock,
      reason: 'Initial stock intake upon product creation',
      createdAt: new Date().toISOString(),
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('products').insert({
          id: product.id,
          business_id: product.businessId,
          name: product.name,
          sku: product.sku,
          category: product.category,
          description: product.description,
          buying_price: product.buyingPrice,
          selling_price: product.sellingPrice,
          current_stock: product.currentStock,
          min_stock_level: product.minStockLevel,
          image_url: product.imageUrl,
          status: product.status,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
        });
      } catch (e) {
        console.warn('Supabase createProduct error:', e);
      }
    }
    return product;
  },

  async updateProduct(id: string, businessId: string, updates: Partial<Product>): Promise<Product | null> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const index = products.findIndex((p) => p.id === id && p.businessId === businessId);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setStored('products', products);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('products')
          .update({
            name: updates.name,
            sku: updates.sku,
            category: updates.category,
            description: updates.description,
            buying_price: updates.buyingPrice,
            selling_price: updates.sellingPrice,
            current_stock: updates.currentStock,
            min_stock_level: updates.minStockLevel,
            image_url: updates.imageUrl,
            status: updates.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase updateProduct error:', e);
      }
    }
    return products[index];
  },

  async deleteProduct(id: string, businessId: string): Promise<boolean> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const filtered = products.filter((p) => !(p.id === id && p.businessId === businessId));
    setStored('products', filtered);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id).eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase deleteProduct error:', e);
      }
    }
    return true;
  },

  async adjustStock(
    productId: string,
    businessId: string,
    quantityChange: number,
    reason: string,
    performedBy: string
  ): Promise<Product | null> {
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const product = products.find((p) => p.id === productId && p.businessId === businessId);
    if (!product) return null;

    const previousStock = product.currentStock;
    const newStock = Math.max(0, previousStock + quantityChange);
    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();
    setStored('products', products);

    // Log inventory movement
    await this.recordInventoryMovement({
      id: 'mov-' + Date.now(),
      businessId,
      productId,
      productName: product.name,
      type: quantityChange > 0 ? 'restock' : 'adjustment',
      quantityChange,
      previousStock,
      newStock,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: performedBy,
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('products')
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', productId)
          .eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase adjustStock error:', e);
      }
    }

    return product;
  },

  async recordInventoryMovement(movement: InventoryMovement): Promise<void> {
    const movements = getStored<InventoryMovement[]>('inventory_movements', []);
    movements.unshift(movement);
    setStored('inventory_movements', movements);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('inventory_movements').insert({
          id: movement.id,
          business_id: movement.businessId,
          product_id: movement.productId,
          product_name: movement.productName,
          type: movement.type,
          quantity_change: movement.quantityChange,
          previous_stock: movement.previousStock,
          new_stock: movement.newStock,
          reason: movement.reason,
          created_at: movement.createdAt,
          created_by: movement.createdBy,
        });
      } catch (e) {
        console.warn('Supabase recordInventoryMovement error:', e);
      }
    }
  },

  async getInventoryMovements(businessId: string, productId?: string): Promise<InventoryMovement[]> {
    const movements = getStored<InventoryMovement[]>('inventory_movements', []);
    return movements.filter((m) => m.businessId === businessId && (!productId || m.productId === productId));
  },

  // Customers (Data Isolation enforced by businessId)
  async getCustomers(businessId: string): Promise<Customer[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessId)
          .order('name', { ascending: true });
        if (!error && data) {
          return data.map((c) => ({
            id: c.id,
            businessId: c.business_id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            address: c.address,
            notes: c.notes,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getCustomers fallback to local:', err);
      }
    }
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    return customers.filter((c) => c.businessId === businessId);
  },

  async createCustomer(customer: Customer): Promise<Customer> {
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    customers.unshift(customer);
    setStored('customers', customers);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('customers').insert({
          id: customer.id,
          business_id: customer.businessId,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
          created_at: customer.createdAt,
          updated_at: customer.updatedAt,
        });
      } catch (e) {
        console.warn('Supabase createCustomer error:', e);
      }
    }
    return customer;
  },

  async updateCustomer(id: string, businessId: string, updates: Partial<Customer>): Promise<Customer | null> {
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    const index = customers.findIndex((c) => c.id === id && c.businessId === businessId);
    if (index === -1) return null;

    customers[index] = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setStored('customers', customers);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('customers')
          .update({
            name: updates.name,
            phone: updates.phone,
            email: updates.email,
            address: updates.address,
            notes: updates.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase updateCustomer error:', e);
      }
    }
    return customers[index];
  },

  async deleteCustomer(id: string, businessId: string): Promise<boolean> {
    const customers = getStored<Customer[]>('customers', INITIAL_CUSTOMERS);
    const filtered = customers.filter((c) => !(c.id === id && c.businessId === businessId));
    setStored('customers', filtered);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id).eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase deleteCustomer error:', e);
      }
    }
    return true;
  },

  // Sales (Data Isolation & Stock Auto-Decrease)
  async getSales(businessId: string): Promise<Sale[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*, sale_items(*)')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((s) => ({
            id: s.id,
            businessId: s.business_id,
            saleNumber: s.sale_number,
            customerId: s.customer_id,
            customerName: s.customer_name,
            customerPhone: s.customer_phone,
            items: (s.sale_items || []).map((it: any) => ({
              id: it.id,
              saleId: it.sale_id,
              productId: it.product_id,
              productName: it.product_name,
              sku: it.sku,
              unitPrice: Number(it.unit_price),
              quantity: Number(it.quantity),
              subtotal: Number(it.subtotal),
            })),
            subtotal: Number(s.subtotal),
            discount: Number(s.discount),
            total: Number(s.total),
            paymentStatus: s.payment_status,
            paymentMethod: s.payment_method,
            notes: s.notes,
            createdAt: s.created_at,
            createdBy: s.created_by,
          }));
        }
      } catch (err) {
        console.warn('Supabase getSales fallback to local:', err);
      }
    }
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    return sales.filter((s) => s.businessId === businessId);
  },

  async createSale(sale: Sale): Promise<Sale> {
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    sales.unshift(sale);
    setStored('sales', sales);

    // Automatically decrement product stock & record inventory movement for each item
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.productId && p.businessId === sale.businessId);
      if (prod) {
        const prev = prod.currentStock;
        const next = Math.max(0, prev - item.quantity);
        prod.currentStock = next;
        prod.updatedAt = new Date().toISOString();

        await this.recordInventoryMovement({
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          businessId: sale.businessId,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          quantityChange: -item.quantity,
          previousStock: prev,
          newStock: next,
          reason: `Sold in invoice/receipt #${sale.saleNumber}`,
          createdAt: new Date().toISOString(),
          createdBy: sale.createdBy,
        });
      }
    }
    setStored('products', products);

    // Automatically generate an invoice record for this sale as well
    const invoice: Invoice = {
      id: 'inv-' + Date.now(),
      businessId: sale.businessId,
      invoiceNumber: 'INV-' + sale.saleNumber.replace('EBM-', ''),
      saleId: sale.id,
      customerId: sale.customerId,
      customerName: sale.customerName || 'Walk-in Customer',
      customerPhone: sale.customerPhone,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      paymentStatus: sale.paymentStatus,
      status: sale.paymentStatus,
      dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString().split('T')[0],
      createdAt: sale.createdAt,
      notes: sale.notes,
    };
    await this.createInvoice(invoice);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('sales').insert({
          id: sale.id,
          business_id: sale.businessId,
          sale_number: sale.saleNumber,
          customer_id: sale.customerId,
          customer_name: sale.customerName,
          customer_phone: sale.customerPhone,
          subtotal: sale.subtotal,
          discount: sale.discount,
          total: sale.total,
          payment_status: sale.paymentStatus,
          payment_method: sale.paymentMethod,
          notes: sale.notes,
          created_at: sale.createdAt,
          created_by: sale.createdBy,
        });

        if (sale.items.length > 0) {
          await supabase.from('sale_items').insert(
            sale.items.map((it) => ({
              id: it.id,
              sale_id: sale.id,
              product_id: it.productId,
              product_name: it.productName,
              sku: it.sku,
              unit_price: it.unitPrice,
              quantity: it.quantity,
              subtotal: it.subtotal,
            }))
          );
        }
      } catch (e) {
        console.warn('Supabase createSale error:', e);
      }
    }

    return sale;
  },

  // Invoices
  async getInvoices(businessId: string): Promise<Invoice[]> {
    const invoices = getStored<Invoice[]>('invoices', INITIAL_INVOICES);
    return invoices
      .filter((i) => i.businessId === businessId)
      .map((inv) => ({
        ...inv,
        status: inv.status || inv.paymentStatus || 'pending',
        paymentStatus: inv.paymentStatus || inv.status || 'pending',
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    const invoices = getStored<Invoice[]>('invoices', INITIAL_INVOICES);
    const normalized: Invoice = {
      ...invoice,
      status: invoice.status || invoice.paymentStatus || 'pending',
      paymentStatus: invoice.paymentStatus || invoice.status || 'pending',
    };
    invoices.unshift(normalized);
    setStored('invoices', invoices);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('invoices').insert({
          id: normalized.id,
          business_id: normalized.businessId,
          invoice_number: normalized.invoiceNumber,
          sale_id: normalized.saleId,
          customer_id: normalized.customerId,
          customer_name: normalized.customerName,
          customer_phone: normalized.customerPhone,
          customer_address: normalized.customerAddress,
          subtotal: normalized.subtotal,
          discount: normalized.discount,
          total: normalized.total,
          payment_status: normalized.paymentStatus,
          due_date: normalized.dueDate,
          created_at: normalized.createdAt,
          notes: normalized.notes,
        });
      } catch (e) {
        console.warn('Supabase createInvoice error:', e);
      }
    }

    return normalized;
  },

  async updateInvoiceStatus(id: string, businessId: string, status: Invoice['paymentStatus']): Promise<boolean> {
    const invoices = getStored<Invoice[]>('invoices', INITIAL_INVOICES);
    const invoice = invoices.find((i) => i.id === id && i.businessId === businessId);
    if (!invoice) return false;
    invoice.paymentStatus = status;
    invoice.status = status;
    invoice.updatedAt = new Date().toISOString();
    setStored('invoices', invoices);

    // Also update matching sale payment status if linked
    if (invoice.saleId) {
      const sales = getStored<Sale[]>('sales', INITIAL_SALES);
      const s = sales.find((x) => x.id === invoice.saleId);
      if (s) {
        s.paymentStatus = status;
        setStored('sales', sales);
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('invoices')
          .update({ payment_status: status, updated_at: invoice.updatedAt })
          .eq('id', id)
          .eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase updateInvoiceStatus error:', e);
      }
    }

    return true;
  },

  async deleteInvoice(id: string, businessId: string): Promise<boolean> {
    const invoices = getStored<Invoice[]>('invoices', INITIAL_INVOICES);
    const filtered = invoices.filter((i) => !(i.id === id && i.businessId === businessId));
    setStored('invoices', filtered);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('invoices').delete().eq('id', id).eq('business_id', businessId);
      } catch (e) {
        console.warn('Supabase deleteInvoice error:', e);
      }
    }
    return true;
  },

  // Announcements
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date().toISOString();
    const announcements = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    return announcements.filter((a) => a.isActive && a.startDate <= now && a.endDate >= now);
  },

  // -------------------------------------------------------------
  // PLATFORM ADMINISTRATOR AREA (PROTECTED)
  // -------------------------------------------------------------
  async getPlatformStats(requestingRole: string): Promise<PlatformStats> {
    if (requestingRole !== 'admin') {
      throw new Error('Access Denied: Administrator role required.');
    }

    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    const products = getStored<Product[]>('products', INITIAL_PRODUCTS);
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    const logs = getStored<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0);

    return {
      totalUsers: profiles.length,
      activeUsers: profiles.filter((p) => p.status === 'active').length,
      suspendedUsers: profiles.filter((p) => p.status === 'suspended').length,
      totalBusinesses: businesses.length,
      totalProducts: products.length,
      totalSales: totalSalesAmount,
      totalTransactions: sales.length,
      recentRegistrations: profiles.slice(0, 5),
      recentActivity: logs.slice(0, 8),
    };
  },

  async getAllUsers(requestingRole: string = 'admin'): Promise<UserProfile[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    return getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
  },

  async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended',
    adminId: string,
    adminEmail: string
  ): Promise<boolean> {
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    const user = profiles.find((p) => p.id === userId);
    if (!user) return false;

    // Prevent modifying main super admin status
    if (user.username === 'eagleadmin' && status === 'suspended') {
      throw new Error('Cannot suspend the primary system administrator.');
    }

    user.status = status;
    user.updatedAt = new Date().toISOString();
    setStored('profiles', profiles);

    await this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminEmail,
      action: status === 'active' ? 'USER_ACTIVATION' : 'USER_SUSPENSION',
      targetType: 'user',
      targetId: user.id,
      targetName: user.fullName + ` (@${user.username})`,
      timestamp: new Date().toISOString(),
      details: { newStatus: status },
    });

    return true;
  },

  async deleteUser(userId: string, adminId: string, adminEmail: string): Promise<boolean> {
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    const user = profiles.find((p) => p.id === userId);
    if (!user) return false;
    if (user.username === 'eagleadmin') {
      throw new Error('Cannot delete the root administrator.');
    }

    const filtered = profiles.filter((p) => p.id !== userId);
    setStored('profiles', filtered);

    await this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminEmail,
      action: 'USER_DELETION',
      targetType: 'user',
      targetId: user.id,
      targetName: user.fullName + ` (@${user.username})`,
      timestamp: new Date().toISOString(),
      details: { deletedEmail: user.email, businessId: user.businessId },
    });

    return true;
  },

  async getAllBusinesses(requestingRole: string = 'admin'): Promise<Business[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    return getStored<Business[]>('businesses', INITIAL_BUSINESSES);
  },

  async updateBusinessStatus(
    businessId: string,
    status: 'active' | 'suspended',
    adminId: string,
    adminEmail: string
  ): Promise<boolean> {
    const businesses = getStored<Business[]>('businesses', INITIAL_BUSINESSES);
    const biz = businesses.find((b) => b.id === businessId);
    if (!biz) return false;

    biz.status = status;
    biz.updatedAt = new Date().toISOString();
    setStored('businesses', businesses);

    await this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminEmail,
      action: status === 'active' ? 'BUSINESS_ACTIVATION' : 'BUSINESS_SUSPENSION',
      targetType: 'business',
      targetId: biz.id,
      targetName: biz.name,
      timestamp: new Date().toISOString(),
      details: { newStatus: status },
    });

    return true;
  },

  async getAllProductsAdmin(requestingRole: string = 'admin'): Promise<Product[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    return getStored<Product[]>('products', INITIAL_PRODUCTS);
  },

  async getAllSalesAdmin(requestingRole: string = 'admin'): Promise<Sale[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    return getStored<Sale[]>('sales', INITIAL_SALES);
  },

  async getAllAnnouncements(requestingRole: string = 'admin'): Promise<Announcement[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    return getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  },

  async createAnnouncement(announcement: Announcement, adminEmail: string): Promise<Announcement> {
    const announcements = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    announcements.unshift(announcement);
    setStored('announcements', announcements);

    await this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId: announcement.createdBy,
      adminEmail,
      action: 'ANNOUNCEMENT_CREATED',
      targetType: 'announcement',
      targetId: announcement.id,
      targetName: announcement.title,
      timestamp: new Date().toISOString(),
    });

    return announcement;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const announcements = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const index = announcements.findIndex((a) => a.id === id);
    if (index === -1) return null;

    announcements[index] = { ...announcements[index], ...updates };
    setStored('announcements', announcements);
    return announcements[index];
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    const announcements = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const filtered = announcements.filter((a) => a.id !== id);
    setStored('announcements', filtered);
    return true;
  },

  async getAppSettings(requestingRole: string): Promise<AppSetting[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    return getStored<AppSetting[]>('app_settings', INITIAL_APP_SETTINGS);
  },

  async updateAppSetting(key: string, value: string, adminId: string, adminEmail: string): Promise<boolean> {
    const settings = getStored<AppSetting[]>('app_settings', INITIAL_APP_SETTINGS);
    const setting = settings.find((s) => s.key === key);
    if (!setting) return false;

    setting.value = value;
    setting.updatedAt = new Date().toISOString();
    setting.updatedBy = adminEmail;
    setStored('app_settings', settings);

    await this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminEmail,
      action: 'SETTINGS_MODIFIED',
      targetType: 'settings',
      targetId: setting.id,
      targetName: key,
      timestamp: new Date().toISOString(),
      details: { newValue: value },
    });

    return true;
  },

  async getAuditLogs(requestingRole: string = 'admin'): Promise<AuditLog[]> {
    if (requestingRole !== 'admin') throw new Error('Access Denied');
    const logs = getStored<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addAuditLog(entry: AuditLog): Promise<void> {
    const logs = getStored<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    logs.unshift(entry);
    setStored('audit_logs', logs.slice(0, 100)); // retain last 100 logs
  },

  async resetUserPassword(userId: string, newPassword: string, adminId: string, adminEmail: string): Promise<boolean> {
    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    const user = profiles.find((p) => p.id === userId);
    if (!user) return false;

    // Save in user profile / mock auth table
    user.updatedAt = new Date().toISOString();
    setStored('profiles', profiles);

    await this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminEmail,
      action: 'USER_PASSWORD_RESET',
      targetType: 'user',
      targetId: user.id,
      targetName: user.fullName + ` (@${user.username})`,
      timestamp: new Date().toISOString(),
      details: { resetByAdmin: true },
    });

    return true;
  },

  async updateSaleStatus(saleId: string, businessId: string, status: PaymentStatus): Promise<boolean> {
    const sales = getStored<Sale[]>('sales', INITIAL_SALES);
    const sale = sales.find((s) => s.id === saleId && s.businessId === businessId);
    if (!sale) return false;
    sale.paymentStatus = status;
    setStored('sales', sales);
    return true;
  },

  async toggleAnnouncementActive(id: string, active: boolean): Promise<boolean> {
    const announcements = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const ann = announcements.find((a) => a.id === id);
    if (!ann) return false;
    ann.isActive = active;
    setStored('announcements', announcements);
    return true;
  },

  async getAllProductsPlatform(requestingRole: string = 'admin'): Promise<Product[]> {
    return this.getAllProductsAdmin(requestingRole);
  },

  async getAllSalesPlatform(requestingRole: string = 'admin'): Promise<Sale[]> {
    return this.getAllSalesAdmin(requestingRole);
  },
};
