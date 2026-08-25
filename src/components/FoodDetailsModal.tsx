import React, { useState } from 'react';
import { X, Plus, Minus, Clock, Sparkles, Check, ShoppingBag } from 'lucide-react';
import type { Food, CartItem } from '../types';

interface FoodDetailsModalProps {
  food: Food | null;
  cartItem?: CartItem;
  onClose: () => void;
  onAddToCart: (food: Food, quantity: number) => void;
}

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({
  food,
  cartItem,
  onClose,
  onAddToCart,
}) => {
  if (!food) return null;

  const [quantity, setQuantity] = useState<number>(cartItem ? cartItem.quantity : 1);
  const hasDiscount = food.discount_type !== 'none' && food.discount_value > 0;
  const totalPrice = food.final_price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-rose-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Food Large Image Header */}
        <div className="relative aspect-16/10 bg-rose-100 shrink-0">
          <img
            src={food.photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85'}
            alt={food.name}
            className="w-full h-full object-cover"
          />

          {hasDiscount && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {food.discount_type === 'percentage'
                  ? `${food.discount_value}% DISCOUNT`
                  : `৳${food.discount_value} OFF`}
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-slate-800 shadow-md">
            {food.category}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {food.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                {food.prep_time || '15-20 min cooking time'}
              </span>
              <span>•</span>
              <span className={food.availability ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {food.availability ? 'Available for Instant Order' : 'Currently Unavailable'}
              </span>
            </div>
          </div>

          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 text-sm text-slate-700 leading-relaxed">
            <p className="font-semibold text-slate-900 mb-1">Chef's Note:</p>
            {food.description || 'Crafted with premium fresh ingredients, signature spices, and made fresh to order in our kitchen.'}
          </div>

          {/* Pricing Highlight */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unit Price</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-rose-600">৳{food.final_price.toFixed(0)}</span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">৳{food.original_price.toFixed(0)}</span>
                )}
              </div>
            </div>

            {/* Quantity Stepper */}
            {food.availability && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 disabled:opacity-40 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-slate-800 text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-6 pt-3 bg-white border-t border-rose-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total for {quantity} item(s)</p>
            <p className="text-xl font-black text-slate-900">৳{totalPrice.toFixed(0)}</p>
          </div>

          <button
            disabled={!food.availability}
            onClick={() => {
              onAddToCart(food, quantity);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{food.availability ? 'Add to Cart' : 'Item Unavailable'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
