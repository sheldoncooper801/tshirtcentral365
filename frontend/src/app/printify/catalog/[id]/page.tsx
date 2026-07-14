"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function PrintifyBlueprintDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [variants, setVariants] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const id = Number(params.id);

    Promise.all([
      api.get<any>(`/api/catalog/${id}`),
      api.get<any[]>(`/api/printify/catalog/blueprints/${id}/providers`),
    ])
      .then(([bp, provs]) => {
        setProduct(bp);
        setProviders(Array.isArray(provs) ? provs : []);
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  const loadVariants = async (providerId: number) => {
    setLoadingVariants(true);
    setSelectedProvider(providers.find((p) => p.id === providerId));
    try {
      const res = await api.get<any>(`/api/printify/catalog/blueprints/${params.id}/providers/${providerId}/variants`);
      setVariants(res);
    } catch {
      toast.error("Failed to load variants");
    } finally {
      setLoadingVariants(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-500">Product not found</div>;

  const cleanDescription = (product.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/printify/catalog" className="text-sm text-gray-600 hover:text-gray-900">&larr; Catalog</Link>
          <Link href="/designer" className="text-sm text-brand-600 hover:text-brand-700 font-medium ml-auto">Create Product &rarr;</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-50 flex items-center justify-center">
                {product.images && product.images[selectedImage] ? (
                  <Image src={product.images[selectedImage]} alt={product.title} width={600} height={600} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-8xl text-gray-200">👕</div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {product.images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                        selectedImage === i ? "border-brand-600" : "border-transparent hover:border-gray-200"
                      }`}
                    >
                      <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">About this product</h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {cleanDescription || "No description available."}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-1">
                {product.brand && <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{product.brand}</span>}
                {product.category && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{product.category}</span>}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{product.title}</h1>
              {product.model && <p className="text-sm text-gray-500 mt-1">Model: {product.model}</p>}

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Print Provider</h3>
                {providers.length === 0 ? (
                  <p className="text-gray-500 text-sm">Loading providers...</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {providers.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => loadVariants(p.id)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition ${
                          selectedProvider?.id === p.id
                            ? "border-brand-600 bg-brand-50"
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">{p.title || p.name}</div>
                        {p.location && <div className="text-xs text-gray-500 mt-0.5">{p.location}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loadingVariants && (
                <div className="mt-4 text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
                  <p className="text-xs text-gray-400 mt-2">Loading variants...</p>
                </div>
              )}

              {variants && !loadingVariants && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {selectedProvider?.title || selectedProvider?.name} — {variants.variants?.length || 0} variants
                  </h4>

                  {(() => {
                    const allVars = variants.variants || [];
                    const allOptionKeys = new Set<string>();
                    allVars.forEach((v: any) => Object.keys(v.options || {}).forEach((k: string) => allOptionKeys.add(k)));
                    const optionGroups: Record<string, string[]> = {};
                    allOptionKeys.forEach((key) => {
                      optionGroups[key] = Array.from(new Set(allVars.map((v: any) => v.options?.[key]).filter(Boolean)));
                    });
                    return (
                      <>
                        {Object.entries(optionGroups).map(([key, values]) => (
                          <div key={key} className="mb-3">
                            <div className="text-xs text-gray-500 mb-1.5 capitalize font-medium">{key}s ({values.length})</div>
                            <div className="flex flex-wrap gap-1.5">
                              {values.map((val) => (
                                <span key={val} className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">{val}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="mt-3 text-xs text-gray-400">All variants: {allVars.map((v: any) => v.title).join(", ")}</div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="mt-6">
                <Link
                  href={`/designer?blueprint=${product.id}&provider=${selectedProvider?.id || ""}`}
                  className="block w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition text-center text-sm"
                >
                  Create Product with This Blueprint
                </Link>
              </div>

              <div className="mt-4 text-xs text-gray-400 text-center">Blueprint ID: {product.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
