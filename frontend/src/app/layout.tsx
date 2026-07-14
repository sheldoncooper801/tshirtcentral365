import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/error-boundary";

export const metadata: Metadata = {
  title: {
    default: "T-Shirt Central 365 - Print on Demand Marketplace",
    template: "%s | T-Shirt Central 365",
  },
  description: "Create and sell custom products with T-Shirt Central 365. No inventory, no risk. Design t-shirts, mugs, posters and more.",
  keywords: ["print on demand", "custom t-shirts", "t-shirt design", "dropshipping", "merchandise"],
  authors: [{ name: "T-Shirt Central 365" }],
  metadataBase: new URL("https://www.tshirtcentral365.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "T-Shirt Central 365",
    url: "https://www.tshirtcentral365.com",
    title: "T-Shirt Central 365 - Print on Demand Marketplace",
    description: "Create and sell custom products. No inventory, no risk.",
  },
  twitter: {
    card: "summary_large_image",
    title: "T-Shirt Central 365",
    description: "Create and sell custom products. No inventory, no risk.",
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
            </CartProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
