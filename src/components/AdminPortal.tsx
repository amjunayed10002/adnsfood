import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, Settings as SettingsIcon, 
  Plus, Edit, Trash2, CheckCircle2, Clock, ChefHat, Bike, PackageCheck, XCircle, Search, 
  RefreshCw, Database, Eye, Power, AlertTriangle, Sparkles, Copy, Check, Filter, ArrowLeft,
  Image as ImageIcon, DollarSign, Store, Phone, Mail, MapPin, Tag, Flame, ArrowRight
} from 'lucide-react';
import { api } from '../api';
import type { Food, Order, Settings, AdminStats, CustomerSummary, User } from '../types';
import { ImageUploader } from './ImageUploader';

interface AdminPortalProps {
  currentUser: User | null;
  onExitAdmin: () => void;
  onAdminLoginSuccess: (user: User) => void;
  onRefreshGlobalData?: () => void;
}

const PRESET_FOOD_PHOTOS = [
  { label: 'Monster Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cheesy Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fried Chicken', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80' },
  { label: 'Kacchi Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Crispy Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mango Cooler', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cold Coffee', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80' },
  { label: 'Chocolate Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
];

const PRESET_LOGOS = [
  { label: 'Gourmet Grill', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80' },
  { label: 'Burger Emblem', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80' },
  { label: 'Pizza Crest', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80' },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onExitAdmin,
  onAdminLoginSuccess,
  onRefreshGlobalData,
}) => {
  const isAdmin = 
    currentUser?.status === 'admin' || 
    (currentUser as any)?.role === 'admin' || 
    currentUser?.email?.toLowerCase() === 'admin@adnsfood.com' ||
    currentUser?.username?.toLowerCase() === 'admin';

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('admin@adnsfood.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Portal State
  const [activeNav, setActiveNav] = useState<'dashboard' | 'foods' | 'orders' | 'customers' | 'settings'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Food Form State (Add / Edit)
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Burger');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodPhoto, setFoodPhoto] = useState('');
  const [foodOriginalPrice, setFoodOriginalPrice] = useState<number | string>(250);
  const [foodDiscountType, setFoodDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [foodDiscountValue, setFoodDiscountValue] = useState<number | string>(0);
  const [foodPrepTime, setFoodPrepTime] = useState('15-20 min');
  const [foodAvailability, setFoodAvailability] = useState(true);
  const [foodStatus, setFoodStatus] = useState<'active' | 'inactive'>('active');

  // Order Search & Filter State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('All');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // portal notification
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrxId(trx);
    setTimeout(() => setCopiedTrxId(null), 2500);
  };
  // Food Search & Customer Search
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<CustomerSummary | null>(null);

  const showBannerMessage = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [st, fd, ord, cust, sett, db] = await Promise.all([
        api.getAdminStats(),
        api.getAdminFoods(),
        api.getOrders(),
        api.getAdminCustomers(),
        api.getSettings(),
        api.getDbStatus(),
      ]);
      setStats(st);
      setFoods(fd);
      setOrders(ord);
      setCustomers(cust);
      setSettings(sett);
      setDbStatus(db);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const emailToUse = (customEmail || adminEmail).trim();
    const passToUse = customPass || adminPassword;

    try {
      const res = await api.adminLogin({
        email: emailToUse,
        password: passToUse,
      });
      localStorage.setItem('adns_token', res.token);
      
      const adminUser: User = {
        ...res.user,
        status: 'admin',
      };
      
      onAdminLoginSuccess(adminUser);
      await loadAllAdminData();
      onRefreshGlobalData?.();
      showBannerMessage('Admin authorized successfully! Welcome to Control Panel.');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator email or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ------------------------------------
  // Food CRUD Handlers
  // ------------------------------------
  const openAddFoodModal = () => {
    setEditingFood(null);
    setFoodName('');
    setFoodCategory('Burger');
    setFoodDesc('');
    setFoodPhoto('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80');
    setFoodOriginalPrice(250);
    setFoodDiscountType('none');
    setFoodDiscountValue(0);
    setFoodPrepTime('15-20 min');
    setFoodAvailability(true);
    setFoodStatus('active');
    setIsFoodModalOpen(true);
  };

  const openEditFoodModal = (food: Food) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodCategory(food.category);
    setFoodDesc(food.description);
    setFoodPhoto(food.photo);
    setFoodOriginalPrice(food.original_price);
    setFoodDiscountType(food.discount_type);
    setFoodDiscountValue(food.discount_value);
    setFoodPrepTime(food.prep_time || '15-20 min');
    setFoodAvailability(food.availability);
    setFoodStatus(food.status);
    setIsFoodModalOpen(true);
  };

  const calculatePreviewFinalPrice = () => {
    const p = Number(foodOriginalPrice) || 0;
    const d = Number(foodDiscountValue) || 0;
    if (foodDiscountType === 'percentage') {
      return Math.round(Math.max(0, p * (1 - d / 100)) * 100) / 100;
    }
    if (foodDiscountType === 'fixed') {
      return Math.round(Math.max(0, p - d) * 100) / 100;
    }
    return p;
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || foodOriginalPrice === '') {
      alert('Please fill food name and original price.');
      return;
    }

    const payload: Partial<Food> = {
      name: foodName.trim(),
      category: foodCategory,
      description: foodDesc.trim(),
      photo: foodPhoto.trim() || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      original_price: Number(foodOriginalPrice),
      discount_type: foodDiscountType,
      discount_value: Number(foodDiscountValue),
      prep_time: foodPrepTime,
      availability: foodAvailability,
      status: foodStatus,
    };

    try {
      if (editingFood) {
        await api.updateFood(editingFood.id, payload);
        showBannerMessage(`"${payload.name}" updated successfully!`);
      } else {
        await api.addFood(payload);
        showBannerMessage(`"${payload.name}" added to menu catalog!`);
      }
      setIsFoodModalOpen(false);
      await loadAllAdminData();
      onRefreshGlobalData?.();
    } catch (err: any) {
      alert(err.message || 'Failed to save food.');
    }
  };

  const handleToggleFoodStatus = async (id: number) => {
    try {
      const res = await api.toggleFoodStatus(id);
      showBannerMessage(`Food status changed to ${res.status}`);
      await loadAllAdminData();
      onRefreshGlobalData?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleFoodAvailability = async (id: number) => {
    try {
      const res = await api.toggleFoodAvailability(id);
      showBannerMessage(res.availability ? 'Item marked as In Stock' : 'Item marked as Sold Out');
      await loadAllAdminData();
      onRefreshGlobalData?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteFood = async (food: Food) => {
    if (!confirm(`Are you sure you want to permanently remove "${food.name}" from the database?`)) {
      return;
    }
    try {
      await api.deleteFood(food.id);
      showBannerMessage(`"${food.name}" deleted from menu.`);
      await loadAllAdminData();
      onRefreshGlobalData?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete food.');
    }
  };

  // ------------------------------------
  // Order Status Handler
  // ------------------------------------
  const handleUpdateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      await api.updateOrderStatus(orderId, status);
      showBannerMessage(`Order #${orderId} status changed to "${status}"`);
      await loadAllAdminData();
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails({ ...selectedOrderDetails, status });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // ------------------------------------
  // Settings Handler
  // ------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      showBannerMessage('Restaurant settings updated successfully! Public website, header & cart synced.');
      await loadAllAdminData();
      onRefreshGlobalData?.();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  // ------------------------------------
  // If not logged in as Admin, show Admin Login Box
  // ------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-rose-100 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">ADN's Food Admin</h1>
            <p className="text-xs text-slate-500 font-medium">
              Restaurant Management & Control Portal
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {loginError}
            </div>
          )}

          <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email / Username</label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                placeholder="admin@adnsfood.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Admin Credentials:</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Ready</span>
              </div>
              <p className="text-[11px]">Email: <span className="font-mono text-rose-600 font-bold">admin@adnsfood.com</span></p>
              <p className="text-[11px]">Password: <span className="font-mono text-rose-600 font-bold">admin123</span></p>
              
              <button
                type="button"
                onClick={() => handleAdminLogin(undefined, 'admin@adnsfood.com', 'admin123')}
                disabled={isLoggingIn}
                className="w-full mt-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Fill & Sign In as Admin</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Admin Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Login to Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const q = orderSearchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      o.order_id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.bkash_txn && o.bkash_txn.toLowerCase().includes(q));

    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const matchesPayment = orderPaymentFilter === 'All' || o.payment_method === orderPaymentFilter;

    return matchesQuery && matchesStatus && matchesPayment;
  });

  // Filtered Foods
  const filteredFoods = foods.filter((f) => {
    const q = foodSearchQuery.toLowerCase();
    return !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900">
      {/* Toast banner in admin */}
      {actionSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-300 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0 shadow-xl">
        <div className="space-y-6">
          {/* Logo & Admin Status */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white font-bold shadow-md">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight">{settings?.restaurant_name || "ADN's Food"}</h1>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Portal
                </span>
              </div>
            </div>

            <button
              onClick={loadAllAdminData}
              disabled={isLoading}
              title="Refresh Data"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeNav === 'dashboard' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveNav('foods')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeNav === 'foods' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-4 h-4" />
                <span>Food Management</span>
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                {foods.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeNav === 'orders' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
              </div>
              {stats?.pending ? (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {stats.pending}
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('customers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeNav === 'customers' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Customers</span>
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeNav === 'settings' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Restaurant Settings</span>
            </button>
          </nav>
        </div>

        {/* Database Status & Exit Links */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database Engine:</span>
            </div>
            <p className="text-emerald-400 font-semibold">{dbStatus?.mode || 'Persistent Store'}</p>
          </div>

          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User Website</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        {/* 1. DASHBOARD OVERVIEW VIEW */}
        {activeNav === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Overview</h2>
                <p className="text-xs text-slate-700 font-medium">Real-time performance metrics and live order stream.</p>
              </div>

              <button
                onClick={openAddFoodModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food Item</span>
              </button>
            </div>

            {/* Metrics KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Sales</span>
                <p className="text-2xl font-black text-rose-600 font-display">৳{stats.total_sales.toFixed(0)}</p>
                <span className="text-[10px] text-slate-600 block">Across all delivered orders</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Orders</span>
                <p className="text-2xl font-black text-slate-900 font-display">{stats.total_orders}</p>
                <span className="text-[10px] text-amber-700 block font-semibold">{stats.pending} pending confirmation</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Active Foods</span>
                <p className="text-2xl font-black text-slate-900 font-display">{stats.foods}</p>
                <span className="text-[10px] text-slate-600 block">Catalog dishes available</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Registered Customers</span>
                <p className="text-2xl font-black text-slate-900 font-display">{stats.customers}</p>
                <span className="text-[10px] text-slate-600 block">Verified user accounts</span>
              </div>
            </div>

            {/* Quick Actions & Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pipeline summary */}
              <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900">Live Kitchen & Delivery Pipeline</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-black text-amber-800 uppercase">Pending</span>
                    <p className="text-xl font-black text-amber-900">{stats.pending}</p>
                  </div>
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <span className="text-[10px] font-black text-sky-800 uppercase">Confirmed</span>
                    <p className="text-xl font-black text-sky-900">{stats.confirmed}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-black text-purple-800 uppercase">Preparing</span>
                    <p className="text-xl font-black text-purple-900">{stats.preparing}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-800 uppercase">Out for Delivery</span>
                    <p className="text-xl font-black text-blue-900">{stats.delivery}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-800 uppercase">Delivered</span>
                    <p className="text-xl font-black text-emerald-900">{stats.delivered}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-black text-rose-800 uppercase">Cancelled</span>
                    <p className="text-xl font-black text-rose-900">{stats.cancelled}</p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900">Quick Configuration</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveNav('foods')}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-700">Manage Menu Dishes</span>
                    <span className="text-xs font-black text-rose-600">→</span>
                  </button>
                  <button
                    onClick={() => setActiveNav('settings')}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-700">Edit Logo & Delivery Charges</span>
                    <span className="text-xs font-black text-rose-600">→</span>
                  </button>
                  <button
                    onClick={() => setActiveNav('orders')}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-700">Process Incoming Orders</span>
                    <span className="text-xs font-black text-rose-600">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. FOOD MANAGEMENT VIEW */}
        {activeNav === 'foods' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Food Menu Management</h2>
                <p className="text-xs text-slate-700 font-medium">Add, edit, adjust prices, discounts, and availability.</p>
              </div>

              <button
                onClick={openAddFoodModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food Item</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                placeholder="Search food by title or category..."
                className="w-full text-xs font-medium outline-none bg-transparent"
              />
            </div>

            {/* Foods Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Dish</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Original Price</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Final Customer Price</th>
                      <th className="p-4">Availability</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredFoods.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={f.photo}
                              alt={f.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{f.name}</p>
                              <p className="text-[11px] text-slate-600 line-clamp-1 max-w-xs">{f.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {f.category}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">৳{f.original_price}</td>
                        <td className="p-4">
                          {f.discount_type !== 'none' && f.discount_value > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                              {f.discount_type === 'percentage' ? `${f.discount_value}% OFF` : `৳${f.discount_value} OFF`}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="p-4 font-black text-rose-600 text-sm">৳{f.final_price.toFixed(0)}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleFoodAvailability(f.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                              f.availability ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {f.availability ? '● In Stock' : '✕ Sold Out'}
                          </button>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              f.status === 'active' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => openEditFoodModal(f)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit Food Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleFoodStatus(f.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              f.status === 'active'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {f.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteFood(f)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Remove Food Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ORDERS VIEW */}
        {activeNav === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search Order ID, customer name, phone, bKash TrxID..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-700 font-bold">Payment:</span>
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none"
                  >
                    <option value="All">All Payments</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="bKash">bKash</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                {['All', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Customer Info</th>
                      <th className="p-4">Ordered Dishes</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Grand Total</th>
                      <th className="p-4">Live Status</th>
                      <th className="p-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <p className="font-mono font-black text-slate-900 text-sm">{o.order_id}</p>
                          <p className="text-[11px] text-slate-600">{new Date(o.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{o.customer_name}</p>
                          <p className="text-[11px] text-slate-600">{o.phone}</p>
                          <p className="text-[11px] text-slate-600 truncate max-w-xs">{o.address}, {o.area}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{o.items.length} items</p>
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-[11px] font-black ${
                                o.payment_method === 'bKash' ? 'bg-pink-100 text-pink-800 border border-pink-200' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {o.payment_method === 'bKash' ? 'bKash CashOut' : o.payment_method}
                            </span>
                            {o.bkash_txn && (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] text-pink-700 font-bold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                                  {o.bkash_txn}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTrx(o.bkash_txn!)}
                                  className="text-slate-400 hover:text-pink-600 p-0.5 cursor-pointer"
                                  title="Copy TrxID"
                                >
                                  {copiedTrxId === o.bkash_txn ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-black text-rose-600 text-sm">৳{o.total.toFixed(0)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                                o.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : o.status === 'Confirmed'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : o.status === 'Preparing'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : o.status === 'Out for Delivery'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : o.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            {o.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'Confirmed')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                                title="Accept and verify this order"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. CUSTOMERS VIEW */}
        {activeNav === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customer by name, email, phone..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Username & Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Delivery Address</th>
                      <th className="p-4">Orders Placed</th>
                      <th className="p-4">Total Spent</th>
                      <th className="p-4 text-right">Order History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold text-slate-900 text-sm">{c.name}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-700">@{c.username}</p>
                          <p className="text-[11px] text-slate-600">{c.email}</p>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{c.phone}</td>
                        <td className="p-4 text-slate-600 max-w-xs truncate">{c.address}, {c.area}, {c.city}</td>
                        <td className="p-4 font-black text-slate-900">{c.orders_count} orders</td>
                        <td className="p-4 font-black text-rose-600 text-sm">৳{c.total_spent.toFixed(0)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedCustomerOrders(c)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                          >
                            View Orders ({c.orders_count})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. RESTAURANT SETTINGS VIEW */}
        {activeNav === 'settings' && settings && (
          <div className="max-w-3xl bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Restaurant Configuration & Branding</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Changes saved here immediately update the customer website, header, hero banner, cart, and checkout calculations.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Branding Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> 1. Brand Identity & Logo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Restaurant Name *</label>
                    <input
                      type="text"
                      value={settings.restaurant_name}
                      onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                      required
                      placeholder="ADN's Food"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Slogan</label>
                    <input
                      type="text"
                      value={settings.tagline || ''}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      placeholder="Premium Taste · Swift Kitchen"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Restaurant Logo with Device Upload + URL Options */}
                <ImageUploader
                  label="Restaurant Logo Image"
                  value={settings.logo_url || ''}
                  onChange={(val) => setSettings({ ...settings, logo_url: val })}
                  presets={PRESET_LOGOS}
                  aspectRatioHint="Square 1:1 or Round Icon"
                  helpText="Upload from your computer/phone or enter an image URL to customize the brand logo in the header and receipt."
                />
              </div>

              {/* Delivery & Ordering Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> 2. Delivery Charges & Operations
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery Charge (৳) *
                    </label>
                    <input
                      type="number"
                      value={settings.delivery_charge}
                      onChange={(e) => setSettings({ ...settings, delivery_charge: Number(e.target.value) })}
                      required
                      min={0}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none text-rose-600"
                    />
                    <span className="text-[10px] text-slate-700 block mt-1">Calculated in cart & checkout</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order Amount (৳) *</label>
                    <input
                      type="number"
                      value={settings.min_order}
                      onChange={(e) => setSettings({ ...settings, min_order: Number(e.target.value) })}
                      required
                      min={0}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-700 block mt-1">0 for no minimum</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kitchen Status</label>
                    <select
                      value={settings.restaurant_open ? '1' : '0'}
                      onChange={(e) => setSettings({ ...settings, restaurant_open: e.target.value === '1' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none"
                    >
                      <option value="1">🟢 Open (Accepting Orders)</option>
                      <option value="0">🔴 Closed (Pause Orders)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment & Contact Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> 3. bKash Payment & Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">bKash Merchant / Personal No.</label>
                    <input
                      type="text"
                      value={settings.bkash_number}
                      onChange={(e) => setSettings({ ...settings, bkash_number: e.target.value })}
                      required
                      placeholder="01712-345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 outline-none text-pink-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      placeholder="+880 1712-345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      placeholder="support@adnsfood.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Restaurant Branch / Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Road #11, Banani / Dhanmondi, Dhaka, Bangladesh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Top Announcement Banner</label>
                  <input
                    type="text"
                    value={settings.announcement}
                    onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                    placeholder="🔥 Free delivery on special platters! Fresh & Taste Guaranteed!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Hero Banner Customization */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> 4. Customer Page Hero Banner
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero Main Headline</label>
                  <input
                    type="text"
                    value={settings.hero_title || ''}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    placeholder="Delicious Food, Delivered Hot to Your Door."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero Subtitle Description</label>
                  <textarea
                    rows={2}
                    value={settings.hero_subtitle || ''}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    placeholder="Savor chef-crafted gourmet burgers, cheesy pizzas, and crispy fried chicken..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                  />
                </div>

                {/* Hero Featured Image with Device Upload + URL Options */}
                <ImageUploader
                  label="Customer Page Hero Featured Image"
                  value={settings.hero_image || ''}
                  onChange={(val) => setSettings({ ...settings, hero_image: val })}
                  aspectRatioHint="Landscape Banner / Dish Photo"
                  helpText="Upload a delicious food picture from your device or use an image URL for the homepage showcase."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-700">All changes save instantly to the database.</span>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-lg shadow-rose-600/20 cursor-pointer active:scale-95 transition-all"
                >
                  Save Restaurant Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ADD / EDIT FOOD MODAL */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-rose-600" />
                <span>{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</span>
              </h2>
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food Name *</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. ADN Mega Cheesy Burger"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none"
                  >
                    {['Burger', 'Pizza', 'Fried Chicken', 'Rice Bowls', 'Snacks & Fries', 'Beverages & Shakes', 'Desserts', 'Others'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={foodPrepTime}
                    onChange={(e) => setFoodPrepTime(e.target.value)}
                    placeholder="15-20 min"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  placeholder="Ingredients, taste profile, and preparation notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              {/* Food Photo with Device Upload + URL Options */}
              <ImageUploader
                label="Food Dish Photo"
                value={foodPhoto}
                onChange={setFoodPhoto}
                presets={PRESET_FOOD_PHOTOS}
                aspectRatioHint="Square 1:1 or 4:3"
                helpText="Upload a photo directly from your computer/phone or select one from quick presets."
              />


              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (৳) *</label>
                  <input
                    type="number"
                    value={foodOriginalPrice}
                    onChange={(e) => setFoodOriginalPrice(e.target.value)}
                    required
                    min={0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={foodDiscountType}
                    onChange={(e) => setFoodDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none"
                  >
                    <option value="none">None</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={foodDiscountValue}
                    onChange={(e) => setFoodDiscountValue(e.target.value)}
                    min={0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Calculated Final Price Notice */}
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Customer Final Selling Price:</span>
                <span className="text-base font-black text-rose-600 font-display">
                  ৳{calculatePreviewFinalPrice().toFixed(0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Availability</label>
                  <select
                    value={foodAvailability ? '1' : '0'}
                    onChange={(e) => setFoodAvailability(e.target.value === '1')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none"
                  >
                    <option value="1">Available (In Stock)</option>
                    <option value="0">Unavailable (Sold Out)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catalog Visibility</label>
                  <select
                    value={foodStatus}
                    onChange={(e) => setFoodStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none"
                  >
                    <option value="active">Active (Visible in Menu)</option>
                    <option value="inactive">Inactive (Hidden Draft)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {editingFood ? 'Save Changes' : 'Add Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS INSPECTOR MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Order Details</span>
                <h2 className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  {selectedOrderDetails.order_id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Delivery Specs */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">Customer</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrderDetails.customer_name}</p>
                <p className="text-slate-500">{selectedOrderDetails.phone}</p>
                <p className="text-slate-500">{selectedOrderDetails.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Delivery Address</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrderDetails.address}</p>
                <p className="text-slate-500">{selectedOrderDetails.area}, {selectedOrderDetails.city}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Ordered Dishes</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 bg-white max-h-48 overflow-y-auto">
                {selectedOrderDetails.items.map((i) => (
                  <div key={i.id} className="py-2 px-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {i.quantity}× {i.name}
                    </span>
                    <span className="font-black text-slate-900">৳{i.subtotal.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & bKash Cash Out Verification Alert */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Method:</span>
                  <span className="font-black text-slate-900 text-sm">{selectedOrderDetails.payment_method}</span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Payable Grand Total:</span>
                  <span className="text-xl font-black text-rose-600">৳{selectedOrderDetails.total.toFixed(0)}</span>
                </div>
              </div>

              {/* bKash Transaction Verification Box */}
              {selectedOrderDetails.payment_method === 'bKash' && (
                <div className="bg-pink-50/90 border-2 border-pink-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-900 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-pink-600 animate-ping" />
                      bKash Cash Out Verification
                    </span>
                    <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-md">
                      Expected Amount: ৳{selectedOrderDetails.total.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-pink-200">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Customer Transaction Number (TrxID):</p>
                      <p className="font-mono text-sm font-black text-pink-700 tracking-wider">
                        {selectedOrderDetails.bkash_txn || 'NO TRX ID SUBMITTED'}
                      </p>
                    </div>

                    {selectedOrderDetails.bkash_txn && (
                      <button
                        type="button"
                        onClick={() => handleCopyTrx(selectedOrderDetails.bkash_txn!)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold border border-pink-200 cursor-pointer transition-colors"
                      >
                        {copiedTrxId === selectedOrderDetails.bkash_txn ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedTrxId === selectedOrderDetails.bkash_txn ? 'Copied!' : 'Copy TrxID'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-pink-800">
                    💡 Check your bKash merchant/personal statement for this TrxID and amount (৳{selectedOrderDetails.total.toFixed(0)}). Once verified, click <strong>"Accept & Confirm Order"</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Order Workflow Controls */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                Order Processing & Status Actions
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Confirmed')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOrderDetails.status === 'Confirmed'
                      ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                      : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1. Accept / Confirm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Preparing')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOrderDetails.status === 'Preparing'
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>2. Kitchen Prep</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Out for Delivery')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOrderDetails.status === 'Out for Delivery'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>3. Out for Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Delivered')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOrderDetails.status === 'Delivered'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>4. Mark Delivered</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Cancelled')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOrderDetails.status === 'Cancelled'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject / Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Pending')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOrderDetails.status === 'Pending'
                      ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Set to Pending</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER ORDER HISTORY MODAL */}
      {selectedCustomerOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Customer Profile</span>
                <h2 className="text-xl font-black text-slate-900">{selectedCustomerOrders.name}</h2>
                <p className="text-xs text-slate-500">{selectedCustomerOrders.email} · {selectedCustomerOrders.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerOrders(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Order History ({selectedCustomerOrders.orders?.length || 0})
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl max-h-72 overflow-y-auto">
                {selectedCustomerOrders.orders && selectedCustomerOrders.orders.length > 0 ? (
                  selectedCustomerOrders.orders.map((o) => (
                    <div key={o.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{o.order_id}</span>
                        <p className="text-slate-500">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-black text-rose-600">৳{o.total.toFixed(0)}</span>
                        <span className="text-[10px] text-slate-400 block">{o.payment_method}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100">
                        {o.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">No orders placed yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
