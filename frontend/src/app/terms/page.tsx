"use client";

import Link from "next/link";
import Logo from "@/components/logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-3 text-gray-500">Last updated: July 2026</p>

        <div className="mt-10 space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using T-Shirt Central 365 (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Platform. We reserve the right to modify these terms at any time.
              Continued use after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Accounts</h2>
            <p>
              You must create an account to access certain features. You are responsible for maintaining the confidentiality
              of your credentials and for all activity under your account. You agree to provide accurate, current, and complete
              information during registration and to update it as necessary. We may suspend or terminate accounts that violate
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Products &amp; Orders</h2>
            <p>
              The Platform enables you to browse, customize, and purchase print-on-demand products. Product descriptions, images, and
              pricing are set by T-Shirt Central 365. We facilitate order fulfillment through third-party print providers but do not
              guarantee delivery timelines. All sales are subject to availability and fulfillment partner capacity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Payment &amp; Refunds</h2>
            <p>
              Payments are processed through our third-party payment providers. You agree to pay all charges associated with
              your orders. Refund requests must be submitted within 30 days of delivery. We reserve the right to issue refunds
              at our discretion. Chargebacks may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Intellectual Property</h2>
            <p>
              You retain ownership of designs you upload. By uploading content, you grant us a non-exclusive license to
              produce, display, and fulfill orders containing your designs. You warrant that your designs do not infringe on
              third-party intellectual property rights. We may remove content that violates intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              T-Shirt Central 365 is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any
              indirect, incidental, or consequential damages. Our total liability shall not exceed the amount paid by you
              in the twelve months preceding the claim. We are not responsible for third-party print provider errors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a href="mailto:customerservice@tshirtcentral365.com" className="text-brand-600 hover:text-brand-700 font-medium">
                customerservice@tshirtcentral365.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
