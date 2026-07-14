"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function PrintifyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      api.get<any>(`/api/printify/orders?${params}`)
        .then((res) => setOrders(res.data || []))
        .catch(() => toast.error("Failed to load orders"))
        .finally(() => setLoading(false));
    }
  }, [user, page, statusFilter]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    shipped: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/my-designs" className="text-sm text-gray-600 hover:text-gray-900 font-medium">My Designs</Link>
            <Link href="/printify/settings" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Settings</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-500 mb-6">Track and manage your orders</p>

        <div className="flex gap-2 mb-6">
          {["", "pending", "in_progress", "completed", "shipped"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                statusFilter === s ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mt-1">Orders will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Order ID</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Items</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900">{o.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[o.status] || "bg-gray-100 text-gray-500"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{o.line_items?.length || 0} items</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ${((o.total || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
