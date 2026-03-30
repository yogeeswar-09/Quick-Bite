import { CartItem, FoodCategory, MenuItem, Order, OrderStatus, PickupSlot, User, UserRole, Coupon, DiscountType } from '../types';

// ... (Keep INITIAL_MENU, INITIAL_USERS, INITIAL_COUPONS constants exactly as they were) ...
const INITIAL_MENU: MenuItem[] = [
  { id: 'm1', name: 'Spicy Paneer Wrap', description: 'Grilled paneer cubes...', price: 150, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm2', name: 'Chicken Caesar Salad', description: 'Crisp romaine lettuce...', price: 220, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm3', name: 'Masala Dosa', description: 'Crispy rice crepe...', price: 120, category: FoodCategory.BREAKFAST, image: 'https://images.unsplash.com/photo-1668236543090-d2f8969463d6?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm4', name: 'Double Cheeseburger', description: 'Two juicy patties...', price: 250, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm5', name: 'Cold Coffee', description: 'Chilled milk coffee...', price: 90, category: FoodCategory.DRINKS, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm6', name: 'Loaded Nachos', description: 'Tortilla chips topped...', price: 180, category: FoodCategory.SNACKS, image: 'https://images.unsplash.com/photo-1574966739932-d1e018659d4c?auto=format&fit=crop&w=800&q=80', isVeg: true },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'customer@quickbite.com', role: UserRole.CUSTOMER },
  { id: 'u2', name: 'Admin User', email: 'admin@quickbite.com', role: UserRole.ADMIN },
  { id: 'u3', name: 'Chef Mike', email: 'chef@quickbite.com', role: UserRole.SPECIALIZED_ADMIN, specialty: FoodCategory.LUNCH },
];

const INITIAL_COUPONS: Coupon[] = [
  { id: 'c1', code: 'WELCOME50', type: DiscountType.FLAT, value: 50, category: 'ALL', expiryDate: '2025-12-31' },
  { id: 'c2', code: 'LUNCH20', type: DiscountType.PERCENTAGE, value: 20, category: FoodCategory.LUNCH, expiryDate: '2025-12-31' }
];

class MockDatabase extends EventTarget {
  private users: User[] = [];
  private menu: MenuItem[] = [];
  private orders: Order[] = [];
  private slots: PickupSlot[] = [];
  private coupons: Coupon[] = [];
  private currentUser: User | null = null;
  private simulationInterval: any;

  constructor() {
    super();
    this.loadData();
    this.startKitchenSimulation();
  }

  private loadData() {
    const storedMenu = localStorage.getItem('qb_menu');
    const storedUsers = localStorage.getItem('qb_users');
    const storedOrders = localStorage.getItem('qb_orders');
    const storedCoupons = localStorage.getItem('qb_coupons');

    this.menu = storedMenu ? JSON.parse(storedMenu) : INITIAL_MENU;
    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    this.orders = storedOrders ? JSON.parse(storedOrders) : [];
    this.coupons = storedCoupons ? JSON.parse(storedCoupons) : INITIAL_COUPONS;
    
    this.generateSlots();
    if (this.orders.length === 0) this.generateMockHistory();
  }

  private generateMockHistory() {
      const now = Date.now();
      const ONE_DAY = 86400000;
      for(let i=0; i<50; i++) {
          const daysAgo = Math.floor(Math.random() * 7);
          const timeOffset = Math.floor(Math.random() * ONE_DAY);
          const createdAt = now - (daysAgo * ONE_DAY) - timeOffset;
          const numItems = Math.floor(Math.random() * 3) + 1;
          const orderItems: CartItem[] = [];
          for(let j=0; j<numItems; j++) {
              const menuRandom = this.menu[Math.floor(Math.random() * this.menu.length)];
              orderItems.push({...menuRandom, quantity: 1});
          }
          const total = orderItems.reduce((acc, i) => acc + i.price, 0);
          this.orders.push({
              id: `MOCK-${i}`, userId: 'u1', items: orderItems, totalAmount: total, discountAmount: 0,
              status: OrderStatus.COMPLETED, createdAt: createdAt, pickupTime: '12:00 PM', pickupSlotId: 'slot-1'
          });
      }
      this.saveData();
  }

  private saveData() {
    localStorage.setItem('qb_menu', JSON.stringify(this.menu));
    localStorage.setItem('qb_users', JSON.stringify(this.users));
    localStorage.setItem('qb_orders', JSON.stringify(this.orders));
    localStorage.setItem('qb_coupons', JSON.stringify(this.coupons));
    this.dispatchEvent(new Event('change'));
  }

