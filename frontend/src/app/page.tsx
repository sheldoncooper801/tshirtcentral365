"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import Logo from "@/components/logo";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

export default function Home() {
  const { getItemCount } = useCart();
  const [featured, setFeatured] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const itemCount = getItemCount();

  useEffect(() => {
    api.get<any>("/api/catalog?featured_only=true&per_page=4&page=1")
      .then((res) => setFeatured(res.items || []))
      .catch(() => {});
    api.get<any>("/api/catalog?per_page=4&page=2")
      .then((res) => setNewArrivals(res.items || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Announcement Bar */}
      <div className="bg-dark-950 text-white text-center py-2.5 text-sm font-medium tracking-wide">
        Free shipping on orders over $50 · <Link href="/register" className="underline text-brand-300 hover:text-brand-200">Get 10% off your first order</Link>
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Logo className="h-8" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition">Shop</Link>
              <Link href="/designer" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition">Customize</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition">Support</Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{itemCount}</span>
                )}
              </Link>
              <Link href="/login" className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex px-4 py-2 bg-dark-950 text-white text-sm font-medium rounded-full hover:bg-dark-900 transition">
                Get Started
              </Link>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 pb-4">
              <form onSubmit={handleSearch} className="pt-3 pb-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </form>
              <div className="space-y-0.5">
                <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Shop</Link>
                <Link href="/designer" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Customize</Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Support</Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Sign In</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg">Create Account</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-dark-950 via-dark-900 to-brand-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-brand-400 rounded-full blur-[160px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-brand-200 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              1,691+ products ready to ship
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Your design.<br />
              <span className="text-brand-400">Delivered worldwide.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-lg leading-relaxed">
              Upload your artwork, preview it on premium products, and we&apos;ll print &amp; ship it. No minimums. No inventory.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="px-8 py-4 bg-white text-dark-950 font-semibold rounded-full hover:bg-gray-100 transition text-center text-base shadow-lg shadow-white/10"
              >
                Shop Now
              </Link>
              <Link
                href="/designer"
                className="px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition text-center text-base"
              >
                Create Custom Design
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              {
                title: "Free Shipping",
                sub: "Orders over $50",
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
              },
              {
                title: "Easy Returns",
                sub: "30-day policy",
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>,
              },
              {
                title: "Secure Checkout",
                sub: "SSL encrypted",
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
              },
              {
                title: "Custom Designs",
                sub: "Upload your art",
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
              },
            ].map((item) => (
              <div key={item.title} className="py-6 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-600">{item.icon}</div>
                <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Shop by Collection</h2>
            <p className="mt-3 text-gray-500 text-lg">Curated picks for every style</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                name: "Apparel",
                desc: "Tees, hoodies & more",
                href: "/products?category=Apparel",
                bg: "bg-gradient-to-br from-slate-900 to-slate-800",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="white" strokeWidth={1.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                ),
              },
              {
                name: "Drinkware",
                desc: "Mugs & tumblers",
                href: "/products?category=Drinkware",
                bg: "bg-gradient-to-br from-stone-800 to-stone-700",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="white" strokeWidth={1.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75c0 .414.168.75.375.75h3.75c.207 0 .375-.336.375-.75s-.168-.75-.375-.75H10.125c-.207 0-.375.336-.375.75z" />
                  </svg>
                ),
              },
              {
                name: "Accessories",
                desc: "Jewelry, socks & more",
                href: "/products?category=Accessories",
                bg: "bg-gradient-to-br from-zinc-800 to-zinc-700",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="white" strokeWidth={1.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                ),
              },
              {
                name: "Wall Art",
                desc: "Posters & canvases",
                href: "/products?category=Wall Art",
                bg: "bg-gradient-to-br from-neutral-800 to-neutral-700",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="white" strokeWidth={1.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                ),
              },
            ].map((col) => (
              <Link
                key={col.name}
                href={col.href}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] flex flex-col justify-end p-6 text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 ${col.bg} transition-all duration-500 group-hover:scale-105`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="relative mb-auto mt-6 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500">
                  {col.icon}
                </div>
                <div className="relative">
                  <div className="text-xl font-bold tracking-tight">{col.name}</div>
                  <div className="text-sm text-white/70 mt-1">{col.desc}</div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    Shop now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {featured.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Best Sellers</h2>
                <p className="mt-2 text-gray-500">What our customers love most</p>
              </div>
              <Link href="/products" className="text-brand-600 hover:text-brand-700 font-semibold text-sm hidden sm:inline-flex items-center gap-1 transition">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 group"
                >
                  <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                    {item.images && item.images[0] ? (
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="text-6xl text-gray-200">👕</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition text-sm line-clamp-2 leading-snug">{item.title}</h3>
                    {item.brand && <div className="text-xs text-gray-400 mt-1.5 uppercase tracking-wide">{item.brand}</div>}
                    {item.starting_price && (
                      <div className="mt-2 text-sm font-bold text-gray-900">From ${item.starting_price.toFixed(2)}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/products" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold text-sm transition">
                View all products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Loved by Customers</h2>
            <p className="mt-3 text-gray-500 text-lg">Real reviews from real people</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah M.",
                location: "Austin, TX",
                rating: 5,
                text: "The quality of my custom hoodie blew me away. The colors are vibrant and the fabric is super soft. Already ordered two more!",
                product: "Custom Hoodie",
              },
              {
                name: "James K.",
                location: "Portland, OR",
                rating: 5,
                text: "Ordered 50 custom t-shirts for our company retreat. Arrived in 5 days, perfect print quality on every single one. Incredible service.",
                product: "Bulk T-Shirts (50x)",
              },
              {
                name: "Maria L.",
                location: "Miami, FL",
                rating: 5,
                text: "I designed a mug for my best friend's birthday and she absolutely loved it. The mockup tool made it so easy to get it right.",
                product: "Custom Ceramic Mug",
              },
            ].map((review) => (
              <div key={review.name} className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition">
                <StarRating rating={review.rating} />
                <p className="mt-4 text-gray-600 leading-relaxed text-sm">&ldquo;{review.text}&rdquo;</p>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                    <div className="text-xs text-gray-400">{review.location}</div>
                  </div>
                  <div className="text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full font-medium">{review.product}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Three Steps. That&apos;s It.</h2>
            <p className="mt-3 text-gray-500 text-lg">From design to doorstep in days, not weeks</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gray-200" />
            {[
              { step: "1", title: "Choose a Product", desc: "Pick from 1,691+ premium products — tees, mugs, phone cases, and more." },
              { step: "2", title: "Add Your Design", desc: "Upload your artwork or use our designer. See a real-time preview before you buy." },
              { step: "3", title: "We Handle the Rest", desc: "Printed on premium materials, quality-checked, and shipped to your door." },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-6 relative z-10">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-dark-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 1691, suffix: "+", label: "Products" },
              { value: 30, suffix: "+", label: "Print Providers" },
              { value: 150, suffix: "+", label: "Countries Shipped" },
              { value: 99, suffix: "%", label: "Satisfaction Rate" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-white"><CountUp target={s.value} suffix={s.suffix} /></div>
                <div className="mt-2 text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 to-brand-800 text-white p-12 md:p-16 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Find something you love?</h2>
              <p className="text-brand-100 text-lg mb-8 max-w-md mx-auto">Shop our collection of premium custom products. Free shipping on orders over $50.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products" className="px-8 py-4 bg-white text-brand-700 font-semibold rounded-full hover:bg-gray-100 transition text-base shadow-lg">
                  Shop Now
                </Link>
                <Link href="/designer" className="px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition text-base">
                  Create Custom Design
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">Custom products, printed on demand. Designed by you, shipped worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Shop</h4>
              <div className="space-y-2.5">
                <Link href="/products" className="block text-sm text-gray-500 hover:text-gray-900 transition">All Products</Link>
                <Link href="/products?category=Apparel" className="block text-sm text-gray-500 hover:text-gray-900 transition">Apparel</Link>
                <Link href="/products?category=Drinkware" className="block text-sm text-gray-500 hover:text-gray-900 transition">Drinkware</Link>
                <Link href="/designer" className="block text-sm text-gray-500 hover:text-gray-900 transition">Custom Design</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Account</h4>
              <div className="space-y-2.5">
                <Link href="/login" className="block text-sm text-gray-500 hover:text-gray-900 transition">Sign In</Link>
                <Link href="/register" className="block text-sm text-gray-500 hover:text-gray-900 transition">Create Account</Link>
                <Link href="/orders" className="block text-sm text-gray-500 hover:text-gray-900 transition">My Orders</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Support</h4>
              <div className="space-y-2.5">
                <Link href="/contact" className="block text-sm text-gray-500 hover:text-gray-900 transition">Contact Us</Link>
                <span className="block text-sm text-gray-400">customerservice@tshirtcentral365.com</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Legal</h4>
              <div className="space-y-2.5">
                <Link href="/terms" className="block text-sm text-gray-500 hover:text-gray-900 transition">Terms of Service</Link>
                <Link href="/privacy" className="block text-sm text-gray-500 hover:text-gray-900 transition">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div>&copy; {new Date().getFullYear()} T-Shirt Central 365. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Secure payments via Square</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom spacing for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
