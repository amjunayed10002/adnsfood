import React from 'react';
import { Plus, Minus, Clock, Eye, Sparkles } from 'lucide-react';
import type { Food, CartItem } from '../types';

interface FoodCardProps {
  food: Food;
  cartItem?: CartItem;
  onAddToCart: (food: Food) => void;
  onUpdateQuantity: (foodId: number, delta: number) => void;
  onQuickView: (food: Food) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  cartItem,
  onAddToCart,
  onUpdateQuantity,
  onQuickView,
}) => {
  const hasDiscount = food.discount_type !== 'none' && food.discount_value > 0;
  const isAvailable = food.availability;

  return (
    <article
      id={`food-card-${food.id}`}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 ${
        isAvailable ? 'border-rose-100 hover:border-rose-300' : 'border-slate-200 opacity-75'
      }`}
    >
      <div>
        {/* Food Thumbnail Area */}
        <div className="relative aspect-4/3 overflow-hidden bg-rose-50 cursor-pointer" onClick={() => onQuickView(food)}>
          <img
            src={food.photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
            alt={food.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Discount Badge */}
          {hasDiscount && isAvailable && (
            <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>
                {food.discount_type === 'percentage'
                  ? `${food.discount_value}% OFF`
                  : `৳${food.discount_value} OFF`}
              </span>
            </div>
          )}

          {/* Availability Status Tag */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white text-rose-600 text-xs font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">
                Currently Unavailable
              </span>
            </div>
          )}

          {/* Category Pill */}
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {food.category}
          </div>

          {/* Quick View Button on Hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(food);
            }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            title="Quick Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Food Description & Title */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onQuickView(food)}
              className="font-extrabold text-base text-slate-900 hover:text-rose-600 transition-colors cursor-pointer line-clamp-1"
            >
              {food.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
            {food.description || 'Prepared fresh with premium ingredients and signature house spices.'}
          </p>

          {/* Prep time info */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>{food.prep_time || '15-20 min prep'}</span>
          </div>
        </div>
      </div>

      {/* Pricing & Add to Cart Footer */}
      <div className="p-4 pt-2 border-t border-rose-50/80 flex items-center justify-between gap-2 bg-rose-50/30">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-rose-600 font-display">
              ৳{food.final_price.toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-600 line-through font-medium">
                ৳{food.original_price.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart or Quantity Selector */}
        {!isAvailable ? (
          <button
            disabled
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
          >
            Unavailable
          </button>
        ) : cartItem ? (
          <div className="flex items-center gap-1.5 bg-rose-600 text-white rounded-xl p-1 shadow-md shadow-rose-600/20">
            <button
              id={`cart-decrease-${food.id}`}
              onClick={() => onUpdateQuantity(food.id, -1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-700 hover:bg-rose-800 transition-colors text-white active:scale-90"
              title="Decrease Quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-black select-none">
              {cartItem.quantity}
            </span>
            <button
              id={`cart-increase-${food.id}`}
              onClick={() => onUpdateQuantity(food.id, 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-700 hover:bg-rose-800 transition-colors text-white active:scale-90"
              title="Increase Quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id={`add-to-cart-${food.id}`}
            onClick={() => onAddToCart(food)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        )}
      </div>
    </article>
  );
};
