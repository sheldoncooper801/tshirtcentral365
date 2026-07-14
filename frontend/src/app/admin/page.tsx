"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Logo from "@/components/logo";
import type { Order } from "@/types";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number | null;
  totalProducts: number;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: null,
    totalProducts: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get<{ orders: Order[]; total: number }>("/api/orders?per_page=100"),
          api.get<{ products: any[]; total: number }>("/api/products?per_page=100"),
        ]);

        const revenue = ordersRes.orders.reduce((sum, o) => sum + o.total, 0);
        setStats((s) => ({
          ...s,
          totalOrders: ordersRes.total,
          totalRevenue: revenue,
          totalProducts: productsRes.total,
        }));
        setOrders(ordersRes.orders.slice(0, 20));

        try {
          const usersRes = await api.get<any[]>("/api/admin/users");
          setStats((s) => ({ ...s, totalUsers: usersRes.length }));
        } catch {
          setStats((s) => ({ ...s, totalUsers: null }));
        }
      } catch (err) {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSendToProduction = async (order: Order) => {
    if (!order.printify_order_id) return;
    const key = `produce-${order.id}`;
    setActionLoading((s) => ({ ...s, [key]: true }));
    try {
      await api.post(`/api/printify/fulfillment/${order.printify_order_id}/send-to-production`);
      toast.success(`Order ${order.order_number} sent to production`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "processing" } : o))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send to production");
    } finally {
      setActionLoading((s) => ({ ...s, [key]: false }));
    }
  };

  const handleCancel = async (order: Order) => {
    if (!order.printify_order_id) return;
    const key = `cancel-${order.id}`;
    setActionLoading((s) => ({ ...s, [key]: true }));
    try {
      await api.post(`/api/printify/fulfillment/${order.printify_order_id}/cancel`);
      toast.success(`Order ${order.order_number} cancelled`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setActionLoading((s) => ({ ...s, [key]: false }));
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Total Users",
      value: stats.totalUsers !== null ? stats.totalUsers : "N/A",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      color: "bg-brand-50 text-brand-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/my-designs"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              My Designs
            </Link>
            <span className="text-sm font-medium text-brand-600">Admin</span>
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      {card.label}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {loading ? "—" : card.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              </div>
              {orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400">
                  No orders found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-medium text-gray-500">
                          Order #
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">
                          Customer
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">
                          Total
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">
                          Date
                        </th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map((order) => {
                        const email =
                          order.shipping_address?.email ||
                          order.notes ||
                          "—";
                        const isProducing = actionLoading[`produce-${order.id}`];
                        const isCancelling = actionLoading[`cancel-${order.id}`];
                        const hasPrintify = !!order.printify_order_id;

                        return (
                          <tr key={order.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {order.order_number}
                            </td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              {email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  statusColors[order.status] ||
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                              ${order.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              {hasPrintify && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleSendToProduction(order)}
                                    disabled={isProducing || isCancelling || order.status === "cancelled"}
                                    className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isProducing ? "Sending..." : "Send to Production"}
                                  </button>
                                  <button
                                    onClick={() => handleCancel(order)}
                                    disabled={isProducing || isCancelling || order.status === "cancelled"}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isCancelling ? "Cancelling..." : "Cancel"}
                                  </button>
                                </div>
                              )}
                              {!hasPrintify && (
                                <span className="text-xs text-gray-400">
                                  No Printify ID
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
