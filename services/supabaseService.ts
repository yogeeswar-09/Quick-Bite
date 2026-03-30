import { createClient } from '@supabase/supabase-js';
import { CartItem, MenuItem, Order, OrderStatus, PickupSlot, User, UserRole, Coupon, DiscountType, FoodCategory, Review } from '../types';

// ------------------------------------------------------------------
// YOUR SUPABASE CREDENTIALS
// ------------------------------------------------------------------
const SUPABASE_URL = 'https://ipbavlemciyqrtmlmiye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_--JAqtSgSkoSqhFwXIOo9Q_7JxXNNqA';
// ------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// KEPT MENU ITEMS
const MOCK_MENU: MenuItem[] = [
  { id: 'm1', name: 'Spicy Paneer Wrap', description: 'Grilled paneer cubes with tangy sauce.', price: 150, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm2', name: 'Chicken Caesar Salad', description: 'Crisp romaine with grilled chicken.', price: 220, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm3', name: 'Masala Dosa', description: 'Crispy rice crepe with potato filling.', price: 120, category: FoodCategory.BREAKFAST, image: 'https://images.unsplash.com/photo-1668236543090-d2f8969463d6?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm4', name: 'Cold Coffee', description: 'Chilled rich coffee with ice cream.', price: 90, category: FoodCategory.DRINKS, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm5', name: 'Loaded Nachos', description: 'Tortilla chips with cheese and salsa.', price: 180, category: FoodCategory.SNACKS, image: 'https://images.unsplash.com/photo-1574966739932-d1e018659d4c?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm6', name: 'Veggie Burger', description: 'Double patty with extra cheese.', price: 140, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', isVeg: true },
  
  // New Items
  { id: 'm7', name: 'Chicken Manchuria', description: 'Spicy Indo-Chinese chicken stir fry.', price: 160, category: FoodCategory.SNACKS, image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm8', name: 'Egg Puff', description: 'Flaky pastry filled with spiced egg.', price: 35, category: FoodCategory.SNACKS, image: 'https://plus.unsplash.com/premium_photo-1675276326693-e18dbb091f09?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm9', name: 'Samosa', description: 'Crispy pastry with savory potato filling.', price: 25, category: FoodCategory.SNACKS, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm10', name: 'Veg Manchuria', description: 'Deep fried veggie balls in spicy sauce.', price: 130, category: FoodCategory.SNACKS, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm11', name: 'Parota with Chicken', description: 'Layered flatbread with chicken curry.', price: 180, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1606491956689-2ea28c674675?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm12', name: 'Roti with Chicken', description: 'Whole wheat roti served with chicken curry.', price: 160, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm13', name: 'Chicken Noodles', description: 'Stir-fried noodles with chicken and veggies.', price: 150, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80', isVeg: false },
  { id: 'm14', name: 'Veg Noodles', description: 'Hakka style noodles with fresh vegetables.', price: 120, category: FoodCategory.LUNCH, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm15', name: 'Idli Sambar', description: 'Soft steamed rice cakes with lentil soup.', price: 50, category: FoodCategory.BREAKFAST, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm16', name: 'Puri Bhaji', description: 'Fried bread served with potato curry.', price: 60, category: FoodCategory.BREAKFAST, image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm17', name: 'Mysore Bonda', description: 'Crispy fried dough balls with spices.', price: 50, category: FoodCategory.BREAKFAST, image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80', isVeg: true },
  { id: 'm18', name: 'Medu Vada', description: 'Crispy savory donuts made of lentils.', price: 55, category: FoodCategory.BREAKFAST, image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80', isVeg: true },
];

class SupabaseService extends EventTarget {
  private currentUser: User | null = null;
  private realtimeSubscription: any = null;
  private reviews: Review[] = [];
  private _localMenu: MenuItem[] = [];
  private _localCoupons: Coupon[] = [];
  private _localOrders: Order[] = []; // NEW: Local Order Store

  constructor() {
    super();
    // 1. Restore session
    const stored = localStorage.getItem('qb_current_user');
    if (stored) this.currentUser = JSON.parse(stored);

    // Restore reviews
    const storedReviews = localStorage.getItem('qb_reviews');
    if (storedReviews) this.reviews = JSON.parse(storedReviews);

    // Restore coupons
    const storedCoupons = localStorage.getItem('qb_coupons');
    if (storedCoupons) this._localCoupons = JSON.parse(storedCoupons);

    // Restore Orders (Critical for internal simulation)
    const storedOrders = localStorage.getItem('qb_orders');
    if (storedOrders) this._localOrders = JSON.parse(storedOrders);

    // NEW: Listen for storage changes to sync across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'qb_orders' && e.newValue) {
            this._localOrders = JSON.parse(e.newValue);
            this.dispatchEvent(new Event('change'));
        }
        if (e.key === 'qb_menu_items' && e.newValue) {
            this._localMenu = JSON.parse(e.newValue);
            this.dispatchEvent(new Event('change'));
        }
        if (e.key === 'qb_reviews' && e.newValue) {
            this.reviews = JSON.parse(e.newValue);
            this.dispatchEvent(new Event('change'));
        }
        if (e.key === 'qb_current_user' && e.newValue) {
             this.currentUser = JSON.parse(e.newValue);
             this.dispatchEvent(new Event('session-updated'));
        }
    });

    this.setupRealtime();
    
    // Seed default users
    this._seedDefaultUsers();
  }

  private _persistOrders() {
      localStorage.setItem('qb_orders', JSON.stringify(this._localOrders));
  }

  private updateSession(user: User) {
      this.currentUser = user;
      localStorage.setItem('qb_current_user', JSON.stringify(user));
      this.dispatchEvent(new Event('session-updated'));
  }

  setupRealtime() {
    this.realtimeSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Optimistically we handle updates locally, but this ensures multi-tab sync if connected
        this.dispatchEvent(new Event('change'));
      })
      .subscribe();
  }

  // --- Auth & User Management ---

  private _getStoredAuthUsers(): any[] {
      return JSON.parse(localStorage.getItem('qb_auth_users') || '[]');
  }

  private _saveAuthUser(user: any) {
      const users = this._getStoredAuthUsers();
      users.push(user);
      localStorage.setItem('qb_auth_users', JSON.stringify(users));
  }
  
  private _seedDefaultUsers() {
      const users = this._getStoredAuthUsers();
      
      // Seed Admin
      if (!users.some((u: any) => u.email === 'admin@quickbite.com')) {
          const defaultAdmin = {
              id: 'admin-default',
              name: 'System Admin',
              email: 'admin@quickbite.com',
              role: UserRole.ADMIN,
              password: 'admin' 
          };
          this._saveAuthUser(defaultAdmin);
          console.log("Default Admin seeded");
      }

      // Seed Student
      if (!users.some((u: any) => u.email === 'student@demo.com')) {
          const defaultStudent = {
              id: 'student-default',
              name: 'Demo Student',
              email: 'student@demo.com',
              role: UserRole.CUSTOMER,
              password: 'student' 
          };
          this._saveAuthUser(defaultStudent);
          console.log("Default Student seeded");
      }
  }

  async register(data: { name: string; email: string; password: string; role: UserRole }): Promise<User> {
      await new Promise(resolve => setTimeout(resolve, 800)); // Sim Network
      
      const users = this._getStoredAuthUsers();
      if (users.find((u: any) => u.email.toLowerCase() === data.email.toLowerCase())) {
          throw new Error('Email already registered');
      }

      const newUser = {
          id: `u-${Date.now()}`,
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password // Stored locally for simulation
      };

      this._saveAuthUser(newUser);

      // Return sanitized user (no password)
      const sanitizedUser: User = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
      };

      this.updateSession(sanitizedUser);
      return sanitizedUser;
  }

  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Sim Network

    const users = this._getStoredAuthUsers();
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) throw new Error('Account not found');
    if (user.password !== password) throw new Error('Incorrect password');

    const sanitizedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    this.updateSession(sanitizedUser);
    return sanitizedUser;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem('qb_current_user');
    this.dispatchEvent(new Event('session-updated'));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // --- Menu Management ---
  
  private _persistMenu() {
    localStorage.setItem('qb_menu_items', JSON.stringify(this._localMenu));
  }

  async getMenu(): Promise<MenuItem[]> {
    if (this._localMenu.length === 0) {
        const stored = localStorage.getItem('qb_menu_items');
        if (stored) {
            this._localMenu = JSON.parse(stored);
        } else {
             this._localMenu = [...MOCK_MENU];
        }
    }

    // Dynamic Ratings Calculation
    return this._localMenu.map((item: any) => {
        const itemReviews = this.reviews.filter(r => r.menuItemId === item.id);
        const total = itemReviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = itemReviews.length ? parseFloat((total / itemReviews.length).toFixed(1)) : 0;
        return { ...item, averageRating: avg || 0, totalReviews: itemReviews.length || 0 };
    });
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>) {
    const newItem = { ...item, id: Date.now().toString() };
    this._localMenu.push(newItem);
    this._persistMenu();
    supabase.from('menu_items').insert([newItem]).then(({error}) => { if(error) console.warn('Supabase sync warning:', error); });
    this.dispatchEvent(new Event('change'));
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    this._localMenu = this._localMenu.map(i => i.id === id ? { ...i, ...updates } : i);
    this._persistMenu();
    supabase.from('menu_items').update(updates).eq('id', id).then();
    this.dispatchEvent(new Event('change'));
  }

  async deleteMenuItem(id: string) {
    this._localMenu = this._localMenu.filter(i => i.id !== id);
    this._persistMenu();
    supabase.from('menu_items').delete().eq('id', id).then();
    this.dispatchEvent(new Event('change'));
  }

  // --- Reviews ---
  async addReview(review: Omit<Review, 'id' | 'timestamp' | 'userName'>) {
      if (!this.currentUser) return;
      
      const newReview: Review = {
          ...review,
          id: Date.now().toString(),
          timestamp: Date.now(),
          userName: this.currentUser.name,
      };
      
      this.reviews.push(newReview);
      localStorage.setItem('qb_reviews', JSON.stringify(this.reviews));
      this.dispatchEvent(new Event('change'));
  }

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    // Return local orders first to ensure speed and availability
    return this._localOrders.map(o => {
        const hasReviews = this.reviews.some(r => r.orderId === o.id);
        return { ...o, isRated: o.isRated || hasReviews };
    });
  }

  async getOrdersForUser(userId: string): Promise<Order[]> {
    return this._localOrders
        .filter(o => o.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(o => {
            const hasReviews = this.reviews.some(r => r.orderId === o.id);
            return { ...o, isRated: o.isRated || hasReviews };
        });
  }

  async getKitchenStats() {
    // Use local orders for stats
    const orders = this._localOrders;
    const activeOrders = orders.filter(o => 
      o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PREPARING
    );
    
    const activeCount = activeOrders.length;
    let loadLevel = 'Low';
    let extraDelay = 0;

    if (activeCount > 8) {
        loadLevel = 'High';
        extraDelay = 15;
    } else if (activeCount > 4) {
        loadLevel = 'Medium';
        extraDelay = 5;
    }

    return { activeCount, loadLevel, extraDelay };
  }

  async createOrder(items: CartItem[], totalAmount: number, pickupSlotId: string, discountAmount: number = 0, couponCode?: string, paymentMethod: string = 'ONLINE'): Promise<Order> {
    if (!this.currentUser) throw new Error('Must be logged in');

    const stats = await this.getKitchenStats();
    const basePrepMinutes = 15; 
    const queuePenaltyMinutes = stats.activeCount * 2; 
    const totalPrepMinutes = basePrepMinutes + queuePenaltyMinutes;
    
    const now = Date.now();
    const targetTime = now + (totalPrepMinutes * 60 * 1000);
    const paymentStatus = paymentMethod === 'CASH' ? 'PENDING' : 'PAID';

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      userId: this.currentUser.id,
      items: items, 
      totalAmount,
      discountAmount,
      couponCode,
      status: OrderStatus.CONFIRMED,
      createdAt: now,
      prepStartTime: now,
      targetTime: targetTime,
      pickupTime: '12:00 PM', // Simplified
      pickupSlotId,
      isRated: false,
      paymentMethod,
      paymentStatus
    };

    // 1. SAVE LOCALLY (Guarantees UI update)
    this._localOrders.unshift(newOrder);
    this._persistOrders();

    // 2. ATTEMPT REMOTE SYNC (Background)
    const { 
        isRated: _isRated, 
        prepStartTime: _prepStartTime, 
        targetTime: _targetTime, 
        pickupSlotId: _pickupSlotId, 
        discountAmount: _discountAmount, 
        couponCode: _couponCode, 
        paymentMethod: _paymentMethod,
        paymentStatus: _paymentStatus,
        ...supabasePayload 
    } = newOrder;

    supabase.from('orders').insert([supabasePayload]).select().single().then(({ error }) => {
        if (error && !error.message?.includes('Failed to fetch')) console.warn("Background Sync Error (Supabase):", error.message);
    }).catch(() => {});
    
    // Notifications
    window.dispatchEvent(new CustomEvent('qb-notification', {
        detail: { type: 'ORDER_CREATED', payload: newOrder }
    }));

    if (stats.loadLevel === 'High') {
         window.dispatchEvent(new CustomEvent('qb-notification', {
            detail: { type: 'KITCHEN_HIGH_LOAD', payload: stats }
        }));
    }
    
    this.dispatchEvent(new Event('change'));
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    // 1. Local Update
    const order = this._localOrders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        
        // Update timings when cooking starts
        if (status === OrderStatus.PREPARING) {
             const now = Date.now();
             order.prepStartTime = now;
             // Set default 15 min prep if not already set or needing update
             order.targetTime = now + (15 * 60 * 1000);
        }

        // If completing a CASH order, assume payment is collected (optional, or admin marks it)
        // For now, we leave it PENDING so admin knows to collect, unless we add specific "Mark Paid" button.
        // Assuming "Completed" status means food is handed over and thus payment collected for CASH orders?
        // Let's explicitly set to PAID if completed.
        if (status === OrderStatus.COMPLETED && order.paymentMethod === 'CASH') {
            order.paymentStatus = 'PAID';
        }

        this._persistOrders();
    }

    // 2. Remote Update
    supabase.from('orders').update({ status }).eq('id', orderId).then();
    
    window.dispatchEvent(new CustomEvent('qb-notification', {
        detail: { type: 'ORDER_UPDATED', payload: { id: orderId, status } }
    }));
    this.dispatchEvent(new Event('change'));
  }

  // --- Slots & Coupons ---
  async getSlots(): Promise<PickupSlot[]> {
    const slots: PickupSlot[] = [];
    let hour = 9;
    for (let i = 0; i < 10; i++) {
      slots.push({ id: `slot-${i}`, time: `${hour}:00 - ${hour}:30`, capacity: 5, booked: 0, available: true });
      hour++;
    }
    return slots;
  }

  getCoupons(): Coupon[] { 
    return this._localCoupons; 
  }
  
  addCoupon(c: Coupon) { 
    this._localCoupons.push({ ...c, id: Date.now().toString() });
    localStorage.setItem('qb_coupons', JSON.stringify(this._localCoupons));
    this.dispatchEvent(new Event('change'));
  }
  
  deleteCoupon(id: string) { 
    this._localCoupons = this._localCoupons.filter(c => c.id !== id);
    localStorage.setItem('qb_coupons', JSON.stringify(this._localCoupons));
    this.dispatchEvent(new Event('change'));
  }

  validateCoupon(code: string, cart: CartItem[]) {
      const coupon = this._localCoupons.find(c => c.code === code);
      if(!coupon) return { valid: false, discount: 0, message: 'Invalid' };
      return { valid: true, discount: coupon.value, message: 'Applied' };
  }

  // --- Analytics ---
  async getAnalytics() {
      const orders = await this.getOrders();
      const menu = await this.getMenu();
      const stats = await this.getKitchenStats();
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - 86400000;

      // Filter Orders
      const todaysOrders = orders.filter(o => o.createdAt >= startOfToday);
      const yesterdaysOrders = orders.filter(o => o.createdAt >= startOfYesterday && o.createdAt < startOfToday);

      const todayRevenue = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const yesterdayRevenue = yesterdaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      // Category breakdown
      const categoryCounts: {[key: string]: number} = {};
      orders.forEach(o => {
          o.items.forEach(i => {
              categoryCounts[i.category] = (categoryCounts[i.category] || 0) + i.quantity;
          });
      });
      const categoryData = Object.keys(categoryCounts).map(cat => ({ name: cat, value: categoryCounts[cat] }));

      // Popular Item
      const itemCounts: {[key: string]: number} = {};
      orders.forEach(o => {
          o.items.forEach(i => {
              itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
          });
      });
      let popularItem = { name: 'N/A', count: 0 };
      Object.entries(itemCounts).forEach(([name, count]) => {
          if (count > popularItem.count) popularItem = { name, count };
      });

      // Ratings
      // Only show items as 'lowest rated' if they have a rating below 4.0
      const lowestRated = [...menu]
        .filter(m => m.averageRating > 0 && m.averageRating < 4.0)
        .sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0))
        .slice(0, 3);
        
      const mostReviewed = [...menu]
        .filter(m => m.totalReviews > 0)
        .sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
        .slice(0, 3);

      return {
          todayRevenue,
          yesterdayRevenue,
          todayOrders: todaysOrders.length,
          yesterdayOrders: yesterdaysOrders.length,
          kitchenLoad: stats.loadLevel,
          activeOrders: stats.activeCount,
          lowestRated,
          mostReviewed,
          revenueData: [
            { name: 'Mon', revenue: 0 }, { name: 'Tue', revenue: 0 }, 
            { name: 'Wed', revenue: 0 }, { name: 'Thu', revenue: 0 }, 
            { name: 'Fri', revenue: 0 }, { name: 'Sat', revenue: 0 }, 
            { name: 'Today', revenue: todayRevenue }
          ],
          categoryData: categoryData.length > 0 ? categoryData : [{ name: 'No Sales', value: 1 }],
          popularItem,
          peakTime: '12:00 PM'
      };
  }
}

export const db = new SupabaseService();