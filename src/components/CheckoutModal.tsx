import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, CreditCard, Banknote, ShieldCheck, Copy, Check, AlertCircle, ArrowRight, Loader2, User as UserIcon } from 'lucide-react';
import type { CartItem, Settings, User } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  settings: Settings | null;
  currentUser: User | null;
  onClose: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSubmitOrder: (orderData: {
    items: { id: number; quantity: number }[];
    address: string;
    area: string;
    city: string;
    instructions: string;
    payment_method: 'COD' | 'bKash';
    bkash_txn?: string;
  }) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cart,
  settings,
  currentUser,
  onClose,
  onOpenAuth,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  const [address, setAddress] = useState(currentUser?.address || '');
  const [area, setArea] = useState(currentUser?.area || 'Banani / Dhanmondi');
  const [city, setCity] = useState(currentUser?.city || 'Dhaka');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash'>('COD');
  const [bkashStep, setBkashStep] = useState<1 | 2>(1);
  const [bkashTxn, setBkashTxn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (!address && currentUser.address) setAddress(currentUser.address);
      if (!area && currentUser.area) setArea(currentUser.area);
      if (!city && currentUser.city) setCity(currentUser.city);
    }
  }, [currentUser]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = settings?.delivery_charge ?? 60;
  const grandTotal = subtotal + deliveryCharge;

  const handleCopyBkash = () => {
    if (settings?.bkash_number) {
      navigator.clipboard.writeText(settings.bkash_number);
      setCopiedBkash(true);
      setTimeout(() => setCopiedBkash(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('Please login or register before placing your order.');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your delivery street/house address.');
      return;
    }

    if (paymentMethod === 'bKash') {
      if (bkashStep === 1) {
        setBkashStep(2);
        return;
      }
      if (!bkashTxn.trim()) {
        setErrorMsg('Please enter your bKash Transaction ID (e.g. BK92A761XQ).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmitOrder({
        items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
        address: address.trim(),
        area: area.trim(),
        city: city.trim(),
        instructions: instructions.trim(),
        payment_method: paymentMethod,
        bkash_txn: paymentMethod === 'bKash' ? bkashTxn.trim() : undefined,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-rose-100 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-pink-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Checkout & Delivery</h2>
              <p className="text-xs text-slate-500 font-medium">Complete your details to place the order</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Auth Guard Banner if not logged in */}
          {!currentUser ? (
            <div className="p-6 bg-rose-50/80 border border-rose-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Login First or Register First</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  You need an authenticated ADN's Food account before you can continue to checkout and track your order.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Login / Register
                </button>
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Customer Info Profile Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-rose-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Name</span>
                    <span className="font-bold text-slate-800">{currentUser.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Phone</span>
                    <span className="font-bold text-slate-800">{currentUser.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email</span>
                    <span className="font-bold text-slate-800 truncate block">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  Delivery Destination
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Dhaka"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Area / Neighborhood</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Dhanmondi, Gulshan, Banani, Uttara"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full House / Street / Floor Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Road #, Flat/Floor #, landmark..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Special Cooking / Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Please don't make it too spicy, ring doorbell twice"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* 3. Payment Method Choice */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                  Select Payment Method
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* COD */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => {
                        setPaymentMethod('COD');
                        setBkashStep(1);
                      }}
                      className="mt-1 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-900">Cash on Delivery</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pay in cash directly when your food arrives at your door.</p>
                    </div>
                  </label>

                  {/* bKash */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'bKash'
                        ? 'border-pink-600 bg-pink-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="bKash"
                      checked={paymentMethod === 'bKash'}
                      onChange={() => setPaymentMethod('bKash')}
                      className="mt-1 text-pink-600 focus:ring-pink-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-pink-600 text-white text-[10px] font-black">bKash</span>
                        <span className="font-bold text-sm text-slate-900">bKash Payment</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Send payment via bKash CashOut & submit Transaction ID.</p>
                    </div>
                  </label>
                </div>

                {/* bKash Workflow Container */}
                {paymentMethod === 'bKash' && (
                  <div className="bg-pink-50/80 border-2 border-pink-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
                    {/* bKash Header & Copy Button */}
                    <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          bKash
                        </span>
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-500">Restaurant bKash Cash Out Number</p>
                          <p className="text-base font-black text-pink-700 tracking-wider font-mono">
                            {settings?.bkash_number || '01712-345678'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyBkash}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedBkash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBkash ? 'Copied!' : 'Copy Number'}</span>
                      </button>
                    </div>

                    {/* Step by Step Cash Out Guide */}
                    <div className="bg-white/90 rounded-xl p-4 border border-pink-100 space-y-2 text-xs text-slate-700">
                      <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                        <span className="font-black text-pink-800 uppercase tracking-wide text-[11px]">
                          bKash Cash Out Steps:
                        </span>
                        <span className="font-black text-rose-600">Amount: ৳{grandTotal.toFixed(0)}</span>
                      </div>
                      
                      <ol className="space-y-1.5 text-[11px] text-slate-600 pl-1">
                        <li className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Open your bKash App or dial <strong>*247#</strong></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Select <strong>Cash Out</strong> option</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Enter Restaurant bKash Number: <strong>{settings?.bkash_number || '01712-345678'}</strong></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                          <span>Enter Amount: <strong>৳{grandTotal.toFixed(0)}</strong></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">5</span>
                          <span>Enter your bKash PIN to confirm payment</span>
                        </li>
                      </ol>
                    </div>

                    {/* Transaction Number Input Field */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-pink-200">
                      <label className="block text-xs font-black text-slate-900">
                        Transaction Number (TrxID) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={bkashTxn}
                        onChange={(e) => setBkashTxn(e.target.value.toUpperCase())}
                        placeholder="e.g. BK92A761XQ or 8A91KL02"
                        required={paymentMethod === 'bKash'}
                        className="w-full px-3.5 py-3 rounded-xl border-2 border-pink-300 font-mono font-bold text-sm tracking-wider text-slate-900 bg-pink-50/30 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none uppercase"
                      />
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                        <span>Admin will verify this Transaction ID and accept your order immediately.</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Order Summary Preview */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Summary</h4>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="py-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate max-w-xs">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        ৳{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">৳{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charge</span>
                    <span className="font-bold text-slate-800">৳{deliveryCharge.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                    <span className="font-black text-slate-900">Total Payable</span>
                    <span className="text-lg font-black text-rose-600">৳{grandTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-black text-sm shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Place Order (৳{grandTotal.toFixed(0)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
