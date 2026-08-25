import React from 'react';
import { ShoppingBag, User as UserIcon, LogOut, ShieldCheck, Clock, MapPin, Phone, UtensilsCrossed } from 'lucide-react';
import type { CartItem, Settings, User } from '../types';

interface HeaderProps {
  settings: Settings | null;
  currentUser: User | null;
  userRole: 'admin' | 'customer' | null;
  cart: CartItem[];
  currentTab: 'menu' | 'orders' | 'track' | 'admin';
  onSelectTab: (tab: 'menu' | 'orders' | 'track' | 'admin') => void;
  onOpenCart: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  userRole,
  cart,
  currentTab,
  onSelectTab,
  onOpenCart,
  onOpenAuth,
  onLogout,
}) => {
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isOpen = settings?.restaurant_open ?? true;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
      {/* Top Banner with Restaurant Info */}
      <div className="bg-gradient-to-r from-rose-900 via-red-800 to-rose-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-rose-100 font-medium">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-300" />
              {settings?.contact_phone || '01712-345678'}
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-300" />
              {settings?.address || 'Dhaka, Bangladesh · 30m Express Delivery'}
            </span>
          </div>

          {settings?.announcement && (
            <div className="hidden lg:block text-xs font-semibold text-amber-200 truncate max-w-md">
              {settings.announcement}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {isOpen ? 'Kitchen Open · Accepting Orders' : 'Currently Closed'}
              </span>
            </div>

            {settings?.bkash_number && (
              <span className="hidden md:inline-flex items-center gap-1 bg-pink-700/60 px-2 py-0.5 rounded text-[11px] font-medium text-pink-100">
                bKash: {settings.bkash_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => onSelectTab('menu')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.restaurant_name || "ADN's Food"}
                className="w-11 h-11 rounded-2xl object-cover border border-rose-200 shadow-md shadow-rose-500/10 group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-display">
                  {settings?.restaurant_name || "ADN's Food"}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
                  Original
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium -mt-0.5">
                {settings?.tagline || 'Premium Taste · Swift Kitchen'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-menu-btn"
              onClick={() => onSelectTab('menu')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'menu'
                  ? 'bg-rose-50 text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
              }`}
            >
              Our Menu
            </button>

            <button
              id="nav-orders-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onSelectTab('orders');
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'orders'
                  ? 'bg-rose-50 text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
              }`}
            >
              My Orders
            </button>

            <button
              id="nav-track-btn"
              onClick={() => onSelectTab('track')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'track'
                  ? 'bg-rose-50 text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
              }`}
            >
              Track Order
            </button>

            <button
              id="nav-admin-btn"
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Admin Portal
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-semibold text-sm transition-all border border-rose-200/70 cursor-pointer shadow-xs active:scale-95"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold text-slate-800">
                {totalCartCount > 0 ? `৳${cartSubtotal.toFixed(0)}` : 'Cart'}
              </span>
            </button>

            {/* Auth / Profile Area */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  id="user-profile-badge"
                  onClick={() => onSelectTab('orders')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {userRole === 'admin' ? 'Administrator' : 'Customer'}
                    </p>
                  </div>
                </div>

                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95"
              >
                <UserIcon className="w-4 h-4" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-rose-100 text-xs font-semibold">
          <button
            onClick={() => onSelectTab('menu')}
            className={`py-1 px-2.5 rounded-lg ${currentTab === 'menu' ? 'bg-rose-100 text-rose-700' : 'text-slate-600'}`}
          >
            Menu
          </button>
          <button
            onClick={() => (currentUser ? onSelectTab('orders') : onOpenAuth('login'))}
            className={`py-1 px-2.5 rounded-lg ${currentTab === 'orders' ? 'bg-rose-100 text-rose-700' : 'text-slate-600'}`}
          >
            My Orders
          </button>
          <button
            onClick={() => onSelectTab('track')}
            className={`py-1 px-2.5 rounded-lg ${currentTab === 'track' ? 'bg-rose-100 text-rose-700' : 'text-slate-600'}`}
          >
            Track
          </button>
          <button
            onClick={() => onSelectTab('admin')}
            className={`py-1 px-2.5 rounded-lg ${currentTab === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
