import React, { useState, useEffect } from 'react';
import { ShieldCheck, Smartphone, CreditCard, Building, Wallet, ChevronRight, Loader2, CheckCircle, X } from 'lucide-react';
import { User } from '../types';

interface RazorpayCheckoutProps {
  amount: number;
  user: User | null;
  orderId: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onClose: () => void;
}

type CheckoutStep = 'CONTACT' | 'METHOD' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({ amount, user, orderId, onSuccess, onFailure, onClose }) => {
  const [step, setStep] = useState<CheckoutStep>('CONTACT');
  const [phone, setPhone] = useState('9999999999');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Simulation timer
  const processPayment = () => {
    setStep('PROCESSING');
    setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate
        if (success) {
            setStep('SUCCESS');
            setTimeout(() => {
                onSuccess(`pay_${Math.random().toString(36).substr(2, 9)}`);
            }, 1500);
        } else {
            setStep('FAILURE');
        }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Razorpay-style Modal Container */}
      <div className="bg-white text-slate-900 w-full max-w-md rounded-lg overflow-hidden shadow-2xl flex flex-col h-[600px] md:h-auto animate-in zoom-in-95 duration-200 font-sans relative">
        
        {/* Top Header - Brand */}
        <div className="bg-[#2d3e50] p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">R</span>
                </div>
                <div>
                    <h3 className="font-bold text-sm">Quick Bite Foods</h3>
                    <p className="text-xs text-slate-300">Order #{orderId}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-300">Amount to Pay</p>
                <p className="font-bold text-lg">₹{amount}.00</p>
            </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-[-50px] md:right-[-40px] text-white/80 hover:text-white">
            <X className="w-6 h-6" />
        </button>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50 relative overflow-y-auto">
            
            {/* STEP 1: CONTACT */}
            {step === 'CONTACT' && (
                <div className="p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Contact Information</h2>
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all mt-1">
                                    <span className="bg-slate-100 px-3 py-3 text-slate-600 font-bold border-r text-sm">+91</span>
                                    <input 
                                        type="tel" 
                                        value={phone} 
                                        onChange={e => setPhone(e.target.value)}
                                        className="flex-1 px-4 py-3 outline-none text-slate-800 font-medium" 
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full mt-1 bg-white border border-slate-300 rounded-md px-4 py-3 outline-none text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 transition-all" 
                                />
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setStep('METHOD')}
                        className="w-full bg-[#3395ff] hover:bg-[#2b7ac9] text-white font-bold py-4 rounded-md shadow-md transition-colors"
                    >
                        Proceed to Pay
                    </button>
                </div>
            )}

            {/* STEP 2: METHOD SELECTION */}
            {step === 'METHOD' && (
                <div>
                     <div className="p-4 bg-white border-b border-slate-200">
                        <p className="text-sm text-slate-500">Completing payment for</p>
                        <p className="font-bold text-slate-800">{email}</p>
                     </div>
                     <div className="p-2 space-y-1">
                        <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Cards, UPI & More</h4>
                        
                        <button onClick={processPayment} className="w-full bg-white p-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4 text-blue-600 group-hover:bg-blue-50 transition-colors">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800 text-sm">Card</p>
                                    <p className="text-xs text-slate-500">Visa, Mastercard, RuPay, Maestro</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>

                        <button onClick={processPayment} className="w-full bg-white p-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4 text-green-600 group-hover:bg-green-50 transition-colors">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800 text-sm">UPI</p>
                                    <p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>

                        <button onClick={processPayment} className="w-full bg-white p-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4 text-orange-600 group-hover:bg-orange-50 transition-colors">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800 text-sm">Netbanking</p>
                                    <p className="text-xs text-slate-500">All Indian banks</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>

                        <button onClick={processPayment} className="w-full bg-white p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4 text-purple-600 group-hover:bg-purple-50 transition-colors">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800 text-sm">Wallet</p>
                                    <p className="text-xs text-slate-500">Paytm, PhonePe, Amazon Pay</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                     </div>
                </div>
            )}

            {/* STEP 3: PROCESSING */}
            {step === 'PROCESSING' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Processing Payment</h3>
                    <p className="text-slate-500 text-sm">Please do not close this window or press back.</p>
                    <div className="mt-8 bg-white p-4 rounded-lg border border-slate-200 shadow-sm w-full">
                         <p className="text-xs text-slate-400 mb-1">Bank Server</p>
                         <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500 w-1/2 animate-progress"></div>
                         </div>
                    </div>
                </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 'SUCCESS' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful</h3>
                    <p className="text-slate-500 mb-6">Redirecting you to Quick Bite...</p>
                </div>
            )}

             {/* STEP 5: FAILURE */}
             {step === 'FAILURE' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                        <X className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h3>
                    <p className="text-slate-500 mb-6">The bank rejected the transaction.</p>
                    <button 
                        onClick={() => setStep('METHOD')}
                        className="bg-slate-800 text-white px-6 py-2 rounded-md font-bold text-sm"
                    >
                        Try Again
                    </button>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secured by Razorpay</span>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckout;