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

export type AnnouncementType = 'info' | 'warning' | 'promotion' | 'update';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

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
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  read: boolean;
  createdAt: string;
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
