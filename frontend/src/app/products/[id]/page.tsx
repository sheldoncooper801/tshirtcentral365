"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import toast from "react-hot-toast";
import Logo from "@/components/logo";

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [variants, setVariants] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const blueprintId = params.id as string;

  useEffect(() => {
    if (!blueprintId) return;
    setLoading(true);
    Promise.all([
      api.get<any>(`/api/catalog/${blueprintId}`),
      api.get<any[]>(`/api/printify/catalog/blueprints/${blueprintId}/providers`),
    ])
      .then(([p, provs]) => {
        setProduct(p);
        setProviders(Array.isArray(provs) ? provs : []);
        if (Array.isArray(provs) && provs.length > 0) {
          setSelectedProvider(String(provs[0].id));
          return api.get<any>(`/api/printify/catalog/blueprints/${blueprintId}/providers/${provs[0].id}/variants`);
        }
        return null;
      })
      .then((v) => { if (v) setVariants(v); })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [blueprintId]);

  useEffect(() => {
    if (product) {
      document.title = `${product.title} | T-Shirt Central 365`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", product.description || `Shop ${product.title} at T-Shirt Central 365`);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `${product.title} | T-Shirt Central 365`);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", product.description || `Shop ${product.title} at T-Shirt Central 365`);
    }
  }, [product]);

  const handleProviderChange = async (providerId: string) => {
    setSelectedProvider(providerId);
    setVariants(null);
    try {
      const v = await api.get<any>(`/api/printify/catalog/blueprints/${blueprintId}/providers/${providerId}/variants`);
      setVariants(v);
    } catch { toast.error("Failed to load variants"); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <p>Product not found</p>
        <Link href="/products" className="mt-4 inline-block text-brand-600 hover:underline">Browse all products</Link>
      </div>
    </div>
  );

  const allVariants: any[] = variants?.variants || [];

  const allOptionKeys = new Set<string>();
  allVariants.forEach((v) => Object.keys(v.options || {}).forEach((k) => allOptionKeys.add(k)));

  const optionGroups: Record<string, string[]> = {};
  allOptionKeys.forEach((key) => {
    optionGroups[key] = Array.from(new Set(allVariants.map((v) => v.options?.[key]).filter(Boolean)));
  });

  const selectedVariantObj = allVariants.find((v: any) => String(v.id) === selectedVariantId);
  const selectedProviderObj = providers.find((p: any) => String(p.id) === selectedProvider);
  const canAddToCart = !!selectedVariantObj && !!selectedProviderObj;
  const retailPrice = selectedVariantObj?.price ? (selectedVariantObj.price / 100).toFixed(2) : "0.00";

  const handleAddToCart = () => {
    if (!canAddToCart || !product) return;
    addItem({
      id: Date.now(),
      blueprintId: Number(blueprintId),
      title: product.title,
      image: product.images?.[0] || "",
      provider: { id: Number(selectedProvider), name: selectedProviderObj!.title || selectedProviderObj!.name || "" },
      variant: { id: Number(selectedVariantId), title: selectedVariantObj!.title || "", options: selectedVariantObj!.options || {} },
      price: parseFloat(retailPrice),
      quantity: 1,
      designFileUrl: "",
    });
    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 font-medium">&larr; All Products</Link>
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 aspect-square relative flex items-center justify-center overflow-hidden mb-4">
              {product.images && product.images[selectedImage] ? (
                <Image src={product.images[selectedImage]} alt={product.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <div className="text-8xl text-gray-200">👕</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 8).map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${selectedImage === i ? "border-brand-600" : "border-transparent hover:border-gray-300"}`}
                  >
                    <div className="relative w-full h-full"><Image src={img} alt="" fill className="object-cover" sizes="100px" /></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.brand && <span className="text-sm text-gray-500">{product.brand}</span>}
              {product.category && (
                <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{product.category}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-sm text-gray-500">{allVariants.length} variant options available</span>
            </div>

            {product.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Print Providers */}
            {providers.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Print Provider ({providers.length} available)</h3>
                <div className="space-y-2">
                  {providers.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(String(p.id))}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                        selectedProvider === String(p.id)
                          ? "border-brand-600 bg-brand-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{p.title || p.name}</div>
                          {p.location && <div className="text-xs text-gray-500 mt-0.5">{p.location}</div>}
                        </div>
                        {selectedProvider === String(p.id) && (
                          <span className="text-brand-600 text-sm font-medium">✓ Selected</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {variants && allVariants.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Options ({allVariants.length} variants)</h3>
                {Object.entries(optionGroups).map(([key, values]) => (
                  <div key={key} className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 capitalize">{key}s available ({values.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((v) => {
                        const matchingVariant = allVariants.find((av: any) => av.options?.[key] === v);
                        const isSelected = matchingVariant && String(matchingVariant.id) === selectedVariantId;
                        return (
                          <button
                            key={v}
                            onClick={() => matchingVariant && setSelectedVariantId(String(matchingVariant.id))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${isSelected ? "bg-brand-50 border-brand-600 text-brand-700" : "bg-gray-100 border-transparent text-gray-700 hover:border-gray-300"}`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Price */}
            {selectedVariantObj && (
              <div className="mt-6 text-2xl font-bold text-gray-900">${retailPrice}</div>
            )}

            {/* CTA */}
            <div className="mt-8 flex gap-3">
              <Link
                href={`/designer?blueprint=${blueprintId}&provider=${selectedProvider}`}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-center"
              >
                Customize This Product
              </Link>
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="flex-1 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Add to Cart
              </button>
            </div>

            {/* Meta */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-1">
              <div>Blueprint ID: {product.id}</div>
              {product.type && <div>Type: {product.type}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
