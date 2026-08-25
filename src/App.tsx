import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ShoppingBag, Utensils, Sparkles, Flame, ShieldCheck, 
  Clock, MapPin, Heart, ChevronRight, Check, AlertCircle, Phone, Mail,
  Award, TrendingUp, ArrowRight
} from 'lucide-react';
import type { Food, CartItem, Order, Settings, User } from './types';
import { api } from './api';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FoodCard } from './components/FoodCard';
import { FoodDetailsModal } from './components/FoodDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AuthModal } from './components/AuthModal';
import { AdminPortal } from './components/AdminPortal';

export default function App() {
  // Global Application State
  const [settings, setSettings] = useState<Settings | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);

  // Navigation Tabs: 'menu' | 'orders' | 'track' | 'admin'
  const [currentTab, setCurrentTab] = useState<'menu' | 'orders' | 'track' | 'admin'>('menu');

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('adns_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('adns_cart', JSON.stringify(cart));
  }, [cart]);

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyDiscounts, setOnlyDiscounts] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'discount'>('popular');

  // Modals
  const [selectedFoodDetails, setSelectedFoodDetails] = useState<Food | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [recentOrderSuccess, setRecentOrderSuccess] = useState<Order | null>(null);
  const [trackOrderId, setTrackOrderId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sett, fd, cats, me] = await Promise.all([
        api.getSettings(),
        api.getFoods(),
        api.getCategories(),
        api.getMe(),
      ]);
      setSettings(sett);
      setFoods(fd);
      setCategories(cats);
      if (me.authenticated && me.user) {
        setCurrentUser(me.user);
        setUserRole(me.role || 'customer');
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // ------------------------------------------
  // Cart Actions
  // ------------------------------------------
  const handleAddToCart = (food: Food, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.id === food.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: food.id,
          name: food.name,
          photo: food.photo,
          category: food.category,
          price: food.final_price,
          original_price: food.original_price,
          discount_type: food.discount_type,
          discount_value: food.discount_value,
          quantity,
        },
      ];
    });
    showToast(`Added ${quantity}× "${food.name}" to cart! 🍔`);
  };

  const handleUpdateQuantity = (foodId: number, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.id === foodId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      return updated;
    });
  };

  const handleRemoveCartItem = (foodId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== foodId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // ------------------------------------------
  // Order Placement
  // ------------------------------------------
  const handleSubmitOrder = async (orderData: {
    items: { id: number; quantity: number }[];
    address: string;
    area: string;
    city: string;
    instructions: string;
    payment_method: 'COD' | 'bKash';
    bkash_txn?: string;
  }) => {
    const res = await api.createOrder(orderData);
    setCart([]);
    setIsCheckoutOpen(false);
    setRecentOrderSuccess(res.order);
    showToast(`Order ${res.order_id} placed successfully! 🎉`);
  };

  // ------------------------------------------
  // Authentication Handlers
  // ------------------------------------------
  const handleAuthSuccess = (user: User, role: 'admin' | 'customer') => {
    setCurrentUser(user);
    setUserRole(role);
    showToast(`Welcome, ${user.name}!`);
    if (role === 'admin' && currentTab === 'admin') {
      // Reload admin portal
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setUserRole(null);
    setCurrentTab('menu');
    showToast('Logged out successfully.');
  };

  // ------------------------------------------
  // Filtered & Sorted Food Menu
  // ------------------------------------------
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      if (f.status !== 'active') return false;

      const matchesCat =
        selectedCategory === 'All' || f.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);

      const matchesDiscount = !onlyDiscounts || (f.discount_type !== 'none' && f.discount_value > 0);

      return matchesCat && matchesSearch && matchesDiscount;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.final_price - b.final_price;
      if (sortBy === 'price-high') return b.final_price - a.final_price;
      if (sortBy === 'discount') return b.discount_value - a.discount_value;
      return 0; // default popular / id
    });
  }, [foods, selectedCategory, searchQuery, onlyDiscounts, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-rose-500 selection:text-white font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-300 border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        userRole={userRole}
        cart={cart}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* ADMIN PORTAL VIEW */}
      {currentTab === 'admin' ? (
        <AdminPortal
          currentUser={currentUser}
          onExitAdmin={() => {
            setCurrentTab('menu');
            loadInitialData();
          }}
          onAdminLoginSuccess={(user) => {
            setCurrentUser(user);
            setUserRole('admin');
            showToast('Admin access authorized.');
            loadInitialData();
          }}
          onRefreshGlobalData={loadInitialData}
        />
      ) : currentTab === 'track' || currentTab === 'orders' ? (
        /* LIVE ORDER TRACKING & MY ORDERS VIEW */
        <OrderTrackingView
          initialOrderId={trackOrderId}
          currentUser={currentUser}
          onOpenAuth={() => {
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
        />
      ) : (
        /* PUBLIC FOOD MENU & ORDERING HOMEPAGE */
        <main className="flex-1 space-y-12">
          {/* Hero Banner Section */}
          <Hero
            settings={settings}
            onOrderNow={() => {
              const el = document.getElementById('menu-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              const el = document.getElementById('menu-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Menu & Category Discovery Section */}
          <section id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-rose-100 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-2">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>Fresh From Our Kitchen</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
                  Explore ADN's Delicious Menu
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Fresh ingredients, secret spices, and real taste cooked to order.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="food-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search burgers, pizza, chicken..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Category Filter Chips & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
                {['All', 'Burger', 'Pizza', 'Fried Chicken', 'Rice Bowls', 'Snacks & Fries', 'Beverages & Shakes', 'Desserts'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                        selectedCategory === cat
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-105'
                          : 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Filter Toggles & Sort */}
              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => setOnlyDiscounts(!onlyDiscounts)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                    onlyDiscounts
                      ? 'bg-pink-100 border-pink-300 text-pink-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  <span>Discounts Only</span>
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>
            </div>

            {/* Food Grid */}
            {filteredFoods.length === 0 ? (
              <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <Utensils className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">No food items found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn't find any dishes matching your search query or category filter. Try clearing filters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                    setOnlyDiscounts(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFoods.map((food) => {
                  const cartItem = cart.find((item) => item.id === food.id);
                  return (
                    <FoodCard
                      key={food.id}
                      food={food}
                      cartItem={cartItem}
                      onAddToCart={(f) => handleAddToCart(f, 1)}
                      onUpdateQuantity={handleUpdateQuantity}
                      onQuickView={(f) => setSelectedFoodDetails(f)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Floating Cart CTA Bar on Mobile */}
          {cart.length > 0 && !isCartOpen && (
            <div className="fixed bottom-4 inset-x-4 z-30 md:hidden animate-in slide-in-from-bottom-6 duration-300">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xl shadow-rose-600/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-100">View Cart</p>
                    <p className="text-sm font-black">
                      ৳{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black">
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

          {/* Trust & Quality Assurance Section */}
          <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto md:mx-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">100% Halal & Hygienic</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Strict quality audits and sanitized kitchen environments for every prepared meal.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-pink-600 text-white flex items-center justify-center mx-auto md:mx-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">30 Min Swift Delivery</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Thermal-insulated delivery boxes preserve mouth-watering crispness and sizzling heat.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto md:mx-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">Master Chef Recipes</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Special in-house secret marinades, premium patties, and genuine mozzarella cheese.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto md:mx-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">Instant bKash Support</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Direct CashOut to verified merchant number {settings?.bkash_number || '01712-345678'}.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 py-10 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                ADN's <span className="text-rose-600">Food</span>
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Delicious food, delivered hot to your door · Banani / Dhanmondi, Dhaka
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-slate-700">
              <button onClick={() => setCurrentTab('menu')} className="hover:text-rose-600">
                Menu
              </button>
              <button
                onClick={() => {
                  if (currentUser) setCurrentTab('orders');
                  else {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }
                }}
                className="hover:text-rose-600"
              >
                My Orders
              </button>
              <button onClick={() => setCurrentTab('track')} className="hover:text-rose-600">
                Track Order
              </button>
              <button onClick={() => setCurrentTab('admin')} className="hover:text-rose-600">
                Admin Panel
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
            <p>© 2026 ADN's Food. All rights reserved.</p>
            <p>bKash & Cash on Delivery Online Restaurant Platform</p>
          </div>
        </div>
      </footer>

      {/* ----------------- MODALS ----------------- */}

      {/* Food Quick View Modal */}
      <FoodDetailsModal
        food={selectedFoodDetails}
        cartItem={cart.find((item) => item.id === selectedFoodDetails?.id)}
        onClose={() => setSelectedFoodDetails(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        settings={settings}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={cart}
        settings={settings}
        currentUser={currentUser}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        order={recentOrderSuccess}
        onClose={() => setRecentOrderSuccess(null)}
        onViewOrderTracking={(orderId) => {
          setRecentOrderSuccess(null);
          setTrackOrderId(orderId);
          setCurrentTab('track');
        }}
      />

      {/* Login & Register Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
