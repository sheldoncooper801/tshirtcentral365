"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { getCostConfig } from "@/lib/costs";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getItemCount, getTotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const itemCount = getItemCount();
  const subtotal = getTotal();
  const [shipping, setShipping] = useState(5.99);
  const [taxRate, setTaxRate] = useState(0.08);

  useEffect(() => {
    getCostConfig().then((c) => { setShipping(c.shippingCost); setTaxRate(c.taxRate); });
  }, []);

  const shippingCost = items.length > 0 ? shipping : 0;
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  const handleCheckout = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            &larr; Continue Shopping
          </Link>
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Shopping Cart {itemCount > 0 && <span className="text-gray-400 font-normal">({itemCount} {itemCount === 1 ? "item" : "items"})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.variant.id} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-5">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.variant.title || Object.values(item.variant.options).join(" / ")}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">by {item.provider.name}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.variant.id)}
                        className="text-gray-400 hover:text-red-500 transition text-sm flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition text-sm"
                        >
                          −
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition text-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-8">
                <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-900">${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax (8%)</span>
                    <span className="text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
