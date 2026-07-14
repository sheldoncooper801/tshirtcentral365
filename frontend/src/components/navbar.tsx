"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import Logo from "@/components/logo";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items?.length || 0;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex-shrink-0">
            <Logo className="h-8" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Products
            </Link>
            <Link href="/designer" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Designer
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Contact
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/cart" className="relative text-gray-600 hover:text-gray-900 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/my-designs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition hidden sm:block">
                My Designs
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition hidden sm:block">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
