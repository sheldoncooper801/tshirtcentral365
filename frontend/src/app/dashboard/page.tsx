"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Logo from "@/components/logo";
import type { Product, Order } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.get<{ products: Product[]; total: number }>("/api/products/my?per_page=5")
        .then((res) => {
          setProducts(res.products);
          setStats((s) => ({ ...s, totalProducts: res.total }));
        })
        .catch(() => {});

      api.get<{ orders: Order[]; total: number }>("/api/orders?per_page=5")
        .then((res) => {
          setOrders(res.orders);
          const revenue = res.orders.reduce((sum, o) => sum + o.total, 0);
          setStats((s) => ({ ...s, totalOrders: res.total, totalRevenue: revenue }));
        })
        .catch(() => {});
    }
  }, [user]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/my-designs" className="text-sm text-gray-600 hover:text-gray-900 font-medium">My Designs</Link>
            <Link href="/designer" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">
              + New Product
            </Link>
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500">Total Products</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Products</h2>
              <Link href="/products" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {products.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400">
                  No products yet.{" "}
                  <Link href="/designer" className="text-brand-600 hover:underline">Create one</Link>
                </div>
              )}
              {products.map((p) => (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{p.title}</div>
                    <div className="text-sm text-gray-500">${p.retail_price} &middot; {p.variants.length} variants</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {p.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/orders" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400">No orders yet</div>
              )}
              {orders.map((o) => (
                <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{o.order_number}</div>
                    <div className="text-sm text-gray-500">${o.total.toFixed(2)} &middot; {o.items.length} items</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Connected Stores</h2>
          </div>
          <div className="px-6 py-8 text-center text-gray-400">
            <p>No stores connected yet.</p>
            <Link href="/settings/stores" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
              Connect a store
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Product Integration</h2>
            <Link href="/printify/settings" className="text-sm text-brand-600 hover:text-brand-700">Manage</Link>
          </div>
          <div className="px-6 py-8 text-center text-gray-400">
            <p>Browse our catalog of products and create listings.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/printify/settings" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">
                Connect Product Service
              </Link>
              <Link href="/printify/catalog" className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
