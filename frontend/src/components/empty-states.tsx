import Link from "next/link";

export function EmptyProducts() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">👕</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Browse our catalog and add your first product to get started.
      </p>
      <Link
        href="/designer"
        className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
      >
        Create Your First Product
      </Link>
    </div>
  );
}

export function EmptyOrders() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📦</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Your order history will appear here once you make a purchase.
      </p>
      <Link
        href="/products"
        className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
      >
        Browse Products
      </Link>
    </div>
  );
}

export function EmptyCart() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🛒</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Browse our catalog and add some products to your cart.
      </p>
      <Link
        href="/products"
        className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
      >
        Browse Products
      </Link>
    </div>
  );
}

export function EmptySearch() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        Try adjusting your search or filter to find what you are looking for.
      </p>
    </div>
  );
}
