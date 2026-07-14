"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api.get<Order>(`/api/orders/${params.id}`)
      .then(setOrder)
      .catch(() => router.push("/orders"))
      .finally(() => setLoading(false));
  }, [user, params.id, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;
  if (!order) return null;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const steps = ["pending", "processing", "shipped", "delivered"];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">&larr; Orders</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-gray-500 text-sm mt-1">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
            {order.status}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
          <div className="flex items-center">
            {steps.map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    i <= currentStep ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {i <= currentStep ? "✓" : i + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-2 capitalize">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-brand-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {order.tracking_number && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Tracking</h3>
            <div className="text-sm text-gray-600">
              <div>Tracking Number: <span className="font-mono">{order.tracking_number}</span></div>
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline mt-1 inline-block">
                  Track Package &rarr;
                </a>
              )}
            </div>
          </div>
        )}

        {order.printify_status && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Fulfillment</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Printify Status: <span className="font-medium capitalize">{order.printify_status}</span></div>
              {order.printify_order_id && <div>Printify Order: <span className="font-mono text-xs">{order.printify_order_id}</span></div>}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                {item.product_image ? (
                  <Image src={item.product_image} alt={item.product_title || ""} width={56} height={56} className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">👕</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{item.product_title || `Product #${item.product_id}`}</div>
                  {item.variant_title && <div className="text-sm text-gray-500">{item.variant_title}</div>}
                  <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                </div>
                <div className="font-medium text-gray-900">${item.total_price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>{order.shipping_address.name || ""}</div>
            <div>{order.shipping_address.line1 || ""}</div>
            {order.shipping_address.line2 && <div>{order.shipping_address.line2}</div>}
            <div>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</div>
            <div>{order.shipping_address.country}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>${order.shipping_cost.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${order.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
