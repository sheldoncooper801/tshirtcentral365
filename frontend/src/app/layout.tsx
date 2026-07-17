import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/error-boundary";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: {
    default: "T-Shirt Central 365 - Print on Demand Marketplace",
    template: "%s | T-Shirt Central 365",
  },
  description: "Shop custom t-shirts, mugs, posters and more at T-Shirt Central 365. Design your own products or shop our curated collections.",
  keywords: ["custom t-shirts", "print on demand", "shop custom products", "personalized gifts", "design your own"],
  authors: [{ name: "T-Shirt Central 365" }],
  metadataBase: new URL("https://www.tshirtcentral365.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "T-Shirt Central 365",
    url: "https://www.tshirtcentral365.com",
    title: "T-Shirt Central 365 - Print on Demand Marketplace",
    description: "Shop custom products designed by you. Premium quality, shipped worldwide.",
  },
  twitter: {
    card: "summary_large_image",
    title: "T-Shirt Central 365",
    description: "Shop custom products designed by you. Premium quality, shipped worldwide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.tshirtcentral365.com",
  },
};

export const viewport: Viewport = {
  themeColor: "#4c6ef5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {process.env.NEXT_PUBLIC_WIX_TRACKING_ID && (
          <Script
            id="wix-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function (d, w, s) {
                  var pllScript = d.createElement('script');
                  pllScript.src = 'https://analytics.sitesgpt.com/pixel/' + '${process.env.NEXT_PUBLIC_WIX_TRACKING_ID}' + '.js';
                  d.head.appendChild(pllScript);
                })(document, window);
              `,
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <CartProvider>
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
              {children}
              <MobileBottomNav />
            </CartProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
