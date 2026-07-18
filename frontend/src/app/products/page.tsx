"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Logo from "@/components/logo";
import ScrollReveal from "@/components/scroll-reveal";

const CATEGORY_FACETS = [
  { key: "Apparel", emoji: "👕" },
  { key: "Headwear", emoji: "🧢" },
  { key: "Footwear", emoji: "👟" },
  { key: "Drinkware", emoji: "☕" },
  { key: "Wall Art", emoji: "🖼️" },
  { key: "Bags", emoji: "👜" },
  { key: "Accessories", emoji: "💍" },
  { key: "Electronics", emoji: "📱" },
  { key: "Home", emoji: "🏠" },
  { key: "Stickers", emoji: "⭐" },
  { key: "Stationery", emoji: "✏️" },
];

function ShimmerCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100/50 overflow-hidden shadow-elevation-1">
      <div className="aspect-square shimmer" />
      <div className="p-5">
        <div className="h-3 shimmer rounded-full w-1/3 mb-3" />
        <div className="h-4 shimmer rounded-full w-3/4 mb-2" />
        <div className="h-4 shimmer rounded-full w-1/2 mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-5 shimmer rounded-full w-1/4" />
          <div className="h-6 shimmer rounded-full w-1/5" />
        </div>
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("");
  const perPage = 16;

  // Initialize from URL params
  useEffect(() => {
    const q = searchParams?.get("search") || "";
    const cat = searchParams?.get("category") || "";
    if (q) setSearch(q);
    if (cat) setCategory(cat);
  }, [searchParams]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sortBy) params.set("sort", sortBy);
    api.get<any>(`/api/catalog?${params}`)
      .then((res) => { setItems(res.items || []); setTotal(res.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, search, category, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex-shrink-0">
            <Logo className="h-7" />
          </Link>
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative group">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/60 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white transition-all duration-300 shadow-elevation-1 focus:shadow-elevation-2"
              />
            </div>
          </form>
          <Link href="/cart" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition px-3 py-2 rounded-xl hover:bg-gray-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Cart
          </Link>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-dark-950 via-[#0f172a] to-[#1a1040] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {category ? (
                <>{category}</>
              ) : search ? (
                <>Results for &ldquo;<span className="text-brand-300">{search}</span>&rdquo;</>
              ) : (
                <>Browse Products</>
              )}
            </h1>
            <p className="mt-3 text-gray-400">
              {loading ? "Loading..." : `${total.toLocaleString()} product${total !== 1 ? "s" : ""} available`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Facets */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORY_FACETS.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCategory(category === c.key ? "" : c.key); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                category === c.key
                  ? "bg-dark-950 text-white border-dark-950 shadow-elevation-2"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-elevation-1"
              }`}
            >
              <span className="mr-1.5">{c.emoji}</span> {c.key}
            </button>
          ))}
          {category && (
            <button onClick={() => { setCategory(""); setPage(1); }} className="px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-all">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Sort + Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {loading ? "" : `Showing ${Math.min((page - 1) * perPage + 1, total)}–${Math.min(page * perPage, total)} of ${total.toLocaleString()}`}
          </p>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="text-sm border-gray-200 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 py-2 pl-3 pr-8"
          >
            <option value="">Featured</option>
            <option value="title_asc">Name A–Z</option>
            <option value="title_desc">Name Z–A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ShimmerCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try a different search or category.</p>
            <button onClick={() => { setSearch(""); setCategory(""); setPage(1); }} className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-full hover:bg-brand-700 transition text-sm">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item, i) => (
              <ScrollReveal key={item.id} delay={(i % 4) + 1}>
                <Link
                  href={`/products/${item.id}`}
                  className="block bg-white rounded-2xl border border-gray-100/80 overflow-hidden shadow-elevation-1 card-hover group"
                >
                  <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                    {item.images && item.images[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="text-5xl text-gray-200">👕</div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-dark-950/0 group-hover:bg-dark-950/10 transition-all duration-300 flex items-center justify-center">
                      <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-dark-950 text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-elevation-2">
                        Quick View
                      </span>
                    </div>
                    {item.category && (
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-600 px-2 py-1 rounded-full shadow-sm">{item.category}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {item.brand && <div className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">{item.brand}</div>}
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors duration-200 text-sm line-clamp-2 leading-snug min-h-[2.5rem]">{item.title}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      {item.starting_price && (
                        <span className="text-base font-bold text-gray-900">From ${item.starting_price.toFixed(2)}</span>
                      )}
                      <span className="text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">View →</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                    page === pageNum
                      ? "bg-dark-950 text-white shadow-elevation-2"
                      : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={items.length < perPage}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProductsContent />
  );
}
