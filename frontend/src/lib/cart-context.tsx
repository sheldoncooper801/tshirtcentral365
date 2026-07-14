"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

export interface CartItem {
  id: number;
  blueprintId: number;
  title: string;
  image: string;
  provider: { id: number; name: string };
  variant: { id: number; title: string; options: Record<string, string> };
  price: number;
  quantity: number;
  designFileUrl: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}

const CART_KEY = "tsc365_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant.id === item.variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variant.id === item.variant.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity < 1) return removeItem(variantId);
    setItems((prev) =>
      prev.map((i) => (i.variant.id === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const getItemCount = () => items.reduce((sum, i) => sum + i.quantity, 0);

  const getTotal = () => items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, getItemCount, getTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
