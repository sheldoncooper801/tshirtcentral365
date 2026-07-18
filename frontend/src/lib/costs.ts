export const DEFAULT_TAX_RATE = 0.08;
export const DEFAULT_SHIPPING_COST = 5.99;

let cachedConfig: { tax_rate: number; shipping_cost: number } | null = null;

export async function getCostConfig(): Promise<{ taxRate: number; shippingCost: number }> {
  if (cachedConfig) {
    return { taxRate: cachedConfig.tax_rate, shippingCost: cachedConfig.shipping_cost };
  }
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${apiBase}/api/payments/config`);
    if (!res.ok) throw new Error("Failed to fetch config");
    const data = await res.json();
    cachedConfig = { tax_rate: data.tax_rate, shipping_cost: data.shipping_cost };
    return { taxRate: data.tax_rate, shippingCost: data.shipping_cost };
  } catch {
    return { taxRate: DEFAULT_TAX_RATE, shippingCost: DEFAULT_SHIPPING_COST };
  }
}
