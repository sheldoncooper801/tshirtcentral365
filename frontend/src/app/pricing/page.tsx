"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const monthlyPrices: Record<string, number> = { Starter: 0, Pro: 29, Enterprise: 99 };
  const annualPrices: Record<string, number> = { Starter: 0, Pro: 23, Enterprise: 79 };

  const plans = [
    {
      name: "Starter",
      price: annual ? annualPrices.Starter : monthlyPrices.Starter,
      period: "forever",
      description: "Perfect for trying out T-Shirt Central 365",
      features: [
        "Up to 10 products",
        "Basic analytics",
        "Shopify integration",
        "Standard support",
        "60% profit margin",
      ],
      cta: "Get Started Free",
      href: "/register",
      highlight: false,
    },
    {
      name: "Pro",
      price: annual ? annualPrices.Pro : monthlyPrices.Pro,
      period: annual ? "/mo (billed annually)" : "/month",
      description: "For growing sellers",
      features: [
        "Unlimited products",
        "Advanced analytics",
        "All store integrations",
        "Priority support",
        "70% profit margin",
        "Custom mockups",
        "Bulk order processing",
      ],
      cta: "Start Pro Trial",
      href: "/register",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: annual ? annualPrices.Enterprise : monthlyPrices.Enterprise,
      period: annual ? "/mo (billed annually)" : "/month",
      description: "For high-volume sellers",
      features: [
        "Everything in Pro",
        "80% profit margin",
        "Dedicated account manager",
        "Custom API access",
        "White-label options",
        "Advanced order routing",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      href: "/contact",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
            <Link href="/register" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-gray-600">Start free, upgrade when you&apos;re ready</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? "font-medium text-gray-900" : "text-gray-500"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition ${annual ? "bg-brand-600" : "bg-gray-300"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${annual ? "left-6" : "left-0.5"}`} />
            </button>
            <span className={`text-sm ${annual ? "font-medium text-gray-900" : "text-gray-500"}`}>Annual {annual && <span className="text-green-600 font-medium">Save 20%</span>}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-brand-600 shadow-lg shadow-brand-100 ring-1 ring-brand-600"
                  : "border-gray-200"
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Most Popular</div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
              </div>
              <p className="mt-2 text-gray-500 text-sm">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block text-center py-3 rounded-lg font-medium text-sm transition ${
                  plan.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
