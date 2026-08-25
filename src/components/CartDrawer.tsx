import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, AlertCircle, Sparkles } from 'lucide-react';
import type { CartItem, Settings } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  settings: Settings | null;
  onClose: () => void;
  onUpdateQuantity: (foodId: number, delta: number) => void;
  onRemoveItem: (foodId: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  settings,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = settings?.delivery_charge ?? 60;
  const minOrder = settings?.min_order ?? 0;
  const grandTotal = subtotal + (cart.length > 0 ? deliveryCharge : 0);
  const isMinOrderMet = grandTotal >= minOrder;
  const differenceToMin = minOrder - grandTotal;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-rose-100 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Your Cart</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-100/60 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-400 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Explore ADN's Food menu and add your favorite dishes to place an order!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                    alt={item.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-rose-50 shrink-0 border border-rose-100"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-black text-rose-600">
                        ৳{(item.price * item.quantity).toFixed(0)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        (৳{item.price.toFixed(0)} each)
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs font-bold shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs font-bold shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer / Bill Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-rose-100 bg-slate-50/70 space-y-4">
              {/* Minimum Order Warning */}
              {!isMinOrderMet && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Minimum order amount is <strong>৳{minOrder}</strong>. Please add <strong>৳{differenceToMin.toFixed(0)}</strong> more to proceed.
                  </span>
                </div>
              )}

              {/* Cost Summary Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Food Subtotal</span>
                  <span className="font-bold text-slate-800">৳{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-800">৳{deliveryCharge.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
                  <span className="font-black text-slate-900">Total Amount</span>
                  <span className="text-xl font-black text-rose-600 font-display">
                    ৳{grandTotal.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="cart-proceed-checkout-btn"
                disabled={!isMinOrderMet}
                onClick={onProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
