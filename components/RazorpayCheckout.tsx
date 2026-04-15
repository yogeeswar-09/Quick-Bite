import React, { useEffect } from 'react';
import { User } from '../types';

interface RazorpayCheckoutProps {
  amount: number;
  user: User | null;
  orderId: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onClose: () => void;
}

const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({ amount, user, orderId, onSuccess, onFailure, onClose }) => {
  const isProcessing = React.useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const displayRazorpay = async () => {
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      if (!res) {
        onFailure('Razorpay SDK failed to load. Are you online?');
        isProcessing.current = false;
        return;
      }

      try {
        // Create order on backend
        const orderResponse = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            receipt: orderId,
          }),
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create order on backend');
        }

        const orderData = await orderResponse.json();
        console.log("Order created:", orderData);

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Quick Bite Foods',
          description: `Order #${orderId}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            console.log("Payment handler response:", response);
            try {
              const verifyResponse = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();
              console.log("Verification result:", verifyData);

              if (verifyData.success) {
                onSuccess(response.razorpay_payment_id);
              } else {
                onFailure('Payment verification failed');
              }
            } catch (err) {
              console.error("Verification error:", err);
              onFailure('Error verifying payment');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: '9999999999',
          },
          theme: {
            color: '#3399cc',
          },
          modal: {
            ondismiss: function () {
              console.log("Razorpay modal dismissed");
              isProcessing.current = false;
              onClose();
            },
          },
        };

        console.log("Initializing Razorpay with options:", options);
        if (!(window as any).Razorpay) {
          throw new Error("Razorpay SDK not found on window object");
        }
        const paymentObject = new (window as any).Razorpay(options);
        
        // Add explicit failure listener
        paymentObject.on('payment.failed', function (response: any) {
            console.error("Razorpay internal failure:", response.error);
            isProcessing.current = false;
            onFailure('Payment Failed: ' + (response.error.description || response.error.reason || 'Unknown error'));
        });

        console.log("Razorpay object created, opening...");
        paymentObject.open();
      } catch (err: any) {
        console.error("Razorpay error:", err);
        isProcessing.current = false;
        onFailure(err.message || 'Something went wrong');
      }
    };

    displayRazorpay();
  }, [amount, user, orderId, onSuccess, onFailure, onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-800 font-medium">Loading secure payment gateway...</p>
      </div>
    </div>
  );
};

export default RazorpayCheckout;