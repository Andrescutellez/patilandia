"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCartSubtotal } from "@/data/mock-store";
import { clampQuantity } from "@/lib/utils";
import type { CartLineItem, ProductColor, ProductSize, StorefrontProduct } from "@/types/commerce";

interface StoreContextValue {
  cart: CartLineItem[];
  wishlist: string[];
  cartCount: number;
  wishlistCount: number;
  subtotal: number;
  addToCart: (product: StorefrontProduct, options?: { size?: ProductSize; color?: ProductColor }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEY = "patilandia-storefront-v1";

interface StoredState {
  cart: CartLineItem[];
  wishlist: string[];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        setCart(parsed.cart ?? []);
        setWishlist(parsed.wishlist ?? []);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const payload: StoredState = { cart, wishlist };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cart, isHydrated, wishlist]);

  const value = useMemo<StoreContextValue>(() => {
    const subtotal = getCartSubtotal(cart);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cart,
      wishlist,
      subtotal,
      cartCount,
      wishlistCount: wishlist.length,
      addToCart: (product, options) => {
        const selectedSize = options?.size ?? product.sizes[0];
        const selectedColor = options?.color ?? product.colors[0];
        const id = `${product.slug}-${selectedSize}-${selectedColor.name}`;

        setCart((currentCart) => {
          const existingItem = currentCart.find((item) => item.id === id);

          if (existingItem) {
            return currentCart.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            );
          }

          return [
            ...currentCart,
            {
              id,
              product,
              quantity: 1,
              selectedSize,
              selectedColor
            }
          ];
        });
      },
      updateQuantity: (id, quantity) => {
        setCart((currentCart) =>
          currentCart.map((item) =>
            item.id === id ? { ...item, quantity: clampQuantity(quantity) } : item
          )
        );
      },
      removeFromCart: (id) => {
        setCart((currentCart) => currentCart.filter((item) => item.id !== id));
      },
      toggleWishlist: (slug) => {
        setWishlist((currentWishlist) =>
          currentWishlist.includes(slug)
            ? currentWishlist.filter((item) => item !== slug)
            : [...currentWishlist, slug]
        );
      },
      isWishlisted: (slug) => wishlist.includes(slug)
    };
  }, [cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
}
