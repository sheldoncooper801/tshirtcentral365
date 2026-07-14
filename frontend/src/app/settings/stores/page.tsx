"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { StoreConnection } from "@/types";
import toast from "react-hot-toast";

export default function StoresPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [platform, setPlatform] = useState("shopify");
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [wixInstanceId, setWixInstanceId] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.get<{ connections: StoreConnection[] }>("/api/integrations")
        .then((res) => setConnections(res.connections))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const body: any = {
        platform, store_name: storeName, access_token: accessToken,
      };
      if (storeUrl) body.store_url = storeUrl;
      if (platform === "wix" && wixInstanceId) {
        body.settings = { instance_id: wixInstanceId };
      }
      await api.post(`/api/integrations/${platform}`, body);
      toast.success("Store connected!");
      setShowConnect(false);
      setStoreName("");
      setStoreUrl("");
      setAccessToken("");
      setWixInstanceId("");
      const res = await api.get<{ connections: StoreConnection[] }>("/api/integrations");
      setConnections(res.connections);
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm("Disconnect this store?")) return;
    try {
      await api.delete(`/api/integrations/${id}`);
      setConnections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Store disconnected");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSync = async (id: number) => {
    try {
      const res = await api.post<any>(`/api/integrations/${id}/sync`);
      toast.success(`Synced ${res.orders_synced || 0} orders`);
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Connected Stores</h1>
          <button
            onClick={() => setShowConnect(true)}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
          >
            + Connect Store
          </button>
        </div>

        {showConnect && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Connect a Store</h3>
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "shopify", label: "Shopify", color: "bg-[#96BF48]" },
                    { id: "etsy", label: "Etsy", color: "bg-[#F1641E]" },
                    { id: "woocommerce", label: "WooCommerce", color: "bg-[#7B5EA7]" },
                    { id: "wix", label: "Wix", color: "bg-[#0C6EFC]" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${
                        platform === p.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Name</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-sm"
                  placeholder={platform === "shopify" ? "your-store" : platform === "wix" ? "My Wix Site" : "My Store"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Access Token</label>
                <input
                  type="password"
                  required
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-sm"
                  placeholder={platform === "wix" ? "Wix API access token" : "Store API access token"}
                />
              </div>
              {platform === "wix" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wix Instance ID</label>
                  <input
                    type="text"
                    value={wixInstanceId}
                    onChange={(e) => setWixInstanceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-sm"
                    placeholder="Found in your Wix site URL or developer dashboard"
                  />
                  <p className="text-xs text-gray-400 mt-1">Your Wix Account ID or Site Instance ID from the Wix Developer Center</p>
                </div>
              )}
              {(platform === "woocommerce" || platform === "wix") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Store URL</label>
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-sm"
                    placeholder={platform === "wix" ? "https://yoursite.wixsite.com/mysite" : "https://yourstore.com"}
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={connecting} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition">
                  {connecting ? "Connecting..." : "Connect"}
                </button>
                <button type="button" onClick={() => setShowConnect(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-lg font-medium text-gray-900">No stores connected</h3>
            <p className="text-gray-500 mt-1">Connect your Shopify, Etsy, WooCommerce, or Wix store to start selling.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                      c.platform === "shopify" ? "bg-[#96BF48]" :
                      c.platform === "etsy" ? "bg-[#F1641E]" :
                      c.platform === "woocommerce" ? "bg-[#7B5EA7]" :
                      c.platform === "wix" ? "bg-[#0C6EFC]" :
                      "bg-gray-400"
                    }`}>
                      {c.platform === "shopify" ? "S" :
                       c.platform === "etsy" ? "E" :
                       c.platform === "woocommerce" ? "WC" :
                       c.platform === "wix" ? "W" :
                       c.platform[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.store_name}</h3>
                      <div className="text-sm text-gray-500 capitalize">{c.platform}</div>
                      {c.last_synced_at && (
                        <div className="text-xs text-gray-400">Last synced: {new Date(c.last_synced_at).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(c.id)}
                      className="px-3 py-1.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition"
                    >
                      Sync
                    </button>
                    <button
                      onClick={() => handleDisconnect(c.id)}
                      className="px-3 py-1.5 border border-red-200 text-sm text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
