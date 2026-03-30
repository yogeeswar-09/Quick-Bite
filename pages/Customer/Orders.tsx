import React, { useEffect, useState } from 'react';
import { db } from '../../services/supabaseService';
import { Order, OrderStatus } from '../../types';
import { CheckCircle, Clock, Package, Hourglass, Utensils, Flame, Star, MessageSquare, Banknote, CreditCard } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  
  // Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = async () => {
    const user = db.getCurrentUser();
    if (user) {
      const data = await db.getOrdersForUser(user.id);
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const handleDbChange = () => fetchOrders();
    db.addEventListener('change', handleDbChange);
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
        db.removeEventListener('change', handleDbChange);
        clearInterval(timerInterval);
    };
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case OrderStatus.PREPARING: return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case OrderStatus.READY: return 'text-green-400 bg-green-500/10 border-green-500/20';
      case OrderStatus.COMPLETED: return 'text-slate-400 bg-slate-800/50 border-white/5';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED: return <CheckCircle className="w-4 h-4 mr-2" />;
      case OrderStatus.PREPARING: return <Utensils className="w-4 h-4 mr-2 animate-pulse" />;
      case OrderStatus.READY: return <Package className="w-4 h-4 mr-2" />;
      case OrderStatus.COMPLETED: return <CheckCircle className="w-4 h-4 mr-2" />;
    }
  };

  const calculateProgress = (order: Order) => {
      if (order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED) return 100;
      if (order.status === OrderStatus.CONFIRMED) return 5; 
      if (!order.targetTime || !order.prepStartTime) return 0;
      const totalDuration = order.targetTime - order.prepStartTime;
      const elapsed = now - order.prepStartTime;
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const getCountdown = (order: Order) => {
      if (order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED) return "00:00";
      if (!order.targetTime) return "--:--";
      const remainingMs = Math.max(0, order.targetTime - now);
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isAlmostReady = (order: Order) => {
    if (!order.targetTime || order.status !== OrderStatus.PREPARING) return false;
    const remainingMs = order.targetTime - now;
    return remainingMs > 0 && remainingMs < 2 * 60 * 1000; 
  };

  const handleSubmitRating = async () => {
      if (!ratingOrder) return;
      setSubmittingReview(true);
      const user = db.getCurrentUser();
      for (const item of ratingOrder.items) {
          await db.addReview({
              menuItemId: item.id,
              orderId: ratingOrder.id,
              userId: user?.id || 'anon',
              rating: ratings[item.id] || 5,
              comment: comments[item.id] || ''
          });
      }
      setSubmittingReview(false);
      setRatingOrder(null);
  };

  if (loading) return <div className="text-center p-8 text-slate-400">Loading Orders...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <h1 className="text-3xl font-bold text-white mb-8">My Orders</h1>

      {orders.length === 0 && (
        <div className="glass-panel p-16 text-center rounded-3xl">
          <Clock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No past orders found.</p>
        </div>
      )}

      {orders.map(order => {
        const isActive = order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING;
        const progress = calculateProgress(order);

        return (
            <div key={order.id} className="glass-card rounded-3xl overflow-hidden shadow-2xl shadow-black/30 hover:shadow-orange-500/5 transition-all duration-300 group">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/40">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Order ID</p>
                  <p className="text-sm font-mono text-slate-300">#{order.id}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border flex items-center text-xs font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                   {getStatusIcon(order.status)}
                   {order.status}
                </div>
            </div>

            {/* Live Progress Bar */}
            {isActive && (
                <div className="bg-slate-950/50 px-6 py-6 border-b border-white/5 relative">
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center">
                            {order.status === OrderStatus.CONFIRMED ? 'Waiting for confirmation...' : 
                             isAlmostReady(order) ? 'Final Touches' : 'Preparation In Progress'}
                        </span>
                        <span className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
                            {order.status === OrderStatus.CONFIRMED ? '--:--' : getCountdown(order)}
                        </span>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(249,115,22,0.6)] ${
                                isAlmostReady(order) 
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
                                : 'bg-gradient-to-r from-orange-500 to-pink-500'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-900/30 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center">
                           <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center mr-3">
                              {item.quantity}
                           </span>
                           <span className="text-slate-300 text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-white text-sm font-bold">₹{item.price * item.quantity}</span>
                    </li>
                    ))}
                </ul>
                <div className="pt-4 flex justify-between items-center border-t border-white/5 mt-2">
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Total Amount</span>
                        <span className="font-bold text-white text-lg">₹{Math.round(order.totalAmount * 1.05)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
                        {order.paymentMethod === 'CASH' ? <Banknote className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-blue-400" />}
                        <span className={`text-xs font-bold uppercase ${order.paymentStatus === 'PENDING' ? 'text-orange-400' : 'text-green-400'}`}>
                            {order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING' ? 'Pay Counter' : 'Paid'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                     {order.status === OrderStatus.COMPLETED && !order.isRated && (
                        <button 
                            onClick={() => { setRatingOrder(order); const i: any = {}; order.items.forEach(x => i[x.id] = 5); setRatings(i); }}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all border border-white/10"
                        >
                            <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" /> Rate
                        </button>
                    )}
                    {order.isRated && (
                        <span className="text-green-500 text-xs font-bold flex items-center bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" /> Reviewed
                        </span>
                    )}
                </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
                   <div className={`${order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED ? 'opacity-100' : 'opacity-20 blur-sm'} transition-all duration-500`}>
                       <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}`}
                           alt="QR"
                           className="w-32 h-32 mix-blend-multiply"
                       />
                   </div>
                   <p className="mt-3 text-[10px] text-slate-900 font-bold uppercase tracking-widest text-center">
                       {order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED 
                        ? 'Scan for Pickup' 
                        : 'Generating...'}
                   </p>
                </div>
            </div>
            </div>
        );
      })}

      {/* Review Modal */}
      {ratingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-white/5">
                      <h2 className="text-xl font-bold text-white">Rate your experience</h2>
                      <p className="text-slate-400 text-xs">Help us improve Quick Bite.</p>
                  </div>
                  
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                      {ratingOrder.items.map(item => (
                          <div key={item.id} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
                              <h3 className="font-bold text-white mb-2">{item.name}</h3>
                              <div className="flex space-x-2 mb-3">
                                  {[1, 2, 3, 4, 5].map(star => (
                                      <button
                                        key={star}
                                        onClick={() => setRatings(prev => ({ ...prev, [item.id]: star }))}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                      >
                                          <Star className={`w-8 h-8 ${ (ratings[item.id] || 0) >= star ? 'text-yellow-500 fill-current' : 'text-slate-700'}`} />
                                      </button>
                                  ))}
                              </div>
                              <textarea 
                                placeholder="Any comments?"
                                value={comments[item.id] || ''}
                                onChange={(e) => setComments(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none"
                                rows={2}
                              />
                          </div>
                      ))}
                  </div>

                  <div className="p-6 border-t border-white/5 flex space-x-3">
                      <button onClick={() => setRatingOrder(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5">Cancel</button>
                      <button 
                        onClick={handleSubmitRating}
                        disabled={submittingReview}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 shadow-lg"
                      >
                          Submit Review
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrdersPage;