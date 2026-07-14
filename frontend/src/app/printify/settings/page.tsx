"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function PrintifySettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [shopId, setShopId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.get<any>("/api/printify/connection")
        .then((res) => {
          setConnected(res.connected);
          setShopId(res.shop_id || "");
          if (res.connected) loadShops();
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const loadShops = async () => {
    try {
      const res = await api.get<any[]>("/api/printify/shops");
      setShops(Array.isArray(res) ? res : []);
    } catch {}
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const res = await api.post<any>("/api/printify/connection", {
        api_token: apiToken,
        shop_id: shopId,
      });
      setConnected(true);
      setShops(res.shops || []);
      toast.success("Connected!");
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/my-designs" className="text-sm text-gray-600 hover:text-gray-900 font-medium">My Designs</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Service Integration</h1>
        <p className="text-gray-500 mb-8">Connect your product service account to sync products, orders, and catalog.</p>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">P</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Product Service Account</h3>
              <p className="text-sm text-gray-500">{connected ? "Connected" : "Not connected"}</p>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {connected ? "Active" : "Inactive"}
            </div>
          </div>
        </div>

        {!connected ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Connect Product Service</h3>
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                <p className="text-xs text-gray-500 mb-2">
                  Find this in your product service account settings: API Tokens
                </p>
                <input
                  type="password"
                  required
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-sm"
                  placeholder="Your API token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop ID</label>
                <p className="text-xs text-gray-500 mb-2">
                  Leave blank to auto-detect from your account
                </p>
                <input
                  type="text"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-sm"
                  placeholder="e.g. 123456"
                />
              </div>
              <button
                type="submit"
                disabled={connecting}
                className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {shops.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Your Shops</h3>
                <div className="space-y-3">
                  {shops.map((shop: any) => (
                    <div key={shop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{shop.title}</div>
                        <div className="text-sm text-gray-500 capitalize">{shop.sales_channel} &middot; ID: {shop.id}</div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/printify/catalog?shop_id=${shop.id}`}
                          className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition"
                        >
                          Browse Catalog
                        </Link>
                        <Link
                          href={`/printify/products?shop_id=${shop.id}`}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition"
                        >
                          View Products
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/printify/catalog" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-center">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="font-medium text-gray-900 text-sm">Product Catalog</div>
                  <div className="text-xs text-gray-500">Browse all products</div>
                </Link>
                <Link href="/printify/products" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-center">
                  <div className="text-2xl mb-2">🛍</div>
                  <div className="font-medium text-gray-900 text-sm">My Products</div>
                  <div className="text-xs text-gray-500">Manage your products</div>
                </Link>
                <Link href="/printify/orders" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-medium text-gray-900 text-sm">Orders</div>
                  <div className="text-xs text-gray-500">Track and manage orders</div>
                </Link>
                <Link href="/designer" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-medium text-gray-900 text-sm">Create Product</div>
                  <div className="text-xs text-gray-500">Design a new product</div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
