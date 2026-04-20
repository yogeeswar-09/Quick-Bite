import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/supabaseService';
import { CartItem, PickupSlot } from '../../types';
import RazorpayCheckout from '../../components/RazorpayCheckout';
import { Trash2, Plus, Minus, CreditCard, Clock, ChevronRight, ShoppingBag, Tag, X, AlertTriangle, Flame, Info, Check, Smartphone, QrCode, Banknote, ShieldCheck, Building, Star } from 'lucide-react';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [kitchenLoad, setKitchenLoad] = useState({ level: 'Low', extraDelay: 0 });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState({ text: '', isError: false });
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH' | 'RAZORPAY'>('RAZORPAY');
  const [showRazorpay, setShowRazorpay] = useState(false);

  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const user = db.getCurrentUser();
      if (!user) {
        setCart([]);
        return;
      }
      const stored = localStorage.getItem(`qb_cart_${user.id}`);
      if (stored) setCart(JSON.parse(stored));
      else setCart([]);
      
      const fetchedSlots = await db.getSlots();
      setSlots(fetchedSlots);
      
      const stats = await db.getKitchenStats();
      setKitchenLoad({ level: stats.loadLevel, extraDelay: stats.extraDelay });

    } catch (e) {
      console.error("Failed to load cart", e);
      setCart([]);
    }
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('storage', loadCart);
    window.addEventListener('cart-updated', loadCart);
    return () => {
      window.removeEventListener('storage', loadCart);
      window.removeEventListener('cart-updated', loadCart);
    };
  }, []);

  const updateQty = (id: string, delta: number) => {
    if (!user) return;
    const newCart = cart.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCart(newCart);
    localStorage.setItem(`qb_cart_${user.id}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
    if (appliedCode) {
      setAppliedCode(null);
      setDiscount(0);
      setCouponMsg({ text: 'Cart modified, please re-apply coupon.', isError: true });
    }
  };

  const remove = (id: string) => {
    if (!user) return;
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem(`qb_cart_${user.id}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
    if (appliedCode) {
      setAppliedCode(null);
      setDiscount(0);
      setCouponMsg({ text: '', isError: false });
    }
  };

  const user = db.getCurrentUser();

  const getEffectivePrice = (price: number) => {
      if (user?.activeReward === '50_OFF' && price > 50) return price - 50;
      return price;
  };

  const subtotal = cart.reduce((acc, item) => acc + (getEffectivePrice(item.price) * item.quantity), 0);
  const tax = Math.round(subtotal * 0.02);
  const finalTotal = Math.max(0, subtotal + tax - discount);
  const pointsToEarn = Math.floor(finalTotal / 10);

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const result = db.validateCoupon(couponCode, cart);
    if (result.valid) {
      setDiscount(result.discount);
      setAppliedCode(couponCode);
      setCouponMsg({ text: result.message, isError: false });
    } else {
      setDiscount(0);
      setAppliedCode(null);
      setCouponMsg({ text: result.message, isError: true });
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setAppliedCode(null);
    setCouponMsg({ text: '', isError: false });
  };

  const handleCheckoutClick = () => {
    if (!selectedSlot) {
        setError('Please select a pickup time slot.');
        return;
    }
    setError('');
    setShowPaymentModal(true);
  };

  // Triggered by "Pay" button inside the modal
  const handlePaymentInitiation = () => {
    if (paymentMethod === 'RAZORPAY') {
        setShowPaymentModal(false);
        setShowRazorpay(true);
    } else {
        finalizeOrder();
    }
  };

  // Called after simulation success or directly for Cash/Simulated Card
  const finalizeOrder = async () => {
    setPaying(true);
    try {
      if (!user) throw new Error("Session expired. Please login again.");
      
      // Simulate Payment Delay based on method (if not razorpay)
      if (paymentMethod !== 'RAZORPAY') {
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      await db.createOrder(cart, finalTotal, selectedSlot!, discount, appliedCode || undefined, paymentMethod);
      localStorage.removeItem(`qb_cart_${user.id}`);
      setCart([]);
      window.dispatchEvent(new Event('cart-updated'));
      navigate('/orders');
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setPaying(false);
      setShowPaymentModal(false);
      setShowRazorpay(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl shadow-black/50 mb-6 border border-slate-800">
          <ShoppingBag className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 max-w-md">Looks like you haven't added anything yet.</p>
        <button 
            onClick={() => navigate('/menu')} 
            className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-all flex items-center"
        >
          Browse Menu <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
      
      {/* Razorpay Simulation Modal */}
      {showRazorpay && (
        <RazorpayCheckout 
            amount={finalTotal}
            user={db.getCurrentUser()}
            orderId={`ord_${Date.now()}`}
            onSuccess={(paymentId) => {
                // Handle successful payment
                finalizeOrder();
            }}
            onFailure={(err) => {
                setShowRazorpay(false);
                setShowPaymentModal(true);
                setError('Payment failed or cancelled.');
            }}
            onClose={() => {
                setShowRazorpay(false);
                setShowPaymentModal(true);
            }}
        />
      )}

      {/* Internal Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px] md:h-auto border border-white/10">
            {/* Sidebar Methods */}
            <div className="w-full md:w-1/3 bg-slate-950/80 p-4 border-r border-white/5 space-y-2">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 px-2">Payment Method</h3>
                
                <button onClick={() => setPaymentMethod('RAZORPAY')} className={`w-full flex items-center p-3 rounded-xl transition-all font-bold text-sm ${paymentMethod === 'RAZORPAY' ? 'bg-[#3395ff] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    <ShieldCheck className="w-5 h-5 mr-3" /> Razorpay
                </button>
                
                <button onClick={() => setPaymentMethod('UPI')} className={`w-full flex items-center p-3 rounded-xl transition-all font-bold text-sm ${paymentMethod === 'UPI' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    <QrCode className="w-5 h-5 mr-3" /> UPI / QR
                </button>
                <button onClick={() => setPaymentMethod('CARD')} className={`w-full flex items-center p-3 rounded-xl transition-all font-bold text-sm ${paymentMethod === 'CARD' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    <CreditCard className="w-5 h-5 mr-3" /> Card
                </button>
                <button onClick={() => setPaymentMethod('CASH')} className={`w-full flex items-center p-3 rounded-xl transition-all font-bold text-sm ${paymentMethod === 'CASH' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    <Banknote className="w-5 h-5 mr-3" /> Pay at Counter
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-slate-900/30">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {paymentMethod === 'RAZORPAY' ? 'Secure Checkout' : paymentMethod === 'UPI' ? 'Scan & Pay' : paymentMethod === 'CARD' ? 'Card Details' : 'Pay at Counter'}
                        </h2>
                        <p className="text-slate-400 text-sm">Amount to pay: <span className="text-white font-bold">₹{finalTotal}</span></p>
                        </div>
                        <button onClick={() => !paying && setShowPaymentModal(false)} disabled={paying} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {paymentMethod === 'RAZORPAY' && (
                        <div className="flex flex-col items-center justify-center py-4 animate-in zoom-in-95 duration-300 text-center">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                                <ShieldCheck className="w-10 h-10 text-blue-500" />
                            </div>
                            <p className="text-slate-300 text-sm mb-4">You will be redirected to the secure Razorpay payment gateway to complete your purchase.</p>
                            <div className="flex space-x-3 text-slate-500">
                                <CreditCard className="w-5 h-5" />
                                <Smartphone className="w-5 h-5" />
                                <Building className="w-5 h-5" />
                            </div>
                        </div>
                    )}

                    {paymentMethod === 'UPI' && (
                        <div className="flex flex-col items-center justify-center py-4 animate-in zoom-in-95 duration-300">
                            <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=quickbite@upi&pn=QuickBite&am=${finalTotal}`} alt="UPI QR" className="w-48 h-48 mix-blend-multiply" />
                            </div>
                            <p className="text-sm text-slate-400 flex items-center font-medium"><Smartphone className="w-4 h-4 mr-2 text-orange-500" /> Scan with any UPI App</p>
                        </div>
                    )}

                    {paymentMethod === 'CARD' && (
                        <div className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Card Number</label>
                                <div className="relative">
                                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white outline-none focus:border-orange-500 font-mono transition-colors focus:bg-slate-900" />
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Expiry</label>
                                    <input type="text" placeholder="MM/YY" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 font-mono transition-colors focus:bg-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">CVV</label>
                                    <input type="password" placeholder="123" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 font-mono transition-colors focus:bg-slate-900" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Name on Card</label>
                                <input type="text" placeholder="John Doe" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-colors focus:bg-slate-900" />
                            </div>
                        </div>
                    )}

                    {paymentMethod === 'CASH' && (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                <Check className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Pay on Pickup</h3>
                            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">Your order will be placed immediately. Please pay <span className="text-white font-bold">₹{finalTotal}</span> at the counter when you pick up your food.</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handlePaymentInitiation}
                    disabled={paying}
                    className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center active:scale-[0.98] ${
                        paymentMethod === 'RAZORPAY' 
                        ? 'bg-[#3395ff] hover:bg-[#2b7ac9] shadow-blue-500/20' 
                        : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 shadow-orange-500/20'
                    }`}
                >
                    {paying ? (
                        <>Processing <span className="ml-3 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                    ) : (
                        `Pay ₹${finalTotal}`
                    )}
                </button>
            </div>
            </div>
        </div>
      )}

      <div className="lg:col-span-2 space-y-6">
        
        {/* Kitchen Status Alert */}
        {kitchenLoad.level !== 'Low' && (
          <div className="glass-panel p-4 rounded-2xl flex items-start space-x-4 border-l-4 border-l-orange-500">
             <div className="p-2 bg-orange-500/10 rounded-full">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
             </div>
             <div>
               <h3 className="font-bold text-slate-200">High Demand Alert</h3>
               <p className="text-sm text-slate-400">
                 Kitchen is busy. Expect +{kitchenLoad.extraDelay} mins delay.
               </p>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Order Summary</h1>
            <span className="text-slate-500 text-sm font-medium">{cart.length} items</span>
        </div>
        
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.id} className="glass-card p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
              <div className="flex items-center space-x-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover shadow-lg" />
                <div>
                  <h3 className="font-bold text-white text-lg">{item.name}</h3>
                  {user?.activeReward === '50_OFF' && item.price > 50 ? (
                      <div className="flex items-center space-x-2">
                          <span className="text-slate-500 line-through text-xs">₹{item.price}</span>
                          <span className="text-orange-400 font-bold">₹{getEffectivePrice(item.price)}</span>
                      </div>
                  ) : (
                      <p className="text-sm text-orange-400 font-bold">₹{item.price}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 md:space-x-8">
                <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-white/5">
                  <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-2 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => remove(item.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="glass-panel rounded-3xl p-6 sticky top-24 shadow-2xl shadow-black/50">
          <div className="border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white">Checkout</h2>
              <p className="text-slate-500 text-xs mt-1">Order ID: #{Math.floor(Math.random()*10000)}</p>
          </div>
          
          {/* Pickup Slot */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Pickup Time</label>
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

          {/* Coupon */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Promo Code</label>
            {!appliedCode ? (
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none transition-colors focus:bg-slate-900"
                />
                <button onClick={applyCoupon} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">Apply</button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center text-green-400 text-sm font-bold">
                  <Check className="w-4 h-4 mr-2" /> {appliedCode}
                </div>
                <button onClick={removeCoupon}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
              </div>
            )}
            {couponMsg.text && (
               <p className={`text-xs font-bold mt-2 ${couponMsg.isError ? 'text-red-400' : 'text-green-400'}`}>{couponMsg.text}</p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-3 mb-8 bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {user?.activeReward === '50_OFF' && (
              <div className="flex justify-between text-pink-400 text-xs font-bold">
                <span>Reward Applied</span>
                <span>₹50 Off Items &gt; ₹50</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Tax (2%)</span>
              <span>₹{tax}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400 text-sm font-bold">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/5 mt-2">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
            <div className="flex justify-between text-orange-400 text-xs font-bold pt-2 border-t border-white/5 mt-2">
              <span className="flex items-center"><Star className="w-3 h-3 mr-1 fill-current" /> Points to Earn</span>
              <span>+{pointsToEarn} pts</span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400 text-xs font-bold animate-in shake">
              <AlertTriangle className="w-4 h-4 mr-2" /> {error}
            </div>
          )}

          <button
            onClick={handleCheckoutClick}
            disabled={paying}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">Pay Securely <CreditCard className="w-4 h-4" /></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;