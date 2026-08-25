import React from 'react';
import { Sparkles, Clock, Flame, ShieldCheck, ArrowRight, Zap, Gift } from 'lucide-react';
import type { Settings } from '../types';

interface HeroProps {
  settings: Settings | null;
  onOrderNow: () => void;
  onSelectCategory: (cat: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onOrderNow, onSelectCategory }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50/40 to-sky-50/50 border-b border-rose-100/80">
      {/* Subtle decorative background circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs">
              <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Dhaka's Favorite Taste Experience</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-rose-900 font-extrabold">{settings?.restaurant_name || "ADN's Food"}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              {settings?.hero_title ? (
                <span>{settings.hero_title}</span>
              ) : (
                <span>
                  <span>Delicious Food, </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-red-500 to-pink-600">
                    Delivered Hot
                  </span>
                  <span> to Your Door.</span>
                </span>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-medium">
              {settings?.hero_subtitle || 'Savor chef-crafted gourmet burgers, cheesy hand-tossed pizzas, crispy fried chicken, and cooling shakes. Fast delivery across the city with bKash and Cash on Delivery.'}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-order-now-btn"
                onClick={onOrderNow}
                className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-base shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <span>Explore Menu & Order</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                id="hero-offers-btn"
                onClick={() => onSelectCategory('Burger')}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-sm border border-slate-200/90 shadow-xs transition-all cursor-pointer"
              >
                <Gift className="w-4 h-4 text-pink-500" />
                <span>Special Combos</span>
              </button>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-rose-100/90 max-w-lg">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 rounded-xl bg-rose-100/80 flex items-center justify-center text-rose-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">30 Mins</p>
                  <p className="text-[11px] text-slate-500">Express Delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 rounded-xl bg-pink-100/80 flex items-center justify-center text-pink-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Instant</p>
                  <p className="text-[11px] text-slate-500">bKash / COD</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 rounded-xl bg-sky-100/80 flex items-center justify-center text-sky-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">100% Fresh</p>
                  <p className="text-[11px] text-slate-500">Hygienic Kitchen</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Feature Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main App Hero Card */}
              <div className="relative z-10 bg-white rounded-3xl p-4 shadow-xl shadow-rose-950/5 border border-rose-100/90 transform hover:-translate-y-1 transition-transform duration-300">
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-rose-100">
                  <img
                    src={settings?.hero_image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85"}
                    alt={settings?.restaurant_name || "Special Platter"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-600 to-red-600 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-md">
                    ⭐ ADN Chef's Special
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>20% OFF TODAY</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">ADN Monster Burger</h3>
                    <p className="text-xs text-slate-700 font-medium">Double patty + melted cheddar cheese</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-600 line-through">৳350</span>
                    <p className="text-xl font-black text-rose-600 leading-none">৳297</p>
                  </div>
                </div>
              </div>

              {/* Floating review card */}
              <div className="absolute -bottom-5 -left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-rose-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">
                  4.9★
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">5,000+ Happy Foodies</p>
                  <p className="text-[10px] text-slate-500">Over 12,000 orders delivered</p>
                </div>
              </div>

              {/* Floating bKash badge */}
              <div className="absolute -top-4 -right-3 z-20 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2 text-xs font-bold">
                <span>📱 Pay via bKash</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement bar */}
      {settings?.announcement && (
        <div className="bg-rose-600 text-white text-xs font-semibold py-2 px-4 text-center tracking-wide">
          {settings.announcement}
        </div>
      )}
    </section>
  );
};
