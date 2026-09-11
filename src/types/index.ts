export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  password?: string;
}

export type BusinessStatus = 'active' | 'suspended';

export interface Business {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  description?: string;
  currency: string; // e.g. 'UGX', 'USD', 'KES', 'TZS'
  logoUrl?: string;
  invoiceNotes?: string;
  receiptFooter?: string;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'active' | 'inactive';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type CustomerType = 'regular' | 'retail' | 'wholesale' | 'vip' | 'distributor' | 'walk_in';

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description: string;
  buyingPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  imageUrl?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerLocation?: string;
  businessName?: string;
  status: ProductStatus;
  moderationStatus?: ModerationStatus;
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  isMarketplacePublished?: boolean;
  marketplaceViews?: number;
  marketplaceEnquiries?: number;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType = 'sale' | 'restock' | 'adjustment' | 'return';

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  createdBy?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type?: CustomerType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceReview {
  id: string;
  productId: string;
  productName: string;
  reviewerName: string;
  reviewerPhone?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface FavouriteItem {
  id: string;
  productId: string;
  userId?: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId?: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  total?: number;
  buyingPrice?: number;
}

export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'bank_transfer';

export interface Sale {
  id: string;
  businessId: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  saleId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  status?: PaymentStatus;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export type AnnouncementType = 'info' | 'warning' | 'promotion' | 'update' | 'alert';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority?: AnnouncementPriority;
  imageUrl?: string;
  targetUserIds?: string[]; // empty means all users
  isPinned?: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'salaries'
  | 'inventory'
  | 'marketing'
  | 'transport'
  | 'equipment'
  | 'maintenance'
  | 'taxes'
  | 'other';

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced' | 'expired';

export interface Quotation {
  id: string;
  businessId: string;
  quotationNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  validityDate: string;
  status: QuotationStatus;
  notes?: string;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'quotation'
  | 'estimate'
  | 'purchase_order'
  | 'delivery_note'
  | 'invoice'
  | 'receipt'
  | 'statement';

export interface BusinessDocument {
  id: string;
  businessId: string;
  documentType: DocumentType;
  documentNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  supplierId?: string;
  supplierName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus?: PaymentStatus;
  date: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventType =
  | 'appointment'
  | 'task'
  | 'followup'
  | 'payment_reminder'
  | 'event'
  | 'delivery'
  | 'other';

export interface CalendarEvent {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  allDay?: boolean;
  type: CalendarEventType;
  status: 'pending' | 'completed' | 'cancelled';
  customerId?: string;
  customerName?: string;
  reminderMinutes?: number;
  reminderSent?: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory = 'general' | 'customer' | 'supplier' | 'daily' | 'reminder';

export interface BusinessNote {
  id: string;
  businessId: string;
  title: string;
  content: string;
  category: NoteCategory;
  isPinned: boolean;
  tags?: string[];
  relatedCustomerId?: string;
  relatedCustomerName?: string;
  relatedSupplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockAdjustmentReason =
  | 'damaged'
  | 'lost'
  | 'expired'
  | 'found'
  | 'correction'
  | 'returned_to_supplier'
  | 'other';

export interface StockAdjustment {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  sku: string;
  previousQuantity: number;
  adjustmentAmount: number; // positive or negative
  newQuantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
  userName: string;
  userId: string;
  createdAt: string;
}

export type RecycleBinItemType =
  | 'product'
  | 'customer'
  | 'supplier'
  | 'note'
  | 'quotation'
  | 'invoice'
  | 'expense';

export interface RecycleBinItem {
  id: string;
  businessId: string;
  itemType: RecycleBinItemType;
  originalId: string;
  itemName: string;
  itemData: Record<string, unknown>;
  deletedBy: string;
  deletedByName: string;
  deletedAt: string;
}

export interface DocumentPrefixConfig {
  invoicePrefix: string;
  receiptPrefix: string;
  quotationPrefix: string;
  estimatePrefix: string;
  purchaseOrderPrefix: string;
  deliveryNotePrefix: string;
}

export interface ReceiptCustomizationConfig {
  businessName?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  email?: string;
  receiptFooter?: string;
  thankYouMessage?: string;
  currency?: string;
  layout?: 'standard' | 'compact' | 'thermal';
  prefixes?: DocumentPrefixConfig;
}

export type ReceiptConfig = ReceiptCustomizationConfig;

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'business' | 'product' | 'settings' | 'announcement' | 'system';
  targetId: string;
  targetName: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface ProductReport {
  id: string;
  productId: string;
  productName: string;
  sellerName?: string;
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  reason: 'counterfeit' | 'misleading' | 'inappropriate' | 'out_of_stock' | 'scam' | 'other';
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actionTaken?: string;
}

export interface InAppNotification {
  id: string;
  userId: string; // 'all' or specific userId or specific businessId
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  read: boolean;
  createdAt: string;
  sound?: 'chime' | 'alert' | 'bell' | 'cash' | 'pop' | 'none';
  priority?: 'normal' | 'high' | 'urgent';
  targetType?: 'all' | 'specific_business' | 'specific_user';
  targetBusinessId?: string;
  targetBusinessName?: string;
  actionLabel?: string;
  actionView?: string;
}

export interface CashRegisterSession {
  id: string;
  businessId: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  openedByName: string;
  closedBy?: string;
  closedByName?: string;
  openingFloat: number;
  cashSales: number;
  momoSales: number;
  airtelSales: number;
  cardSales: number;
  cashExpenses: number;
  expectedCash: number;
  actualCashCounted?: number;
  cashVariance?: number; // actual - expected
  notes?: string;
  status: 'open' | 'closed';
  denominations?: Record<string, number>;
}

export interface PurchaseOrderItem {
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
}

export interface PurchaseOrder {
  id: string;
  businessId: string;
  poNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BusinessModuleConfig {
  pos: boolean;
  products: boolean;
  sales: boolean;
  quotations: boolean;
  purchases: boolean;
  cashRegister: boolean;
  debts: boolean;
  customers: boolean;
  suppliers: boolean;
  expenses: boolean;
  calendar: boolean;
  stockAdjustments: boolean;
  notes: boolean;
  tools: boolean;
  marketplace: boolean;
  reports: boolean;
  documents: boolean;
  backup: boolean;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalBusinesses: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalReports: number;
  totalSales: number;
  totalTransactions: number;
  recentRegistrations: UserProfile[];
  recentActivity: AuditLog[];
}
