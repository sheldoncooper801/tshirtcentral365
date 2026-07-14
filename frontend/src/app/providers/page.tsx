"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/logo";
import { api } from "@/lib/api";
import type { PrintProvider } from "@/types";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<PrintProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ providers: PrintProvider[]; total: number }>("/api/providers")
      .then((res) => setProviders(res.providers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Print Providers</h1>
        <p className="text-gray-500 mb-8">Our network of fulfillment partners worldwide</p>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="h-10 w-10 bg-gray-100 rounded-lg mb-4" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="text-lg font-medium text-gray-900">No providers yet</h3>
            <p className="text-gray-500 mt-1">Providers will appear here once onboarded.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-4">
                  {p.logo_url ? (
                    <Image src={p.logo_url} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                      <span className="text-brand-600 font-bold text-sm">{p.name[0]}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.rating && (
                      <div className="text-sm text-yellow-500">
                        {"★".repeat(Math.round(p.rating))} {p.rating}
                      </div>
                    )}
                  </div>
                </div>
                {p.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.description}</p>}
                <div className="space-y-2 text-sm text-gray-500">
                  {p.fulfillment_time_days && <div>Fulfillment: {p.fulfillment_time_days} days</div>}
                  {p.countries && <div>Ships to: {p.countries.length} countries</div>}
                  {p.product_types && <div>Products: {p.product_types.join(", ")}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
