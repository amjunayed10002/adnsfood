import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, ChefHat, Bike, PackageCheck, XCircle, MapPin, Phone, Banknote, Calendar, Printer, RefreshCw } from 'lucide-react';
import type { Order, User } from '../types';
import { api } from '../api';

interface OrderTrackingViewProps {
  initialOrderId?: string;
  currentUser: User | null;
  onOpenAuth: () => void;
}

const STATUS_STEPS = [
  { key: 'Pending', label: 'Order Placed', icon: Clock, desc: 'Kitchen received your order' },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2, desc: 'Order verified by ADN manager' },
  { key: 'Preparing', label: 'Preparing', icon: ChefHat, desc: 'Chef cooking fresh meals' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Bike, desc: 'Rider on the way to you' },
  { key: 'Delivered', label: 'Delivered', icon: PackageCheck, desc: 'Enjoy your hot meal!' },
];

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderId,
  currentUser,
  onOpenAuth,
}) => {
  const [searchInput, setSearchInput] = useState(initialOrderId || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      handleSearch(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (currentUser) {
      loadMyOrders();
    }
  }, [currentUser]);

  const loadMyOrders = async () => {
    try {
      const orders = await api.getOrders();
      setMyOrders(orders);
      if (!currentOrder && orders.length > 0 && !initialOrderId) {
        setCurrentOrder(orders[0]);
      }
    } catch (err) {}
  };

  const handleSearch = async (orderIdToSearch?: string) => {
    const id = (orderIdToSearch || searchInput).trim();
    if (!id) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const order = await api.getOrderById(id);
      setCurrentOrder(order);
    } catch (err: any) {
      setErrorMsg(err.message || `No order found with ID "${id}". Please check your order ID.`);
      setCurrentOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: Order['status']) => {
    if (status === 'Cancelled') return -1;
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeStepIdx = currentOrder ? getStepIndex(currentOrder.status) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-rose-950/10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
            Live Kitchen Tracking
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
            Track Your Food Order
          </h1>
          <p className="text-sm text-rose-100 font-medium">
            Enter your Order ID (e.g. <strong>ADNF-20260825-XXXX</strong>) to see real-time preparation and delivery updates.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by Order ID (e.g. ADNF-20260825-7891)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-mono font-bold focus:outline-none shadow-md"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track Order</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Order Status Tracker View */}
      {currentOrder && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden divide-y divide-slate-100">
          {/* Order Header & Status Bar */}
          <div className="p-6 sm:p-8 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  {currentOrder.order_id}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    currentOrder.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : currentOrder.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}
                >
                  {currentOrder.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {new Date(currentOrder.created_at).toLocaleString()}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSearch(currentOrder.order_id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                <span>Live Refresh</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {currentOrder.status === 'Cancelled' ? (
            <div className="p-8 bg-rose-50/70 border-y border-rose-200 text-center space-y-2">
              <XCircle className="w-12 h-12 text-rose-600 mx-auto" />
              <h3 className="text-lg font-black text-rose-900">This Order Was Cancelled</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto font-medium">
                The restaurant cancelled this order. Any issues? Please contact ADN's Food helpline at 01712-345678.
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 text-center sm:text-left">
                Live Kitchen & Delivery Timeline
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx <= activeStepIdx;
                  const isCurrent = idx === activeStepIdx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative group">
                      {/* Step Circle */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                          isDone
                            ? 'bg-rose-600 text-white shadow-rose-600/30'
                            : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-rose-200 scale-110' : ''}`}
                      >
                        <StepIcon className="w-6 h-6" />
                      </div>

                      {/* Step Labels */}
                      <div className="mt-3 space-y-0.5">
                        <p
                          className={`text-xs font-extrabold ${
                            isDone ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-500 max-w-[130px] font-medium hidden sm:block">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Receipt Breakdown & Destination Cards */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: Items List */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ordered Food Items ({currentOrder.items.length})
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
                {currentOrder.items.map((it) => (
                  <div key={it.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                        alt={it.name}
                        className="w-12 h-12 rounded-xl object-cover bg-rose-50 border border-rose-100 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{it.name}</h4>
                        <span className="text-[11px] text-slate-500">
                          {it.quantity} × ৳{it.price.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-slate-900 shrink-0">
                      ৳{it.subtotal.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill totals */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Food Subtotal</span>
                  <span className="font-bold text-slate-900">৳{currentOrder.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-900">৳{currentOrder.delivery_charge.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
                  <span className="font-black text-slate-900">Grand Total</span>
                  <span className="text-xl font-black text-rose-600 font-display">
                    ৳{currentOrder.total.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Delivery & Payment Specs */}
            <div className="md:col-span-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Delivery Details
              </h3>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{currentOrder.customer_name}</p>
                    <p className="text-slate-600">{currentOrder.address}</p>
                    <p className="text-slate-500">{currentOrder.area}, {currentOrder.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{currentOrder.phone || 'Phone not given'}</span>
                </div>

                {currentOrder.instructions && (
                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-[11px] text-amber-900">
                    <strong>Instructions:</strong> "{currentOrder.instructions}"
                  </div>
                )}
              </div>

              {/* Payment Box */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
                Payment Information
              </h3>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Type</span>
                  <span className="font-bold text-slate-900">
                    {currentOrder.payment_method === 'bKash' ? 'bKash CashOut' : 'Cash on Delivery (COD)'}
                  </span>
                </div>

                {currentOrder.payment_method === 'bKash' && (
                  <div className="p-3 bg-pink-50 border border-pink-100 rounded-xl space-y-1">
                    <span className="text-[11px] text-pink-700 font-bold block">Submitted TrxID:</span>
                    <span className="font-mono font-black text-xs text-pink-950 tracking-wider">
                      {currentOrder.bkash_txn || 'Pending Verification'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Order History Carousel / List */}
      {currentUser && myOrders.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              My Recent Orders ({myOrders.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  setCurrentOrder(o);
                  setSearchInput(o.order_id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentOrder?.order_id === o.order_id
                    ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">{o.order_id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      o.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">{new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="font-black text-rose-600">৳{o.total.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
