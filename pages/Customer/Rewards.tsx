import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/supabaseService';
import { Order, PickupSlot } from '../../types';
import { Star, Gift, Clock, Coffee, Ticket, X } from 'lucide-react';

const RewardsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = db.getCurrentUser();

  useEffect(() => {
    if (user) {
      db.getOrdersForUser(user.id).then(setOrders);
    }
  }, [user]);

  const handleOpenRedeem = async () => {
      const availableSlots = await db.getSlots();
      setSlots(availableSlots);
      setShowRedeemModal(true);
  };

  const handleConfirmRedeem = async () => {
      if (!selectedSlot) {
          setError('Please select a pickup time.');
          return;
      }
      setRedeeming(true);
      setError('');
      try {
          const menu = await db.getMenu();
          const coffee = menu.find(m => m.name.toLowerCase().includes('cold coffee') || m.name.toLowerCase().includes('coffee'));
          if (!coffee) throw new Error("Cold Coffee is currently unavailable.");
          
          await db.createRewardOrder(500, coffee, selectedSlot);
          setShowRedeemModal(false);
          navigate('/orders');
      } catch (e: any) {
          setError(e.message || 'Failed to redeem reward.');
      }
      setRedeeming(false);
  };

  const handleConfirmDiscount = async () => {
      setRedeeming(true);
      setError('');
      try {
          await db.activate50OffReward();
          setShowDiscountModal(false);
          navigate('/menu');
      } catch (e: any) {
          setError(e.message || 'Failed to activate discount.');
      }
      setRedeeming(false);
  };

  if (!user) return null;

  const points = user.points || 0;
  const nextTier = 500;
  const progress = Math.min(100, (points / nextTier) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Header */}
       <div className="glass-panel rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl shadow-black/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-pink-500"></div>
          <Star className="w-16 h-16 text-yellow-500 fill-current mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          <h1 className="text-3xl font-bold text-white mb-2">My Rewards</h1>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-6">
              {points} <span className="text-xl text-slate-400 font-bold">pts</span>
          </div>

          {/* Progress */}
          <div className="max-w-md mx-auto text-left">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  <span>Current</span>
                  <span>{nextTier} pts Goal</span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      style={{ width: `${progress}%` }}
                  />
              </div>
              <p className="text-center text-sm text-slate-400 mt-3">
                  {points >= nextTier ? "You've reached the goal! Redeem a reward below." : `${nextTier - points} more points to your next free reward.`}
              </p>
          </div>
       </div>

       {/* Rewards Catalog */}
       <div>
           <h2 className="text-xl font-bold text-white mb-4 flex items-center"><Gift className="w-5 h-5 mr-2 text-pink-500" /> Redeem Points</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                   <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                           <Coffee className="w-6 h-6 text-orange-400" />
                       </div>
                       <div>
                           <h3 className="font-bold text-white">Free Cold Coffee</h3>
                           <p className="text-sm text-slate-400">500 pts</p>
                       </div>
                   </div>
                   <button onClick={handleOpenRedeem} disabled={points < 500} className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500 hover:text-white transition-colors">
                       Redeem
                   </button>
               </div>
               <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-pink-500/30 transition-all">
                   <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                           <Ticket className="w-6 h-6 text-pink-400" />
                       </div>
                       <div>
                           <h3 className="font-bold text-white">₹50 Off Coupon</h3>
                           <p className="text-sm text-slate-400">1000 pts</p>
                       </div>
                   </div>
                   <button onClick={() => setShowDiscountModal(true)} disabled={points < 1000 || user.activeReward === '50_OFF'} className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-500 hover:text-white transition-colors">
                       {user.activeReward === '50_OFF' ? 'Active' : 'Redeem'}
                   </button>
               </div>
           </div>
       </div>

       {/* History */}
       <div>
           <h2 className="text-xl font-bold text-white mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-slate-400" /> Points History</h2>
           <div className="glass-panel rounded-3xl overflow-hidden">
               {orders.filter(o => o.earnedPoints && o.earnedPoints > 0).length === 0 ? (
                   <div className="p-8 text-center text-slate-500">No points history yet. Place an order to earn points!</div>
               ) : (
                   <div className="divide-y divide-white/5">
                       {orders.filter(o => o.earnedPoints && o.earnedPoints > 0).map(order => (
                           <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                               <div>
                                   <p className="font-bold text-white text-sm">Order #{order.id}</p>
                                   <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                               </div>
                               <div className="flex items-center text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20">
                                   +{order.earnedPoints} pts
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       </div>

       {/* Redeem Modal */}
       {showRedeemModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                   <div className="p-6 border-b border-white/5 flex justify-between items-center">
                       <h2 className="text-xl font-bold text-white">Redeem Reward</h2>
                       <button onClick={() => setShowRedeemModal(false)} className="text-slate-400 hover:text-white">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <div className="p-6 space-y-6">
                       <div className="text-center">
                           <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                               <Coffee className="w-8 h-8 text-orange-400" />
                           </div>
                           <h3 className="text-lg font-bold text-white">Free Cold Coffee</h3>
                           <p className="text-sm text-slate-400 mt-1">This will deduct 500 points from your balance.</p>
                       </div>

                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Select Pickup Time</label>
                           <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                               {slots.filter(s => s.available).map(slot => (
                                   <button
                                       key={slot.id}
                                       onClick={() => { setSelectedSlot(slot.id); setError(''); }}
                                       className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                                           selectedSlot === slot.id 
                                           ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                                           : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'
                                       }`}
                                   >
                                       {slot.time}
                                   </button>
                               ))}
                           </div>
                       </div>

                       {error && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                               {error}
                           </div>
                       )}
                   </div>

                   <div className="p-6 border-t border-white/5">
                       <button 
                           onClick={handleConfirmRedeem}
                           disabled={redeeming}
                           className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 shadow-lg disabled:opacity-50 flex justify-center items-center"
                       >
                           {redeeming ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm & Place Order'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Discount Modal */}
       {showDiscountModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                   <div className="p-6 border-b border-white/5 flex justify-between items-center">
                       <h2 className="text-xl font-bold text-white">Activate Discount</h2>
                       <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-white">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <div className="p-6 space-y-6">
                       <div className="text-center">
                           <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                               <Ticket className="w-8 h-8 text-pink-400" />
                           </div>
                           <h3 className="text-lg font-bold text-white">₹50 Off Everything</h3>
                           <p className="text-sm text-slate-400 mt-2">
                               This will deduct 1000 points. All items over ₹50 will be discounted by ₹50 on your next order.
                           </p>
                       </div>

                       {error && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                               {error}
                           </div>
                       )}
                   </div>

                   <div className="p-6 border-t border-white/5">
                       <button 
                           onClick={handleConfirmDiscount}
                           disabled={redeeming}
                           className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-lg disabled:opacity-50 flex justify-center items-center"
                       >
                           {redeeming ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Activate Now'}
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default RewardsPage;
