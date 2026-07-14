"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import Logo from "@/components/logo";

const CATEGORY_FACETS = [
  { key: "Apparel", emoji: "👕" },
  { key: "Drinkware", emoji: "☕" },
  { key: "Wall Art", emoji: "🖼️" },
  { key: "Bags", emoji: "👜" },
  { key: "Accessories", emoji: "🧢" },
  { key: "Electronics", emoji: "📱" },
  { key: "Home", emoji: "🏠" },
  { key: "Stickers", emoji: "⭐" },
  { key: "Stationery", emoji: "✏️" },
  { key: "Headwear", emoji: "🧢" },
];

export default function ProductsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const perPage = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    api.get<any>(`/api/catalog?${params}`)
      .then((res) => { setItems(res.items || []); setTotal(res.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, search, category]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex-1 max-w-md mx-8">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search 1,691+ products..."
              className="w-full rounded-lg border-gray-200 px-4 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Products</h1>
            <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} products available</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORY_FACETS.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCategory(category === c.key ? "" : c.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                category === c.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              <span className="mr-1">{c.emoji}</span> {c.key}
            </button>
          ))}
          {category && (
            <button onClick={() => { setCategory(""); setPage(1); }} className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition">
              ✕ Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="text-gray-500 mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-300 transition group"
              >
                <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                  {item.images && item.images[0] ? (
                    <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="text-5xl text-gray-200">👕</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-brand-600 transition line-clamp-2">{item.title}</h3>
                  {item.brand && <div className="text-xs text-gray-500 mt-1">{item.brand}</div>}
                  <div className="flex items-center gap-2 mt-2">
                    {item.category && (
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.category}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {total > perPage && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {Math.ceil(total / perPage)}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={items.length < perPage}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
