"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Logo from "@/components/logo";
import { getCostConfig } from "@/lib/costs";

interface ShippingAddress {
  full_name: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

declare global {
  interface Window {
    Square?: any;
  }
}

function SquareCardForm({ onTokenize }: { onTokenize: (token: string) => void }) {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const cardRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    const isSandbox = process.env.NEXT_PUBLIC_SQUARE_APP_ID?.startsWith("sandbox") ?? true;
    script.src = isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = async () => {
      if (window.Square && cardContainerRef.current) {
        try {
          const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";
          const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
          if (!appId || !locationId) {
            setReady(true);
            return;
          }
          const payments = window.Square.payments(appId, locationId);
          cardRef.current = await payments.card();
          await cardRef.current.attach(cardContainerRef.current);
          setReady(true);
        } catch (err) {
          console.error("Square init error:", err);
          setReady(true);
        }
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleTokenize = async () => {
    if (!cardRef.current) {
      toast.error("Payment form not loaded");
      return;
    }
    setLoading(true);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status === "OK" && result.token) {
        onTokenize(result.token);
      } else {
        const msg = result.errors?.[0]?.message || "Card tokenization failed";
        toast.error(msg);
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
  const squareConfigured = !!appId && !!locationId;

  if (!squareConfigured) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
        Square payment processing not yet configured. Add your Square Application ID and Location ID to .env.local.
      </div>
    );
  }

  return (
    <div>
      <div ref={cardContainerRef} className="min-h-[100px] mb-4" />
      <button
        onClick={handleTokenize}
        disabled={!ready || loading}
        className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState<ShippingAddress>({
    full_name: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const subtotal = getTotal();
  const [shippingRate, setShippingRate] = useState(5.99);
  const [taxRate, setTaxRate] = useState(0.08);
  const shippingCost = items.length > 0 ? shippingRate : 0;
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    getCostConfig().then((c) => { setShippingRate(c.shippingCost); setTaxRate(c.taxRate); });
    if (items.length === 0) { router.push("/cart"); return; }
    if (!user) { router.push("/login"); return; }
    setShipping((prev) => ({ ...prev, full_name: user.full_name || "", email: user.email || "" }));
    setLoading(false);
  }, [items, user, router]);

  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const submitOrder = useCallback(async (paymentToken?: string) => {
    if (!shipping.full_name || !shipping.line1 || !shipping.city || !shipping.state || !shipping.postal_code) {
      toast.error("Please fill in all required shipping fields");
      return;
    }
    setProcessing(true);
    try {
      const order = await api.post<any>("/api/orders", {
        shipping_address: {
          name: shipping.full_name, email: shipping.email,
          line1: shipping.line1, line2: shipping.line2,
          city: shipping.city, state: shipping.state,
          postal_code: shipping.postal_code, country: shipping.country,
        },
        items: items.map((item) => ({
          blueprint_id: item.blueprintId,
          printify_variant_id: item.variant.id,
          provider_id: item.provider.id,
          product_title: item.title,
          variant_title: item.variant.title,
          product_image: item.image,
          price: item.price,
          quantity: item.quantity,
          design_file_url: item.designFileUrl || null,
        })),
      });

      if (paymentToken) {
        await api.post("/api/payments/checkout", {
          order_id: order.id,
          payment_token: paymentToken,
        });
      }

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setProcessing(false);
    }
  }, [shipping, items, clearCart, router]);

  const handleTokenize = useCallback((token: string) => submitOrder(token), [submitOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (items.length === 0) return null;

  const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-4 py-2.5 border";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/cart" className="text-sm text-gray-600 hover:text-gray-900 font-medium">&larr; Back to Cart</Link>
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" required value={shipping.full_name} onChange={(e) => handleShippingChange("full_name", e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" required value={shipping.email} onChange={(e) => handleShippingChange("email", e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <input type="text" required value={shipping.line1} onChange={(e) => handleShippingChange("line1", e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input type="text" value={shipping.line2} onChange={(e) => handleShippingChange("line2", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input type="text" required value={shipping.city} onChange={(e) => handleShippingChange("city", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input type="text" required value={shipping.state} onChange={(e) => handleShippingChange("state", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input type="text" required value={shipping.postal_code} onChange={(e) => handleShippingChange("postal_code", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input type="text" required value={shipping.country} onChange={(e) => handleShippingChange("country", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Payment</h2>
              <SquareCardForm onTokenize={handleTokenize} />
              {processing && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full" />
                  Processing your order...
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-8">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex items-center gap-3">
                    <Image src={item.image} alt={item.title} width={40} height={40} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                      <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <span className="text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>${shippingCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
