"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const CATEGORIES = ["All", "Apparel", "Drinkware", "Electronics", "Wall Art", "Bags", "Headwear", "Accessories", "Home", "Stickers", "Stationery", "Footwear"];

export default function PrintifyCatalogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const perPage = 24;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      api.get<any>(`/api/catalog?${params}`)
        .then((res) => { setItems(res.items || []); setTotal(res.total || 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, page, category, search]);

  useEffect(() => {
    if (user) {
      api.get<any[]>("/api/catalog/brands/list").then(setBrands).catch(() => {});
    }
  }, [user]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex-1 max-w-md mx-8">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search 1,691 products..."
              className="w-full rounded-lg border-gray-200 px-4 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/my-designs" className="text-sm text-gray-600 hover:text-gray-900 font-medium">My Designs</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} products</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c === "All" ? "" : c); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                (c === "All" && !category) || category === c
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="text-gray-500 mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item: any) => (
              <Link
                key={item.id}
                href={`/printify/catalog/${item.id}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition group"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {item.images && item.images[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-5xl text-gray-200">👕</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 group-hover:text-brand-600 transition text-sm line-clamp-2 leading-tight">{item.title}</h3>
                  {item.brand && <div className="text-xs text-gray-500 mt-1">{item.brand}</div>}
                  {item.category && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{item.category}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
            >
              &larr; Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
