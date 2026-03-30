import React, { useState, useEffect } from 'react';
import { db } from '../../services/supabaseService';
import { MenuItem, FoodCategory, CartItem } from '../../types';
import { Plus, Star, Clock, X, Heart, Sparkles, Smile, Frown, Coffee, Flame, ChevronRight } from 'lucide-react';
import { getMealSuggestion } from '../../services/geminiService';

const MoodEmoji = ({ mood, icon, onClick, active }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl transition-all duration-300 transform ${
      active 
        ? 'bg-gradient-to-br from-orange-500 to-pink-600 scale-110 shadow-lg shadow-orange-500/40' 
        : 'bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10'
    }`}
  >
    <div className="text-4xl mb-2 filter drop-shadow-md">{icon}</div>
    <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{mood}</span>
  </button>
);

const MenuPage: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'All'>('All');
  const [showMoodModal, setShowMoodModal] = useState(false); // Default to false now, opened by Hero button
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{name: string, reason: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
        const data = await db.getMenu();
        setMenu(data);
        setLoading(false);
    };
    fetchMenu();
    db.addEventListener('change', fetchMenu);
    return () => db.removeEventListener('change', fetchMenu);
  }, []);

  const addToCart = (item: MenuItem) => {
    const cart: CartItem[] = JSON.parse(localStorage.getItem('qb_cart') || '[]');
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    localStorage.setItem('qb_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    
    // Custom Toast Logic
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-green-500/30 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-green-900/20 text-sm font-bold z-[100] flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5';
    toast.innerHTML = `<div class="bg-green-500 rounded-full p-1"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div><span>Added ${item.name} to cart</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-5');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const handleMoodSubmit = async () => {
    if (!selectedMood) return;
    setAiLoading(true);
    try {
      const user = db.getCurrentUser();
      const pastOrders = user ? await db.getOrdersForUser(user.id) : [];
      const prompt = `I am feeling ${selectedMood}. Suggest a comfort food from the menu that matches this mood perfectly.`;
      const result = await getMealSuggestion(prompt, menu, pastOrders);
      if (result.suggestedItemName) {
        setSuggestion({ name: result.suggestedItemName, reason: result.reason });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredMenu = selectedCategory === 'All' 
    ? menu 
    : menu.filter(m => m.category === selectedCategory);

  if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
         <div className="w-10 h-10 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
  );

  return (
    <div className="pb-24">
      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowMoodModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!suggestion ? (
              <div className="p-8 text-center">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-orange-500/20">AI Chef</span>
                    <h2 className="text-3xl font-bold text-white mb-2">Current Vibe?</h2>
                    <p className="text-slate-400 text-sm">Let Chef Byte pick the perfect meal for you.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <MoodEmoji mood="Happy" icon="😄" active={selectedMood === 'Happy'} onClick={() => setSelectedMood('Happy')} />
                  <MoodEmoji mood="Cozy" icon="🧸" active={selectedMood === 'Cozy'} onClick={() => setSelectedMood('Cozy')} />
                  <MoodEmoji mood="Stressed" icon="😫" active={selectedMood === 'Stressed'} onClick={() => setSelectedMood('Stressed')} />
                  <MoodEmoji mood="Hungry" icon="🤤" active={selectedMood === 'Hungry'} onClick={() => setSelectedMood('Hungry')} />
                </div>

                <button
                  onClick={handleMoodSubmit}
                  disabled={!selectedMood || aiLoading}
                  className="w-full bg-white text-slate-900 hover:bg-slate-200 disabled:opacity-50 font-bold py-4 rounded-xl shadow-lg shadow-white/10 transition-all flex items-center justify-center text-sm"
                >
                  {aiLoading ? (
                    <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                  ) : (
                    <>Find My Food <Sparkles className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                 <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 text-5xl animate-bounce">
                    👨‍🍳
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Chef Byte Says:</h3>
                 <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-6">
                    <h4 className="font-bold text-orange-400 text-xl mb-2">{suggestion.name}</h4>
                    <p className="text-slate-300 text-sm italic leading-relaxed">"{suggestion.reason}"</p>
                 </div>
                 <button
                    onClick={() => {
                        const item = menu.find(m => m.name === suggestion!.name);
                        if (item) addToCart(item);
                        setShowMoodModal(false);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all"
                 >
                    Order Now - {menu.find(m => m.name === suggestion!.name)?.price ? `₹${menu.find(m => m.name === suggestion!.name)?.price}` : ''}
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 mb-12 min-h-[400px] flex items-center shadow-2xl shadow-black/50 border border-white/5 group">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80" 
               className="w-full h-full object-cover opacity-60 transition-transform duration-[10s] group-hover:scale-110" 
               alt="Background" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
          </div>

          <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-6 animate-in fade-in slide-in-from-bottom-4">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Kitchen Open Now</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  Taste the <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Comfort.</span>
              </h1>
              
              <p className="text-slate-300 text-lg mb-8 max-w-md leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
                  Delicious meals prepared fresh daily. From spicy wraps to crispy snacks, we have your cravings covered.
              </p>
              
              <div className="flex space-x-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
                  <button 
                    onClick={() => {
                        setSuggestion(null);
                        setSelectedMood(null);
                        setShowMoodModal(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/25 transition-all transform hover:scale-105 flex items-center"
                  >
                      <Sparkles className="w-5 h-5 mr-2" /> AI Foodie Helper
                  </button>
                  <button 
                    onClick={() => document.getElementById('menu-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-xl font-bold transition-all flex items-center"
                  >
                      View Menu
                  </button>
              </div>
          </div>
      </div>

      {/* Category Navigation */}
      <div className="mb-10 sticky top-20 z-40 bg-slate-950/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-white/5">
        <div className="flex space-x-3 overflow-x-auto no-scrollbar max-w-7xl mx-auto">
          {['All', ...Object.values(FoodCategory)].map(cat => (
            <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                    selectedCategory === cat 
                    ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10 scale-105' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                }`}
            >
                {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div id="menu-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredMenu.map(item => (
            <div key={item.id} className="glass-card rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 group hover:-translate-y-2">
                <div className="relative h-56 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80"></div>
                    
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center text-xs font-bold text-white shadow-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                        {item.averageRating?.toFixed(1) || 'N/A'}
                    </div>

                    <div className="absolute bottom-4 left-4">
                         <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white mb-1 shadow-sm ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}>
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                    </div>
                </div>
                
                <div className="p-5 relative">
                    {/* Floating Add Button */}
                    <button 
                        onClick={() => addToCart(item)}
                        className="absolute -top-6 right-5 w-12 h-12 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-lg shadow-black/50 flex items-center justify-center transition-transform transform active:scale-90 group-hover:rotate-90 duration-300"
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    <h3 className="font-bold text-white text-xl mb-1 leading-tight">{item.name}</h3>
                    <p className="text-slate-400 text-xs mb-4 line-clamp-2 h-8">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Price</p>
                            <p className="text-2xl font-bold text-white">₹{item.price}</p>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                            <Clock className="w-3 h-3 mr-1.5" /> 10-15m
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;