  private generateSlots() {
    const slots: PickupSlot[] = [];
    let hour = 9;
    for (let i = 0; i < 10; i++) {
      slots.push({ id: `slot-${i}`, time: `${hour}:00 - ${hour}:30`, capacity: 5, booked: 0, available: true });
      hour++;
    }
    this.slots = slots;
  }

  private startKitchenSimulation() {
    this.simulationInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.orders.forEach(order => {
        if (order.status === OrderStatus.CONFIRMED && now > order.createdAt + 10000) {
          order.status = OrderStatus.PREPARING;
          order.prepStartTime = now;
          const prepMinutes = Math.floor(Math.random() * (15 - 8 + 1) + 8); 
          order.targetTime = now + (prepMinutes * 60 * 1000);
          changed = true;
        }
        if (order.status === OrderStatus.PREPARING && order.targetTime && now >= order.targetTime) {
          order.status = OrderStatus.READY;
          changed = true;
        }
      });
      if (changed) this.saveData();
    }, 1000);
  }

  // --- ASYNC UPDATES FOR COMPATIBILITY ---

  async login(email: string): Promise<User> {
    const user = this.users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    this.currentUser = user;
    localStorage.setItem('qb_current_user', JSON.stringify(user));
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('qb_current_user');
    window.location.reload();
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const stored = localStorage.getItem('qb_current_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    return null;
  }

  async getMenu(): Promise<MenuItem[]> {
    return [...this.menu];
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>) {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    this.menu.push(newItem);
    this.saveData();
  }

  async deleteMenuItem(id: string) {
    this.menu = this.menu.filter(item => item.id !== id);
    this.saveData();
  }

  getCoupons() { return [...this.coupons]; }
  addCoupon(coupon: any) { this.coupons.push({...coupon, id: Math.random().toString()}); this.saveData(); }
  deleteCoupon(id: string) { this.coupons = this.coupons.filter(c => c.id !== id); this.saveData(); }

  validateCoupon(code: string, cart: CartItem[]) {
    // ... (Keep existing logic) ...
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) return { valid: false, discount: 0, message: 'Invalid coupon code.' };
    const today = new Date().toISOString().split('T')[0];
    if (coupon.expiryDate < today) return { valid: false, discount: 0, message: 'Expired.' };
    
    let eligibleAmount = 0;
    if (coupon.category === 'ALL') {
      eligibleAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else {
      eligibleAmount = cart.filter(item => item.category === coupon.category).reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (eligibleAmount === 0) return { valid: false, discount: 0, message: `Only for ${coupon.category}.` };
    }
    let discount = coupon.type === DiscountType.FLAT ? Math.min(coupon.value, eligibleAmount) : Math.round(eligibleAmount * (coupon.value / 100));
    return { valid: true, discount, message: `Applied! Saved ₹${discount}` };
  }

  async getOrders(): Promise<Order[]> {
    return [...this.orders];
  }

  async getOrdersForUser(userId: string): Promise<Order[]> {
    return this.orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  async createOrder(items: CartItem[], totalAmount: number, pickupSlotId: string, discountAmount: number = 0, couponCode?: string): Promise<Order> {
    if (!this.currentUser) throw new Error('Must be logged in');
    // ... Slot logic ...
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: this.currentUser.id,
      items, totalAmount, discountAmount, couponCode, status: OrderStatus.CONFIRMED,
      createdAt: Date.now(), pickupTime: this.slots.find(s => s.id === pickupSlotId)?.time || 'Unknown', pickupSlotId
    };
    this.orders.unshift(newOrder);
    this.saveData();
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      this.saveData();
    }
  }

  async getSlots(): Promise<PickupSlot[]> {
    return [...this.slots];
  }

  async getAnalytics() {
      // ... reuse existing analytics logic ...
      const now = new Date();
      // (Mock implementation returns instant data)
      return {
          todayRevenue: 0, yesterdayRevenue: 0, todayOrders: 0, yesterdayOrders: 0,
          revenueData: [], categoryData: [], popularItem: { name: 'Mock Item', count: 10 }, peakTime: '12:00'
      };
  }
  
  // Helper for stats
  getStats() { return { totalOrders: this.orders.length, totalRevenue: 0, totalUsers: 3 }; }
}

export const db = new MockDatabase();