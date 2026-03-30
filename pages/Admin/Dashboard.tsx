import React, { useEffect, useState } from 'react';
import { db } from '../../services/supabaseService';
import { MenuItem, Order, OrderStatus, User, UserRole, FoodCategory, Coupon, DiscountType } from '../../types';
import { AreaChart, Area, PieChart, Pie, Cell, Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { LayoutDashboard, UtensilsCrossed, ChefHat, History, Ticket, Plus, Scan, DollarSign, TrendingUp, Zap, ThumbsDown, Edit, Trash2, Clock, CheckCircle, X, Image as ImageIcon, Save, ArrowRight, Star, Banknote, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kitchen' | 'menu' | 'history' | 'coupons'>('overview');
  const [analytics, setAnalytics] = useState<any>({
      todayRevenue: 0, yesterdayRevenue: 0, todayOrders: 0, revenueData: [], 
      kitchenLoad: 'Low', activeOrders: 0, lowestRated: []
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [now, setNow] = useState(Date.now());

  // Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({ name: '', price: 0, category: FoodCategory.LUNCH, description: '', image: '', isVeg: true });

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({ code: '', type: DiscountType.PERCENTAGE, value: 10, category: 'ALL', expiryDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const updateData = async () => {
      setAnalytics(await db.getAnalytics());
      setMenu(await db.getMenu());
      setCoupons(db.getCoupons()); 
      let allOrders = await db.getOrders();
      if (user.role === UserRole.SPECIALIZED_ADMIN && user.specialty) {
        allOrders = allOrders.filter(o => o.items.some(i => i.category === user.specialty));
      }
      setOrders(allOrders);
    };
    updateData();
    db.addEventListener('change', updateData);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { db.removeEventListener('change', updateData); clearInterval(interval); };
  }, [user]);

  const updateStatus = async (id: string, status: OrderStatus) => { await db.updateOrderStatus(id, status); };
  const deleteMenuItem = async (id: string) => { if (confirm('Delete?')) await db.deleteMenuItem(id); };
  const deleteCoupon = (id: string) => { if (confirm('Delete coupon?')) db.deleteCoupon(id); };

  const handleOpenMenuModal = (item?: MenuItem) => {
      setEditingItem(item || null);
      setMenuForm(item ? { ...item } : { name: '', price: 100, category: FoodCategory.LUNCH, description: '', image: 'https://picsum.photos/400/300', isVeg: true });
      setIsMenuModalOpen(true);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (editingItem) await db.updateMenuItem(editingItem.id, menuForm);
          else await db.addMenuItem(menuForm as any);
          setIsMenuModalOpen(false);
      } catch (err) { alert('Failed'); }
  };

  const handleOpenCouponModal = () => {
      setCouponForm({ code: '', type: DiscountType.PERCENTAGE, value: 10, category: 'ALL', expiryDate: new Date().toISOString().split('T')[0] });
      setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
          db.addCoupon({
              id: Math.random().toString(36).substr(2, 9),
              ...couponForm
          } as Coupon);
          setCoupons(db.getCoupons());
          setIsCouponModalOpen(false);
      } catch (err) { alert('Failed to add coupon'); }
  };

  const handleScanQR = () => {
      const orderId = prompt("QR SCANNER (SIM): Enter Order ID");
      if (!orderId) return;
      const order = orders.find(o => o.id === orderId.trim());
      if (order && order.status === OrderStatus.READY) {
          if (confirm(`Confirm Order #${order.id}?`)) updateStatus(order.id, OrderStatus.COMPLETED);
      } else { alert("Invalid or not ready."); }
  };

  // Smart Link Processor for Google Images/Drive
  const processImageLink = (url: string) => {
    if (!url) return '';
    try {
        // 1. Google Drive View Link -> Direct Link
        // Pattern: https://drive.google.com/file/d/VIDEO_ID/view...
        const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
        const driveMatch = url.match(driveRegex);
        if (driveMatch && driveMatch[1]) {
            return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
        }

        // 2. Google Search Result Link -> Actual Image URL
        // Pattern: https://www.google.com/imgres?imgurl=ACTUAL_URL...
        if (url.includes('google.com/imgres')) {
             const urlObj = new URL(url);
             const imgUrl = urlObj.searchParams.get('imgurl');
             if (imgUrl) return decodeURIComponent(imgUrl);
        }
    } catch (e) {
        console.warn('Image link processing failed, using original', e);
    }
    return url;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const processed = processImageLink(e.target.value);
      setMenuForm({...menuForm, image: processed});
  };

  const NavTab = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-bold text-sm ${
        activeTab === id 
        ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg shadow-orange-500/20' 
        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" /> <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
           <p className="text-slate-400 text-sm">Real-time canteen management system.</p>
        </div>
        <button onClick={handleScanQR} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-white/10 flex items-center hover:bg-slate-200 transition-colors">
            <Scan className="w-5 h-5 mr-2" /> Scanner
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        <NavTab id="overview" label="Overview" icon={LayoutDashboard} />
        <NavTab id="kitchen" label="Live Kitchen" icon={ChefHat} />
        <NavTab id="menu" label="Menu" icon={UtensilsCrossed} />
        <NavTab id="history" label="History" icon={History} />
        <NavTab id="coupons" label="Coupons" icon={Ticket} />
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5">
             <div className="glass-card p-6 rounded-3xl border-l-4 border-l-orange-500 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ChefHat className="w-24 h-24" /></div>
                 <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Active Orders</h3>
                 <div className="text-5xl font-bold text-white mb-2">{analytics.activeOrders}</div>
                 <div className="text-xs text-orange-400 font-bold flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> Preparing Now</div>
             </div>

             <div className="glass-card p-6 rounded-3xl border-l-4 border-l-blue-500 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="w-24 h-24" /></div>
                 <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Today's Revenue</h3>
                 <div className="text-5xl font-bold text-white mb-2">₹{analytics.todayRevenue}</div>
                 <div className="text-xs text-blue-400 font-bold">Total Sales</div>
             </div>

             <div className="glass-card p-6 rounded-3xl border-l-4 border-l-pink-500 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="w-24 h-24" /></div>
                 <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Kitchen Load</h3>
                 <div className="text-5xl font-bold text-white mb-2">{analytics.kitchenLoad}</div>
                 <div className="text-xs text-pink-400 font-bold">Pressure Level</div>
             </div>

             <div className="lg:col-span-2 glass-panel p-6 rounded-3xl min-w-0">
                  <h3 className="font-bold text-white mb-6">Revenue Analytics</h3>
                  <div className="h-[300px] w-full min-w-0 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenueData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                  </div>
             </div>

             <div className="glass-panel p-6 rounded-3xl">
                 <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                 <div className="space-y-3">
                     <button onClick={() => handleOpenMenuModal()} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-xl font-bold text-left flex items-center transition-colors">
                         <Plus className="w-5 h-5 mr-3 text-orange-500" /> Add Menu Item
                     </button>
                     <button onClick={() => { setActiveTab('coupons'); handleOpenCouponModal(); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-xl font-bold text-left flex items-center transition-colors">
                         <Ticket className="w-5 h-5 mr-3 text-pink-500" /> Create Promo
                     </button>
                 </div>
                 {analytics.lowestRated.length > 0 && (
                     <div className="mt-6 pt-6 border-t border-white/5">
                         <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center"><ThumbsDown className="w-3 h-3 mr-1" /> Low Ratings</h4>
                         {analytics.lowestRated.map((i: MenuItem) => (
                             <div key={i.id} className="text-sm text-slate-400 mb-1 flex justify-between">
                                 <span>{i.name}</span>
                                 <span className="text-red-400 font-bold">{i.averageRating?.toFixed(1)}</span>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
        </div>
      )}

      {/* KITCHEN (Kanban) */}
      {activeTab === 'kitchen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
           {[OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].map((status, idx) => (
               <div key={status} className="glass-panel rounded-3xl p-4 flex flex-col h-[70vh]">
                   <div className="flex items-center justify-between mb-4 px-2">
                       <h3 className={`font-bold ${status === OrderStatus.CONFIRMED ? 'text-blue-400' : status === OrderStatus.PREPARING ? 'text-orange-400' : 'text-green-400'}`}>{status}</h3>
                       <span className="bg-white/5 px-2 py-1 rounded text-xs font-bold text-slate-300">{orders.filter(o => o.status === status).length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                       {orders.filter(o => o.status === status).map(order => (
                           <div key={order.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                   <span className="text-xs font-mono text-slate-500">#{order.id}</span>
                                   <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{order.pickupTime}</span>
                               </div>
                               <div className="space-y-1 mb-4">
                                   {order.items.map((i, k) => (
                                       <div key={k} className="flex justify-between text-sm text-slate-200">
                                           <span>{i.name}</span>
                                           <span className="text-orange-500 font-bold">x{i.quantity}</span>
                                       </div>
                                   ))}
                               </div>

                               {/* Payment Alert for Cash Orders */}
                               {order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING' && (
                                   <div className="mt-2 mb-2 bg-red-500/10 border border-red-500/30 p-2 rounded-lg flex items-center justify-between animate-pulse">
                                       <div className="flex items-center text-red-400 text-xs font-bold uppercase">
                                           <Banknote className="w-4 h-4 mr-1.5" /> Collect Cash
                                       </div>
                                       <div className="text-white font-bold text-sm">₹{order.totalAmount}</div>
                                   </div>
                               )}
                               
                               <button 
                                 onClick={() => updateStatus(order.id, status === OrderStatus.CONFIRMED ? OrderStatus.PREPARING : status === OrderStatus.PREPARING ? OrderStatus.READY : OrderStatus.COMPLETED)}
                                 className={`w-full py-2 rounded-xl text-xs font-bold text-white transition-colors ${status === OrderStatus.CONFIRMED ? 'bg-blue-600 hover:bg-blue-500' : status === OrderStatus.PREPARING ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'}`}
                               >
                                   {status === OrderStatus.CONFIRMED ? 'Start Cooking' : status === OrderStatus.PREPARING ? 'Mark Ready' : 'Complete'}
                               </button>
                           </div>
                       ))}
                       {orders.filter(o => o.status === status).length === 0 && (
                           <div className="text-center py-10 text-slate-600 text-xs uppercase tracking-widest font-bold">Empty</div>
                       )}
                   </div>
               </div>
           ))}
        </div>
      )}

      {/* MENU LIST */}
      {activeTab === 'menu' && (
          <div className="glass-panel rounded-3xl overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-white">Menu Items</h3>
                  <button onClick={() => handleOpenMenuModal()} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Item</button>
              </div>
              <div className="divide-y divide-white/5">
                  {menu.map(item => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center space-x-4">
                              <img src={item.image} className="w-16 h-16 rounded-xl object-cover bg-slate-800" alt={item.name} />
                              <div>
                                  <h4 className="font-bold text-slate-200">{item.name}</h4>
                                  <div className="flex items-center mt-1 space-x-2 text-xs">
                                     <span className="text-slate-400">₹{item.price}</span>
                                     <span className={`px-1.5 py-0.5 rounded font-bold ${item.isVeg ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.isVeg ? 'VEG' : 'NV'}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="flex space-x-2">
                              <button onClick={() => handleOpenMenuModal(item)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => deleteMenuItem(item.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      {/* HISTORY TABLE */}
      {activeTab === 'history' && (
          <div className="glass-panel rounded-3xl overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-white/5"><h3 className="font-bold text-white">Past Orders</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400 font-bold uppercase text-xs">
                        <tr><th className="p-4">ID</th><th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Payment</th><th className="p-4">Date</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orders.filter(o => o.status === OrderStatus.COMPLETED).map(order => (
                            <tr key={order.id} className="hover:bg-white/5">
                                <td className="p-4 font-mono text-slate-500">#{order.id}</td>
                                <td className="p-4 text-slate-300">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                                <td className="p-4 font-bold text-white">₹{order.totalAmount}</td>
                                <td className="p-4">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${order.paymentMethod === 'CASH' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {order.paymentMethod || 'Online'}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
          <div className="glass-panel rounded-3xl overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-white">Active Coupons</h3>
                  <button onClick={handleOpenCouponModal} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Coupon</button>
              </div>
              <div className="divide-y divide-white/5">
                  {coupons.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 font-bold text-sm uppercase tracking-widest">No active coupons</div>
                  ) : coupons.map(coupon => (
                      <div key={coupon.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                                  <Ticket className="w-6 h-6" />
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-200 uppercase tracking-wider">{coupon.code}</h4>
                                  <div className="flex items-center mt-1 space-x-2 text-xs">
                                     <span className="text-slate-400">
                                         {coupon.type === DiscountType.PERCENTAGE ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                     </span>
                                     <span className="bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-bold">Valid till {coupon.expiryDate}</span>
                                     {coupon.category !== 'ALL' && <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold">{coupon.category}</span>}
                                  </div>
                              </div>
                          </div>
                          <button onClick={() => { deleteCoupon(coupon.id); setCoupons(db.getCoupons()); }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* MENU MODAL */}
      {isMenuModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="glass-panel w-full max-w-lg rounded-3xl p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-white">{editingItem ? 'Edit Item' : 'New Item'}</h3>
                      <button onClick={() => setIsMenuModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                  </div>
                  <form onSubmit={handleMenuSubmit} className="space-y-4">
                      <input type="text" placeholder="Name" required className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Price" required className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: Number(e.target.value)})} />
                          <select className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value as any})}>
                              {Object.values(FoodCategory).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <textarea placeholder="Description" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" value={menuForm.description} onChange={e => setMenuForm({...menuForm, description: e.target.value})} />
                      
                      {/* Smart Image Input */}
                      <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Image URL (Paste Google Drive or Direct Link)" 
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all" 
                            value={menuForm.image} 
                            onChange={handleImageChange} 
                        />
                        {menuForm.image && (
                            <div className="w-full h-32 bg-slate-800 rounded-xl overflow-hidden relative border border-white/5 group">
                                <img src={menuForm.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs text-slate-500 bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Image Preview</span>
                                </div>
                            </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 pt-2">
                          <button type="button" onClick={() => setMenuForm({...menuForm, isVeg: !menuForm.isVeg})} className={`w-10 h-6 rounded-full transition-colors ${menuForm.isVeg ? 'bg-green-500' : 'bg-slate-700'}`}><div className={`w-4 h-4 bg-white rounded-full transform transition-transform ml-1 mt-1 ${menuForm.isVeg ? 'translate-x-4' : ''}`} /></button>
                          <span className="text-sm font-bold text-slate-300">Vegetarian?</span>
                      </div>
                      <div className="pt-4 flex space-x-3">
                          <button type="button" onClick={() => setIsMenuModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5">Cancel</button>
                          <button type="submit" className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-200">Save</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* COUPON MODAL */}
      {isCouponModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="glass-panel w-full max-w-lg rounded-3xl p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-white">New Coupon</h3>
                      <button onClick={() => setIsCouponModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                  </div>
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                      <input type="text" placeholder="Coupon Code (e.g. SAVE20)" required className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 uppercase" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
                      <div className="grid grid-cols-2 gap-4">
                          <select className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value as DiscountType})}>
                              <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                              <option value={DiscountType.FLAT}>Flat Amount (₹)</option>
                          </select>
                          <input type="number" placeholder="Value" required min="1" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: Number(e.target.value)})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <select className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" value={couponForm.category} onChange={e => setCouponForm({...couponForm, category: e.target.value as any})}>
                              <option value="ALL">All Categories</option>
                              {Object.values(FoodCategory).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input type="date" required className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" value={couponForm.expiryDate} onChange={e => setCouponForm({...couponForm, expiryDate: e.target.value})} />
                      </div>
                      <div className="pt-4 flex space-x-3">
                          <button type="button" onClick={() => setIsCouponModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5">Cancel</button>
                          <button type="submit" className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-200">Create Coupon</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;