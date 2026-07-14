"use client";

import { useEffect } from "react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Products error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Products Unavailable</h1>
        <p className="text-gray-500 mb-6">Could not load products. Please try again.</p>
        <button onClick={reset} className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition">
          Try again
        </button>
      </div>
    </div>
  );
}
