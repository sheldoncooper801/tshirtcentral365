"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import Logo from "@/components/logo";
import ScrollReveal from "@/components/scroll-reveal";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const itemCount = getItemCount();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
    api.get<any>("/api/catalog?featured_only=true&per_page=8&page=1")
      .then((res) => setFeatured(res.items || []))
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
        Free shipping on orders over $50 · <Link href="/register" className="underline text-brand-300 hover:text-brand-200 transition">Get 10% off your first order</Link>
      </div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-8">
            <Link href="/" className="flex-shrink-0">
              <Logo className="h-8" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition relative group">
                Shop
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
              <Link href="/designer" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition relative group">
                Customize
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition relative group">
                Support
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            </div>
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/60 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white transition-all duration-300 shadow-elevation-1 focus:shadow-elevation-2"
                />
              </div>
            </form>
            <div className="flex items-center gap-2">
              <Link href="/cart" className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in shadow-glow">{itemCount}</span>
                )}
              </Link>
              <Link href="/login" className="hidden sm:flex p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex px-5 py-2.5 bg-dark-950 text-white text-sm font-medium rounded-full hover:bg-dark-900 transition-all duration-300 btn-premium shadow-elevation-2 hover:shadow-elevation-4">
                Get Started
              </Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all" aria-label="Toggle menu">
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100/50 pb-4 animate-fade-in">
              <form onSubmit={handleSearch} className="pt-3 pb-2">
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </form>
              <div className="space-y-0.5">
                {[
                  { href: "/products", label: "Shop" },
                  { href: "/designer", label: "Customize" },
                  { href: "/contact", label: "Support" },
                  { href: "/login", label: "Sign In" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition">{link.label}</Link>
                ))}
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-xl transition">Create Account</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-[#0f172a] to-[#1a1040] animate-gradient" style={{ backgroundSize: "200% 200%" }} />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[128px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-400/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[200px]" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40 relative">
          <div className="max-w-3xl">
            <div className={`transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <div className="inline-flex items-center gap-2.5 glass-brand rounded-full px-5 py-2 text-sm text-brand-200 mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Premium products, print-on-demand
              </div>
            </div>

            <h1 className={`text-5xl sm:text-6xl md:text-[5rem] font-bold tracking-tight leading-[1.02] text-balance transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              Your design.
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-200 bg-clip-text text-transparent">Delivered worldwide.</span>
            </h1>

            <p className={`mt-7 text-lg md:text-xl text-gray-400 max-w-lg leading-relaxed transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              Upload your artwork, preview it on premium products, and we&apos;ll print &amp; ship it. No minimums. No inventory.
            </p>

            <div className={`mt-10 flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <Link href="/products" className="px-8 py-4 bg-white text-dark-950 font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 text-center text-base shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] btn-premium">
                Shop Now
              </Link>
              <Link href="/designer" className="px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-center text-base hover:scale-[1.02] active:scale-[0.98]">
                Create Custom Design
              </Link>
            </div>

            {/* Social proof snippet in hero */}
            <div className={`mt-12 flex items-center gap-6 transition-all duration-700 delay-[400ms] ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-dark-950 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    {["SM", "JK", "ML", "AB", "TC"][i - 1]}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-semibold">2,400+</span> happy customers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar - Premium Glass */}
      <section className="relative -mt-1 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl shadow-elevation-3 border border-gray-100/50 p-1 -mt-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { title: "Free Shipping", sub: "Orders over $50", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
                { title: "Easy Returns", sub: "30-day policy", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg> },
                { title: "Secure Checkout", sub: "SSL encrypted", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg> },
                { title: "Custom Designs", sub: "Upload your art", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
              ].map((item, i) => (
                <div key={item.title} className={`py-5 px-4 text-center rounded-2xl hover:bg-gray-50/50 transition-colors duration-200 ${i > 0 ? "md:border-l border-gray-100/60" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-2.5 text-brand-600">{item.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold tracking-wide uppercase mb-4">
                <span className="w-8 h-px bg-brand-300" />
                Collections
                <span className="w-8 h-px bg-brand-300" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Shop by Category</h2>
              <p className="mt-4 text-gray-500 text-lg">Curated picks for every style</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              { name: "Apparel", desc: "Tees, hoodies & more", href: "/products?category=Apparel", bg: "from-slate-900 to-slate-800", emoji: "👕" },
              { name: "Drinkware", desc: "Mugs & tumblers", href: "/products?category=Drinkware", bg: "from-stone-800 to-stone-700", emoji: "☕" },
              { name: "Accessories", desc: "Socks, jewelry & more", href: "/products?category=Accessories", bg: "from-zinc-800 to-zinc-700", emoji: "💍" },
              { name: "Wall Art", desc: "Posters & canvases", href: "/products?category=Wall Art", bg: "from-neutral-800 to-neutral-700", emoji: "🖼️" },
            ].map((col, i) => (
              <ScrollReveal key={col.name} delay={i + 1}>
                <Link href={col.href} className="group relative rounded-2xl overflow-hidden aspect-[4/5] flex flex-col justify-end p-6 text-white shadow-elevation-2 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1.5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${col.bg} transition-all duration-700 group-hover:scale-110`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Floating emoji */}
                  <div className="absolute top-6 right-6 text-5xl opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500 rotate-12 group-hover:rotate-0">{col.emoji}</div>
                  <div className="relative mb-auto">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-lg group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500">
                      {col.emoji}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="text-xl font-bold tracking-tight">{col.name}</div>
                    <div className="text-sm text-white/60 mt-1">{col.desc}</div>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/0 group-hover:text-white/90 transition-all duration-300 translate-y-3 group-hover:translate-y-0">
                      Shop now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {featured.length > 0 && (
        <section className="py-24 bg-gray-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold tracking-wide uppercase mb-4">
                    <span className="w-8 h-px bg-brand-300" />
                    Trending
                    <span className="w-8 h-px bg-brand-300" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Best Sellers</h2>
                </div>
                <Link href="/products" className="text-brand-600 hover:text-brand-700 font-semibold text-sm hidden sm:inline-flex items-center gap-1.5 transition group">
                  View all
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {featured.map((item: any, i: number) => (
                <ScrollReveal key={item.id} delay={(i % 4) + 1}>
                  <Link href={`/products/${item.id}`} className="block bg-white rounded-2xl border border-gray-100/80 overflow-hidden shadow-elevation-1 card-hover group">
                    <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                      {item.images && item.images[0] ? (
                        <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 50vw, 25vw" />
                      ) : (
                        <div className="text-6xl text-gray-200">👕</div>
                      )}
                      {/* Quick view overlay */}
                      <div className="absolute inset-0 bg-dark-950/0 group-hover:bg-dark-950/10 transition-all duration-300 flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-dark-950 text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-elevation-2">
                          Quick View
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      {item.brand && <div className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">{item.brand}</div>}
                      <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors duration-200 text-sm line-clamp-2 leading-snug min-h-[2.5rem]">{item.title}</h3>
                      {item.starting_price && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">From ${item.starting_price.toFixed(2)}</span>
                        </div>
                      )}
                      {item.category && (
                        <div className="mt-2.5">
                          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link href="/products" className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold text-sm transition group">
                View all products
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold tracking-wide uppercase mb-4">
                <span className="w-8 h-px bg-brand-300" />
                Testimonials
                <span className="w-8 h-px bg-brand-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Loved by Customers</h2>
              <p className="mt-4 text-gray-500 text-lg">Real reviews from real people</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", location: "Austin, TX", rating: 5, text: "The quality of my custom hoodie blew me away. The colors are vibrant and the fabric is super soft. Already ordered two more!", product: "Custom Hoodie", initials: "SM" },
              { name: "James K.", location: "Portland, OR", rating: 5, text: "Ordered 50 custom t-shirts for our company retreat. Arrived in 5 days, perfect print quality on every single one.", product: "Bulk T-Shirts", initials: "JK" },
              { name: "Maria L.", location: "Miami, FL", rating: 5, text: "I designed a mug for my best friend's birthday and she absolutely loved it. The mockup tool made it so easy to get it right.", product: "Ceramic Mug", initials: "ML" },
            ].map((review, i) => (
              <ScrollReveal key={review.name} delay={i + 1}>
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-elevation-1 card-hover h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className={`w-4 h-4 ${s <= review.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm flex-1">&ldquo;{review.text}&rdquo;</p>
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">{review.initials}</div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                        <div className="text-xs text-gray-400">{review.location}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full font-semibold">{review.product}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold tracking-wide uppercase mb-4">
                <span className="w-8 h-px bg-brand-300" />
                Simple Process
                <span className="w-8 h-px bg-brand-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Three Steps. That&apos;s It.</h2>
              <p className="mt-4 text-gray-500 text-lg">From design to doorstep in days, not weeks</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[18%] right-[18%] h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            {[
              { step: "1", title: "Choose a Product", desc: "Pick from thousands of premium products — tees, mugs, phone cases, and more.", icon: "🎯" },
              { step: "2", title: "Add Your Design", desc: "Upload your artwork or use our designer. See a real-time preview before you buy.", icon: "🎨" },
              { step: "3", title: "We Handle the Rest", desc: "Printed on premium materials, quality-checked, and shipped to your door.", icon: "📦" },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i + 1}>
                <div className="relative text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-glow">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Step {item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs mx-auto text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-dark-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-brand-400 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 1691, suffix: "+", label: "Products" },
              { value: 30, suffix: "+", label: "Print Providers" },
              { value: 150, suffix: "+", label: "Countries Shipped" },
              { value: 99, suffix: "%", label: "Satisfaction Rate" },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i + 1}>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white"><CountUp target={s.value} suffix={s.suffix} /></div>
                  <div className="mt-2 text-gray-400 text-sm font-medium">{s.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-12 md:p-20 text-center">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-[100px]" />
              </div>
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Ready to create something amazing?</h2>
                <p className="text-brand-100 text-lg mb-10 max-w-lg mx-auto leading-relaxed">Shop our collection or design your own custom products. Free shipping on orders over $50.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/products" className="px-8 py-4 bg-white text-brand-700 font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 text-base shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] btn-premium">
                    Shop Now
                  </Link>
                  <Link href="/designer" className="px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-base hover:scale-[1.02] active:scale-[0.98]">
                    Create Custom Design
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">Custom products, printed on demand. Designed by you, shipped worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Shop</h4>
              <div className="space-y-2.5">
                {[
                  { href: "/products", label: "All Products" },
                  { href: "/products?category=Apparel", label: "Apparel" },
                  { href: "/products?category=Drinkware", label: "Drinkware" },
                  { href: "/designer", label: "Custom Design" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="block text-sm text-gray-500 hover:text-gray-900 transition">{link.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Account</h4>
              <div className="space-y-2.5">
                {[
                  { href: "/login", label: "Sign In" },
                  { href: "/register", label: "Create Account" },
                  { href: "/orders", label: "My Orders" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="block text-sm text-gray-500 hover:text-gray-900 transition">{link.label}</Link>
                ))}
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
                {[
                  { href: "/terms", label: "Terms of Service" },
                  { href: "/privacy", label: "Privacy Policy" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="block text-sm text-gray-500 hover:text-gray-900 transition">{link.label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div>&copy; {new Date().getFullYear()} T-Shirt Central 365. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Secure payments via Square</span>
            </div>
          </div>
        </div>
      </footer>

      <div className="h-20 md:hidden" />
    </div>
  );
}
