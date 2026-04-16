import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User, UserRole, AppNotification } from './types';
import { db } from './services/supabaseService';
import AuthPage from './pages/Auth';
import CustomerMenu from './pages/Customer/Menu';
import CustomerCart from './pages/Customer/Cart';
import CustomerOrders from './pages/Customer/Orders';
import AdminDashboard from './pages/Admin/Dashboard';
import Chatbot from './components/Chatbot';
import { useNotificationSystem, ToastContainer, NotificationBell } from './components/NotificationSystem';
import { ShoppingBag, LogOut, Coffee, Heart, LayoutDashboard, Package, Home } from 'lucide-react';

const Navbar: React.FC<{ 
    user: User | null; 
    onLogout: () => void;
    notifications: AppNotification[];
    onMarkRead: () => void;
}> = ({ user, onLogout, notifications, onMarkRead }) => {
  const location = useLocation();
  const isCustomer = user?.role === UserRole.CUSTOMER;
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SPECIALIZED_ADMIN;
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const user = db.getCurrentUser();
      if (!user) {
          setCartCount(0);
          return;
      }
      const cart = JSON.parse(localStorage.getItem(`qb_cart_${user.id}`) || '[]');
      setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cart-updated', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cart-updated', updateCount);
    };
  }, []);

  if (!user) return null;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-2 shadow-lg shadow-black/20' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link to={isCustomer ? "/menu" : "/admin"} className="relative group">
              <div className="flex items-center space-x-2">
                 <div className="bg-gradient-to-br from-orange-500 to-pink-600 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform group-hover:rotate-12 transition-transform">
                    <Coffee className="w-5 h-5 text-white" />
                 </div>
                 <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                    Quick<span className="text-orange-500">Bite</span>
                 </h1>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-6">
            {isCustomer && (
              <>
                {/* Desktop Links */}
                <div className="hidden md:flex space-x-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
                  <NavLink to="/menu" active={location.pathname === '/menu'}>Menu</NavLink>
                  <NavLink to="/orders" active={location.pathname === '/orders'}>Orders</NavLink>
                </div>
                
                {/* Desktop Cart */}
                <div className="hidden md:block relative group">
                  <Link to="/cart" className={`p-2.5 rounded-full transition-all ${location.pathname === '/cart' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <ShoppingBag className="w-5 h-5" />
                  </Link>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg ring-2 ring-slate-950 animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </div>
              </>
            )}
            
            {isAdmin && (
              <div className="hidden md:flex">
                  <NavLink to="/admin" active={location.pathname.startsWith('/admin')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                  </NavLink>
              </div>
            )}

            {/* Notification Bell (Always Visible) */}
            <div className="pl-2 border-l border-white/10">
               <NotificationBell notifications={notifications} onMarkRead={onMarkRead} />
            </div>
            
            {/* Logout Button */}
            <div className={`flex items-center ${isCustomer ? 'hidden md:flex' : ''}`}>
              <button 
                onClick={onLogout}
                className="p-2.5 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; active: boolean; children: React.ReactNode }> = ({ to, active, children }) => (
  <Link 
    to={to} 
    className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
      active 
        ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {children}
  </Link>
);

const MobileNav: React.FC<{ cartCount: number, onLogout: () => void }> = ({ cartCount, onLogout }) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center z-40 h-16 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <Link to="/menu" className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/menu') ? 'text-orange-500' : 'text-slate-500'}`}>
                <Coffee className="w-5 h-5" />
                <span className="text-[10px] font-bold">Menu</span>
            </Link>
            
            <Link to="/cart" className={`relative flex flex-col items-center space-y-1 transition-colors ${isActive('/cart') ? 'text-orange-500' : 'text-slate-500'}`}>
                <div className="relative">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-slate-950">
                            {cartCount}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-bold">Cart</span>
            </Link>

            <Link to="/orders" className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/orders') ? 'text-orange-500' : 'text-slate-500'}`}>
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-bold">Orders</span>
            </Link>

            <button onClick={onLogout} className="flex flex-col items-center space-y-1 text-slate-500 hover:text-red-400 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-bold">Exit</span>
            </button>
        </div>
    );
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  
  // Notification Hooks
  const { notifications, toasts, markAllRead, clearToasts } = useNotificationSystem();

  useEffect(() => {
    const checkUser = () => {
        const currentUser = db.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    };

    const updateCartCount = () => {
        const user = db.getCurrentUser();
        if (!user) {
            setCartCount(0);
            return;
        }
        const cart = JSON.parse(localStorage.getItem(`qb_cart_${user.id}`) || '[]');
        setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    };

    checkUser();
    updateCartCount();
    
    db.addEventListener('session-updated', checkUser);
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cart-updated', updateCartCount);
    
    return () => {
        db.removeEventListener('session-updated', checkUser);
        window.removeEventListener('storage', updateCartCount);
        window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    db.logout();
  };

  if (loading) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
         <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
         <div className="text-orange-500 font-bold tracking-widest uppercase text-xs">Loading Quick Bite</div>
      </div>
  );

  return (
    <HashRouter>
      <div className="min-h-screen text-slate-200 font-sans selection:bg-orange-500/30">
        <Navbar 
            user={user} 
            onLogout={handleLogout} 
            notifications={notifications}
            onMarkRead={markAllRead}
        />
        
        <ToastContainer toasts={toasts} onDismiss={clearToasts} />

        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${user?.role === UserRole.CUSTOMER ? 'pb-24' : ''}`}>
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage onLogin={setUser} /> : <Navigate to={user.role === UserRole.CUSTOMER ? "/menu" : "/admin"} />} />
            
            {/* Customer Routes */}
            <Route path="/menu" element={user?.role === UserRole.CUSTOMER ? <CustomerMenu /> : <Navigate to="/auth" />} />
            <Route path="/cart" element={user?.role === UserRole.CUSTOMER ? <CustomerCart /> : <Navigate to="/auth" />} />
            <Route path="/orders" element={user?.role === UserRole.CUSTOMER ? <CustomerOrders /> : <Navigate to="/auth" />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              (user?.role === UserRole.ADMIN || user?.role === UserRole.SPECIALIZED_ADMIN) 
              ? <AdminDashboard user={user} /> 
              : <Navigate to="/auth" />
            } />
            
            <Route path="*" element={<Navigate to={user ? (user.role === UserRole.CUSTOMER ? "/menu" : "/admin") : "/auth"} />} />
          </Routes>
        </main>

        {user?.role === UserRole.CUSTOMER && (
            <>
                <MobileNav cartCount={cartCount} onLogout={handleLogout} />
                <Chatbot />
            </>
        )}
      </div>
    </HashRouter>
  );
}

export default App;