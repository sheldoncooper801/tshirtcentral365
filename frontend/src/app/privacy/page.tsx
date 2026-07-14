"use client";

import Link from "next/link";
import Logo from "@/components/logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-3 text-gray-500">Last updated: July 2026</p>

        <div className="mt-10 space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, including your name, email address, payment information, and
              any designs you upload. We also automatically collect usage data such as IP address, browser type, pages
              visited, and timestamps through cookies and similar technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Information</h2>
            <p>
              We use your information to operate and improve the Platform, process orders, communicate with you about
              your account and orders, detect fraud, and send marketing communications (with your consent). We may also
              use aggregated, anonymized data for analytics and platform improvement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
            <p>
              We share your information with third-party print providers solely to fulfill your orders. We do not sell
              your personal data. We may share information with payment processors, analytics providers, and law
              enforcement when required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS) and at rest,
              access controls, and regular security audits. While we strive to protect your information, no method
              of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You may also opt out of marketing
              communications at any time. To exercise these rights, contact us at{" "}
              <a href="mailto:customerservice@tshirtcentral365.com" className="text-brand-600 hover:text-brand-700 font-medium">
                customerservice@tshirtcentral365.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and preferences, and optional analytics cookies to
              understand how you use the Platform. You can manage cookie preferences through your browser settings.
              Disabling essential cookies may impair Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email
              or a notice on the Platform. Your continued use after changes take effect constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
            <p>
              For questions about this Privacy Policy, contact us at{" "}
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
