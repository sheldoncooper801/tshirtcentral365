"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface SavedDesign {
  id: number;
  title: string;
  blueprint_id: number;
  provider_id: number;
  variant_id: number | null;
  design_url: string;
  front_design_url: string | null;
  back_design_url: string | null;
  color: string | null;
  size: string | null;
  design_config: any;
  created_at: string;
}

export default function MyDesignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadDesigns();
  }, [user]);

  const loadDesigns = async () => {
    setLoading(true);
    try {
      const res = await api.get<SavedDesign[]>("/api/designs");
      setDesigns(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error("Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  const deleteDesign = async (id: number) => {
    setDeleting(id);
    try {
      await api.delete(`/api/designs/${id}`);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast.success("Design deleted");
    } catch (err: any) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const openInDesigner = (design: SavedDesign) => {
    router.push(`/designer?blueprint=${design.blueprint_id}&provider=${design.provider_id}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
            <p className="text-gray-500 mt-1">Your saved designs ready for production</p>
          </div>
          <Link
            href="/designer"
            className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Design
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No saved designs yet</h3>
            <p className="text-gray-500 mb-6">Create your first design to get started</p>
            <Link
              href="/designer"
              className="inline-flex px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
            >
              Start Designing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <div key={design.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition group">
                <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                  {design.design_url ? (
                    <img
                      src={design.design_url}
                      alt={design.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition p-4"
                    />
                  ) : (
                    <div className="text-4xl text-gray-200">🎨</div>
                  )}
                  {design.color && (
                    <div
                      className="absolute top-3 left-3 w-5 h-5 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: getColorHex(design.color) }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{design.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {design.color && <span>{design.color}</span>}
                    {design.size && <span>• {design.size}</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {new Date(design.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openInDesigner(design)}
                      className="flex-1 py-2 bg-brand-50 text-brand-700 text-xs font-medium rounded-lg hover:bg-brand-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDesign(design.id)}
                      disabled={deleting === design.id}
                      className="py-2 px-3 text-red-400 text-xs font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deleting === design.id ? "..." : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const COLOR_HEX: Record<string, string> = {
  black: "#000000", white: "#FFFFFF", navy: "#1E3A5F", red: "#DC2626",
  forest: "#166534", sand: "#D4A574", pink: "#EC4899", royal: "#2563EB",
  charcoal: "#374151", gray: "#9CA3AF", grey: "#9CA3AF", gold: "#F59E0B",
  purple: "#7C3AED", orange: "#F97316", brown: "#92400E", burgundy: "#7F1D1D",
};

function getColorHex(name: string): string {
  return COLOR_HEX[name.toLowerCase()] || "#9CA3AF";
}
