import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShoppingBag, Eye, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import type { Order } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrderTracking: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewOrderTracking,
}) => {
  if (!order) return null;

  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E11D48', '#F43F5E', '#FB7185', '#0284C7', '#F59E0B'],
      });
    } catch (e) {}
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.order_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-rose-100 p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Celebration Icon */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Placed Successfully!
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Thank you for ordering with <strong>ADN's Food</strong>. Our kitchen is reviewing your order!
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Order ID</span>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 text-xs font-mono font-black text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs"
            >
              <span>{order.order_id}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-rose-100/80">
            <div>
              <span className="text-slate-400 block">Payment Method</span>
              <span className="font-bold text-slate-800">
                {order.payment_method === 'bKash' ? 'bKash (Paid)' : 'Cash on Delivery'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Amount</span>
              <span className="font-black text-rose-600 text-sm">৳{order.total.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Order Status</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
                {order.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Estimated Prep</span>
              <span className="font-bold text-slate-800">20-30 mins</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => onViewOrderTracking(order.order_id)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Track Order Progress</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
          >
            Continue Browsing Menu
          </button>
        </div>
      </div>
    </div>
  );
};
