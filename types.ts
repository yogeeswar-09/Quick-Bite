
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SPECIALIZED_ADMIN = 'SPECIALIZED_ADMIN',
}

export enum OrderStatus {
  CONFIRMED = 'Confirmed',
  PREPARING = 'Preparing',
  READY = 'Ready for Pickup',
  COMPLETED = 'Completed',
}

export enum FoodCategory {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  SNACKS = 'Snacks',
  DRINKS = 'Drinks',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export interface Coupon {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  category: FoodCategory | 'ALL';
  expiryDate: string; // YYYY-MM-DD
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialty?: FoodCategory; // For Specialized Admin
  points?: number; // Loyalty points
  activeReward?: '50_OFF' | null;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  image: string;
  isVeg: boolean;
  calories?: number;
  averageRating?: number;
  totalReviews?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  customization?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  status: OrderStatus;
  createdAt: number;
  targetTime?: number;
  prepStartTime?: number;
  pickupTime: string;
  pickupSlotId: string;
  isRated?: boolean;
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'PENDING';
  earnedPoints?: number;
}

export interface PickupSlot {
  id: string;
  time: string;
  capacity: number;
  booked: number;
  available: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  targetRole?: UserRole | 'ALL';
}

export interface Review {
  id: string;
  orderId: string;
  menuItemId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: number;
}
