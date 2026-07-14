"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function PrintifyProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.get<any>(`/api/printify/products?page=${page}&limit=20`)
        .then((res) => {
          setProducts(res.data || []);
        })
        .catch(() => toast.error("Failed to load products"))
        .finally(() => setLoading(false));
    }
  }, [user, page]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/api/printify/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePublish = async (productId: string) => {
    try {
      await api.post(`/api/printify/products/${productId}/publish`);
      toast.success("Publishing initiated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    draft: "bg-yellow-100 text-yellow-700",
    archived: "bg-gray-100 text-gray-500",
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
            <Link href="/designer" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">
              + New Product
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Products</h1>
        <p className="text-gray-500 mb-8">Products synced from your account</p>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-4">🛍</div>
            <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
            <p className="text-gray-500 mt-1 mb-4">Create your first product from the catalog.</p>
            <Link href="/printify/catalog" className="text-brand-600 hover:underline font-medium">Browse Catalog</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  {p.images?.[0]?.src ? (
                    <Image src={p.images[0].src} alt={p.title} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-200">👕</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                  <div className="text-sm text-gray-500">
                    {p.variants?.length || 0} variants &middot; ID: {p.id}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.status] || "bg-gray-100 text-gray-500"}`}>
                  {p.status}
                </span>
                <div className="flex gap-2">
                  {p.status !== "active" && (
                    <button
                      onClick={() => handlePublish(p.id)}
                      className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
