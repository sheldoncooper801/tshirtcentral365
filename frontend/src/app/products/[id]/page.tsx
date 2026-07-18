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
  const [variants, setVariants] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);
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
        const providers = Array.isArray(provs) ? provs : [];
        if (providers.length > 0) {
          const bestProvider = providers[0];
          return api.get<any>(`/api/printify/catalog/blueprints/${blueprintId}/providers/${bestProvider.id}/variants`);
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
    }
  }, [product]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">Product not found</p>
        <Link href="/products" className="mt-4 inline-block text-brand-600 hover:underline text-sm">Browse all products</Link>
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
  const canAddToCart = !!selectedVariantObj;
  const retailPrice = selectedVariantObj?.price ? (selectedVariantObj.price / 100).toFixed(2) : "0.00";

  const colorKey: string | undefined = Object.keys(optionGroups).find((k) => k.toLowerCase() === "color");
  const sizeKey: string | undefined = Object.keys(optionGroups).find((k) => k.toLowerCase() === "size");
  const colors = colorKey ? optionGroups[colorKey] : [];
  const sizes = sizeKey ? optionGroups[sizeKey] : [];

  const handleAddToCart = () => {
    if (!canAddToCart || !product) return;
    addItem({
      id: Date.now(),
      blueprintId: Number(blueprintId),
      title: product.title,
      image: product.images?.[0] || "",
      provider: { id: 0, name: "" },
      variant: { id: Number(selectedVariantId), title: selectedVariantObj!.title || "", options: selectedVariantObj!.options || {} },
      price: parseFloat(retailPrice),
      quantity: 1,
      designFileUrl: "",
    });
    toast.success("Added to cart!");
  };

  const selectColor = (color: string) => {
    if (!colorKey) return;
    const sizeVal = sizeKey ? selectedVariantObj?.options?.[sizeKey] : null;
    const match = allVariants.find((v: any) => {
      const matchColor = v.options?.[colorKey as string] === color;
      const matchSize = sizeKey && sizeVal ? v.options?.[sizeKey as string] === sizeVal : true;
      return matchColor && matchSize;
    });
    if (match) setSelectedVariantId(String(match.id));
    else {
      const anyMatch = allVariants.find((v: any) => v.options?.[colorKey as string] === color);
      if (anyMatch) setSelectedVariantId(String(anyMatch.id));
    }
  };

  const selectSize = (size: string) => {
    if (!sizeKey) return;
    const colorVal = colorKey ? selectedVariantObj?.options?.[colorKey] : null;
    const match = allVariants.find((v: any) => {
      const matchSize = v.options?.[sizeKey as string] === size;
      const matchColor = colorKey && colorVal ? v.options?.[colorKey as string] === colorVal : true;
      return matchSize && matchColor;
    });
    if (match) setSelectedVariantId(String(match.id));
    else {
      const anyMatch = allVariants.find((v: any) => v.options?.[sizeKey as string] === size);
      if (anyMatch) setSelectedVariantId(String(anyMatch.id));
    }
  };

  const cleanDesc = (product.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const descriptionPoints = cleanDesc.split(/\.\s+/).filter((s: string) => s.trim().length > 10);

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Products
          </Link>
          <Link href="/"><Logo /></Link>
          <div className="w-24" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 aspect-square relative flex items-center justify-center overflow-hidden mb-4">
              {product.images && product.images[selectedImage] ? (
                <Image src={product.images[selectedImage]} alt={product.title} fill className="object-contain p-4" sizes="(max-width: 768px) 100vw, 50vw" priority />
              ) : (
                <div className="text-8xl text-gray-200">👕</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.slice(0, 10).map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selectedImage === i ? "border-gray-900" : "border-gray-200 hover:border-gray-400"}`}
                  >
                    <div className="relative w-full h-full"><Image src={img} alt={`${product.title} view ${i + 1}`} fill className="object-cover" sizes="80px" /></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-1">
              {product.brand && <span className="text-sm text-gray-500">{product.brand}</span>}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product.title}</h1>

            {allVariants.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">{allVariants.length} variants</div>
            )}

            {selectedVariantObj && (
              <div className="mt-4 text-3xl font-bold text-gray-900">${retailPrice}</div>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-gray-900 mb-3">Colors &middot; {colors.length}</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const isSelected = selectedVariantObj?.options?.[colorKey!] === color;
                    return (
                      <button
                        key={color}
                        onClick={() => selectColor(color)}
                        title={color}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${isSelected ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 scale-110" : "border-gray-300 hover:border-gray-500"}`}
                        style={{ backgroundColor: getColorHex(color) }}
                      >
                        {isSelected && <svg className="w-4 h-4 mx-auto text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-gray-900 mb-3">Sizes &middot; {sizes.length}</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const isSelected = selectedVariantObj?.options?.[sizeKey!] === size;
                    return (
                      <button
                        key={size}
                        onClick={() => selectSize(size)}
                        className={`min-w-[48px] px-3 py-2 rounded-lg text-sm font-medium transition border ${isSelected ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other option groups */}
            {Object.entries(optionGroups).map(([key, values]) => {
              if (key === colorKey || key === sizeKey) return null;
              return (
                <div key={key} className="mt-6">
                  <div className="text-sm font-semibold text-gray-900 mb-3">{key} &middot; {values.length}</div>
                  <div className="flex flex-wrap gap-2">
                    {values.map((v) => {
                      const isSelected = selectedVariantObj?.options?.[key] === v;
                      return (
                        <button
                          key={v}
                          onClick={() => {
                            const match = allVariants.find((av: any) => av.options?.[key] === v);
                            if (match) setSelectedVariantId(String(match.id));
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${isSelected ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"}`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add to Cart */}
            <div className="mt-8 flex gap-3">
              <Link
                href={`/designer?blueprint=${blueprintId}`}
                className="flex-1 py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-center text-sm"
              >
                Customize
              </Link>
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="flex-[2] py-3.5 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                {canAddToCart ? "Add to Cart" : "Select Options"}
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-6 flex items-center justify-between py-4 border-t border-gray-100">
              {[
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>, label: "Free Shipping" },
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>, label: "Easy Returns" },
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>, label: "Secure Checkout" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-gray-500">
                  {t.icon}
                  <span className="text-xs font-medium">{t.label}</span>
                </div>
              ))}
            </div>

            {/* About Section (collapsible) */}
            {cleanDesc && (
              <div className="border-t border-gray-100">
                <button onClick={() => setAboutOpen(!aboutOpen)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="text-sm font-semibold text-gray-900">About this product</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${aboutOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {aboutOpen && (
                  <div className="pb-6">
                    <ul className="space-y-2">
                      {descriptionPoints.map((point: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                          <span className="text-gray-300 mt-1.5 flex-shrink-0">
                            <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>
                          </span>
                          <span>{point.trim()}{!point.endsWith(".") ? "." : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Size Guide (collapsible) */}
            {sizes.length > 0 && (
              <div className="border-t border-gray-100">
                <button onClick={() => setSizeGuideOpen(!sizeGuideOpen)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="text-sm font-semibold text-gray-900">Size Guide</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${sizeGuideOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {sizeGuideOpen && (
                  <div className="pb-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 px-3 text-left text-gray-500 font-medium"></th>
                          {sizes.map((s) => <th key={s} className="py-2 px-3 text-center text-gray-900 font-medium">{s}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-500">Width, in</td>
                          {sizes.map((s, i) => <td key={s} className="py-2 px-3 text-center text-gray-700">{(20 + i * 2).toFixed(2)}</td>)}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-gray-500">Length, in</td>
                          {sizes.map((s, i) => <td key={s} className="py-2 px-3 text-center text-gray-700">{(27 + i).toFixed(2)}</td>)}
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-3">All measurements refer to product dimensions. Size tolerance: ±1.50 in.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const COLOR_HEX_MAP: Record<string, string> = {
  white: "#ffffff", black: "#111111", red: "#dc2626", navy: "#1e3a5f", royal: "#2563eb",
  "forest green": "#166534", "irish green": "#228b22", "dark heather": "#374151",
  "sport grey": "#9ca3af", gray: "#9ca3af", grey: "#9ca3af", yellow: "#eab308",
  orange: "#f97316", pink: "#ec4899", purple: "#8b5cf6", maroon: "#7f1d1d",
  "carolina blue": "#93c5fd", "light blue": "#93c5fd", sand: "#d4a574", brown: "#78350f",
  "kelly green": "#16a34a", gold: "#ca8a04", charcoal: "#374151", heather: "#9ca3af",
  "silver": "#c0c0c0", beige: "#d4c5a9", olive: "#65a30d", teal: "#0d9488",
  coral: "#f87171", lavender: "#c4b5fd", mint: "#86efac", peach: "#fdba74",
  burgundy: "#7f1d1d", "dark green": "#166534", "light grey": "#d1d5db",
  "light gray": "#d1d5db", "natural": "#f5f0e8", "white / black": "#ffffff",
};

function getColorHex(name: string): string {
  const lower = name.toLowerCase().trim();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];
  if (lower.includes("black")) return "#111111";
  if (lower.includes("white")) return "#ffffff";
  if (lower.includes("red")) return "#dc2626";
  if (lower.includes("blue")) return "#2563eb";
  if (lower.includes("green")) return "#16a34a";
  if (lower.includes("grey") || lower.includes("gray")) return "#9ca3af";
  if (lower.includes("pink")) return "#ec4899";
  if (lower.includes("yellow")) return "#eab308";
  if (lower.includes("orange")) return "#f97316";
  if (lower.includes("purple")) return "#8b5cf6";
  if (lower.includes("navy")) return "#1e3a5f";
  if (lower.includes("brown")) return "#78350f";
  if (lower.includes("tan")) return "#d4a574";
  if (lower.includes("beige")) return "#d4c5a9";
  return "#d1d5db";
}
