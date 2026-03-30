import React, { useEffect, useState } from 'react';
import { AppNotification, User, UserRole, OrderStatus } from '../types';
import { db } from '../services/supabaseService';
import { Bell, X, CheckCircle, AlertTriangle, Info, ChefHat, Flame, Package } from 'lucide-react';

export const useNotificationSystem = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [toasts, setToasts] = useState<AppNotification[]>([]);

    useEffect(() => {
        // Load history from local storage
        const stored = localStorage.getItem('qb_notifications');
        if (stored) {
            setNotifications(JSON.parse(stored));
        }

        const handleEvent = (e: CustomEvent) => {
            const user = db.getCurrentUser();
            if (!user) return;

            const { type, payload } = e.detail;
            let newNotif: AppNotification | null = null;

            // 1. ADMIN LOGIC
            if (user.role === UserRole.ADMIN || user.role === UserRole.SPECIALIZED_ADMIN) {
                if (type === 'ORDER_CREATED') {
                    newNotif = {
                        id: Date.now().toString(),
                        title: 'New Order Received',
                        message: `Order #${payload.id} placed. ₹${payload.totalAmount}`,
                        type: 'info',
                        timestamp: Date.now(),
                        read: false,
                        targetRole: UserRole.ADMIN
                    };
                } else if (type === 'KITCHEN_HIGH_LOAD') {
                    newNotif = {
                        id: Date.now().toString(),
                        title: 'Kitchen Overload Warning',
                        message: `High volume! ${payload.activeCount} orders active.`,
                        type: 'warning',
                        timestamp: Date.now(),
                        read: false,
                        targetRole: UserRole.ADMIN
                    };
                }
            }

            // 2. CUSTOMER LOGIC
            if (user.role === UserRole.CUSTOMER) {
                if (type === 'ORDER_UPDATED' && payload.id) {
                    // In a real app, verify user.id === order.userId. 
                    // For simulation, we assume if the customer is logged in, they want updates on their orders.
                    
                    let title = 'Order Update';
                    let message = `Order #${payload.id} is now ${payload.status}`;
                    let notifType: 'info' | 'success' | 'warning' = 'info';

                    if (payload.status === OrderStatus.PREPARING) {
                        title = 'Chef is Cooking! 🍳';
                        message = `Your order #${payload.id} is being prepared.`;
                        notifType = 'info';
                    } else if (payload.status === OrderStatus.READY) {
                        title = 'Order Ready! 🥡';
                        message = `Order #${payload.id} is ready for pickup!`;
                        notifType = 'success';
                    } else if (payload.status === OrderStatus.COMPLETED) {
                        title = 'Enjoy your meal! 😋';
                        message = `Order #${payload.id} completed.`;
                        notifType = 'success';
                    }

                    newNotif = {
                        id: Date.now().toString(),
                        title,
                        message,
                        type: notifType,
                        timestamp: Date.now(),
                        read: false,
                        targetRole: UserRole.CUSTOMER
                    };
                }
            }

            if (newNotif) {
                addNotification(newNotif);
            }
        };

        window.addEventListener('qb-notification' as any, handleEvent);
        return () => window.removeEventListener('qb-notification' as any, handleEvent);
    }, []);

    const addNotification = (n: AppNotification) => {
        playNotificationSound(n.type);
        setNotifications(prev => {
            const updated = [n, ...prev].slice(0, 50); // Keep last 50
            localStorage.setItem('qb_notifications', JSON.stringify(updated));
            return updated;
        });
        setToasts(prev => [...prev, n]);
        
        // Auto dismiss toast after 5s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== n.id));
        }, 5000);
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        localStorage.setItem('qb_notifications', JSON.stringify(updated));
    };

    const clearToasts = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { notifications, toasts, markAllRead, clearToasts };
};

// --- SOUND UTILITY ---
const playNotificationSound = (type: string) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'success') {
            // Happy "Ding"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'warning') {
            // Low "Bloop"
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else {
            // Standard "Pop"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};

// --- COMPONENTS ---

export const ToastContainer: React.FC<{ toasts: AppNotification[], onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-20 right-4 z-[70] flex flex-col space-y-3 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`pointer-events-auto w-80 bg-slate-900 rounded-xl shadow-2xl border-l-4 p-4 transform transition-all duration-300 animate-in slide-in-from-right-10 fade-in ${
                        toast.type === 'success' ? 'border-green-500' :
                        toast.type === 'warning' ? 'border-orange-500' : 
                        'border-blue-500'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                             <div className={`mt-1 ${
                                 toast.type === 'success' ? 'text-green-400' :
                                 toast.type === 'warning' ? 'text-orange-400' : 
                                 'text-blue-400'
                             }`}>
                                 {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                                 {toast.type === 'warning' && <Flame className="w-5 h-5" />}
                                 {toast.type === 'info' && <Info className="w-5 h-5" />}
                             </div>
                             <div>
                                 <h4 className="font-bold text-slate-200 text-sm">{toast.title}</h4>
                                 <p className="text-slate-400 text-xs mt-1">{toast.message}</p>
                             </div>
                        </div>
                        <button onClick={() => onDismiss(toast.id)} className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const NotificationBell: React.FC<{ notifications: AppNotification[], onMarkRead: () => void }> = ({ notifications, onMarkRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggle = () => {
        if (!isOpen) onMarkRead();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button 
                onClick={handleToggle}
                className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-300 text-sm">Notifications</h3>
                            <span className="text-xs text-slate-500">{notifications.length} recent</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-xs">
                                    No notifications yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`p-4 hover:bg-slate-800 transition-colors ${!n.read ? 'bg-blue-900/10' : ''}`}>
                                            <div className="flex items-start space-x-3">
                                                 <div className={`mt-0.5 ${
                                                    n.type === 'success' ? 'text-green-500' :
                                                    n.type === 'warning' ? 'text-orange-500' : 
                                                    'text-blue-500'
                                                 }`}>
                                                     {n.type === 'success' ? <CheckCircle className="w-4 h-4" /> : 
                                                      n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : 
                                                      <Info className="w-4 h-4" />}
                                                 </div>
                                                 <div>
                                                     <p className="text-sm font-bold text-slate-300">{n.title}</p>
                                                     <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                                                     <p className="text-[10px] text-slate-600 mt-2">
                                                         {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                     </p>
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};