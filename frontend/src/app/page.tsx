"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Logo from "@/components/logo";

export default function Home() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const [featured, setFeatured] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = getItemCount();

  useEffect(() => {
    api.get<any>("/api/catalog?featured_only=true&per_page=8&page=1")
      .then((res) => setFeatured(res.items || []))
      .catch(() => {});
  }, []);

  const categories = [
    { name: "Apparel", icon: "👕", desc: "T-shirts, hoodies, sweatshirts, tanks" },
    { name: "Drinkware", icon: "☕", desc: "Mugs, tumblers, water bottles" },
    { name: "Wall Art", icon: "🖼", desc: "Posters, canvases, framed prints" },
    { name: "Electronics", icon: "📱", desc: "Phone cases, laptop sleeves" },
    { name: "Bags", icon: "👜", desc: "Tote bags, backpacks, duffels" },
    { name: "Headwear", icon: "🧢", desc: "Caps, beanies, visors" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo className="h-8" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/printify/catalog" className="text-sm text-gray-600 hover:text-gray-900">Catalog</Link>
            <Link href="/designer" className="text-sm text-gray-600 hover:text-gray-900">Create</Link>
            <Link href="/printify/products" className="text-sm text-gray-600 hover:text-gray-900">Products</Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/my-designs" className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:block">My Designs</Link>
                <Link href="/dashboard" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">Dashboard</Link>
                <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900 font-medium">Log out</button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
                <Link href="/register" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">Start Selling</Link>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            <div className="px-4 py-3 space-y-1">
              <Link href="/printify/catalog" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Catalog</Link>
              <Link href="/designer" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Create</Link>
              <Link href="/printify/products" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Products</Link>
              <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cart {itemCount > 0 && `(${itemCount})`}</Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Dashboard</Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight">
              Create. Sell. <span className="text-brand-600">Ship.</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Launch your print-on-demand business with T-Shirt Central 365.
              1,691 products ready to customize — design them, list them, we handle the rest.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition text-lg">Get Started Free</Link>
              <Link href="/printify/catalog" className="px-8 py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-lg">Browse Catalog</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
            <p className="mt-3 text-gray-600">1,691 products across every category</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/printify/catalog?category=${cat.name}`}
                className="bg-white border border-gray-100 rounded-xl p-5 text-center hover:shadow-md hover:border-brand-200 transition group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition">{cat.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{cat.name}</div>
                <div className="text-xs text-gray-500 mt-1">{cat.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Popular Products</h2>
                <p className="mt-2 text-gray-600">Best-selling products</p>
              </div>
              <Link href="/printify/catalog?featured_only=true" className="text-brand-600 hover:text-brand-700 font-medium text-sm">View all &rarr;</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/printify/catalog/${item.id}`}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                    {item.images && item.images[0] ? (
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-300" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="text-5xl text-gray-200">👕</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-brand-600 transition text-sm line-clamp-2">{item.title}</h3>
                    {item.brand && <div className="text-xs text-gray-500 mt-1">{item.brand}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Pick a Product", desc: "Browse 1,691 products — tees, mugs, phone cases, posters, and more." },
              { step: "02", title: "Add Your Design", desc: "Upload your artwork and see it on real product mockups before listing." },
              { step: "03", title: "Sell & Earn", desc: "List on your store, we handle printing and shipping. You keep the profit." },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-4xl font-bold text-brand-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-dark-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "1,691", label: "Products" },
              { value: "30+", label: "Print Providers" },
              { value: "150+", label: "Countries" },
              { value: "Free", label: "To Start" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-brand-400">{s.value}</div>
                <div className="mt-2 text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo />
              </div>
              <p className="text-sm text-gray-500">Print-on-demand marketplace.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/printify/catalog" className="block text-sm text-gray-500 hover:text-gray-900">Catalog</Link>
                <Link href="/designer" className="block text-sm text-gray-500 hover:text-gray-900">Create Product</Link>
                <Link href="/printify/products" className="block text-sm text-gray-500 hover:text-gray-900">My Products</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Account</h4>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-sm text-gray-500 hover:text-gray-900">Dashboard</Link>
                <Link href="/printify/settings" className="block text-sm text-gray-500 hover:text-gray-900">Settings</Link>
                <Link href="/orders" className="block text-sm text-gray-500 hover:text-gray-900">Orders</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-gray-500 hover:text-gray-900">Terms</Link>
                <Link href="/privacy" className="block text-sm text-gray-500 hover:text-gray-900">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} T-Shirt Central 365. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
