"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getStoredAccountEmail, storeAccountEmail } from "@/lib/vendure/pets-client";
import * as shop from "@/lib/vendure/shop-client";
import * as wishlistApi from "@/lib/vendure/wishlist-client";
import type { CartLineItem, ProductColor, ProductSize, StorefrontProduct } from "@/types/commerce";

interface StoreContextValue {
  cart: CartLineItem[];
  wishlist: string[];
  cartCount: number;
  wishlistCount: number;
  subtotal: number;
  /** Pre-tax product total — see OrderSummary.productSubtotal for why this differs from `subtotal`
   *  and why Patipuntos calculations specifically need this one, not the tax-inclusive figure. */
  productSubtotal: number;
  shippingTotal: number;
  total: number;
  /** True once the initial activeOrder hydration from Vendure has settled (success or empty). */
  isCartReady: boolean;
  /** Message from the last failed cart/checkout operation, if any — shown by CartPage/CheckoutPage. */
  cartError: string | null;
  customerEmail: string | null;
  orderId: string | null;
  /** Re-fetches the active order from Vendure and updates cart/totals — used after a Patipuntos
   *  redemption changes the order's surcharges/total outside of the usual cart mutations. */
  refreshOrder: () => Promise<void>;
  addToCart: (product: StorefrontProduct, options?: { size?: ProductSize; color?: ProductColor }) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  /** Keyed by StorefrontProduct.id, not slug — see the sync comment below for why. */
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  setCustomerEmail: (email: string) => Promise<boolean>;
  updateCustomerName: (email: string, fullName: string) => Promise<boolean>;
  setShippingAddress: (input: Parameters<typeof shop.setShippingAddress>[0]) => Promise<boolean>;
  setShippingMethod: (shippingMethodId: string) => Promise<boolean>;
  /** Resolves with the completed order's summary on success, or null on failure. On success the
   *  live cart is reset to a fresh (empty) order, so the confirmation screen must hold on to the
   *  returned summary itself rather than reading it back from context afterwards. */
  placeOrder: (paymentMethodCode?: string) => Promise<shop.OrderSummary | null>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const WISHLIST_STORAGE_KEY = "patilandia-wishlist-v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [order, setOrder] = useState<shop.OrderSummary | null>(null);
  const [isCartReady, setIsCartReady] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    let localWishlist: string[] = [];
    try {
      const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) {
        localWishlist = JSON.parse(raw) as string[];
        setWishlist(localWishlist);
      }
    } catch {
      window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }

    // If we already know this visitor's email (from a previous checkout or from the Mascotas
    // email gate), push the local wishlist up to Vendure and adopt the merged result as source of
    // truth. Without a known email the wishlist just stays local, exactly like before this feature
    // existed — see the "Local + sync perezoso" decision in Decisiones y Razonamiento.
    const knownEmail = getStoredAccountEmail();
    if (knownEmail) {
      wishlistApi
        .syncWishlist(knownEmail, localWishlist)
        .then((merged) => setWishlist(merged))
        .catch(() => {
          // Vendure unreachable — keep working off the local list.
        });
    }

    shop
      .getActiveOrder()
      .then((activeOrder) => setOrder(activeOrder))
      .catch(() => setOrder(null))
      .finally(() => setIsCartReady(true));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Non-critical — wishlist just won't persist across reloads.
    }
  }, [wishlist]);

  const runOrderOperation = useCallback(async (operation: () => Promise<shop.OrderSummary>) => {
    try {
      setCartError(null);
      const nextOrder = await operation();
      setOrder(nextOrder);
      return true;
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "No pudimos actualizar tu carrito.");
      return false;
    }
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const cart = order?.lines ?? [];

    return {
      cart,
      wishlist,
      subtotal: order?.subtotal ?? 0,
      productSubtotal: order?.productSubtotal ?? 0,
      shippingTotal: order?.shippingTotal ?? 0,
      total: order?.total ?? 0,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      wishlistCount: wishlist.length,
      isCartReady,
      cartError,
      customerEmail: order?.customerEmail ?? null,
      orderId: order?.id ?? null,
      refreshOrder: async () => {
        try {
          const fresh = await shop.getActiveOrder();
          setOrder(fresh);
        } catch {
          // Leave the current order state as-is — a stale total is preferable to blanking the cart.
        }
      },

      addToCart: async (product, options) => {
        const selectedSize = options?.size ?? product.sizes[0];
        const selectedColor = options?.color ?? product.colors[0];
        const variantId = product.variants?.find(
          (variant) => variant.size === selectedSize && variant.colorName === selectedColor.name
        )?.id;

        if (!variantId) {
          setCartError("Este producto no está disponible para agregar al carrito en este momento.");
          return;
        }

        await runOrderOperation(() => shop.addItemToOrder(variantId, 1));
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          await runOrderOperation(() => shop.removeOrderLine(id));
          return;
        }
        await runOrderOperation(() => shop.adjustOrderLine(id, quantity));
      },

      removeFromCart: async (id) => {
        await runOrderOperation(() => shop.removeOrderLine(id));
      },

      toggleWishlist: (productId) => {
        // The updater passed to setWishlist must stay pure (React may invoke it more than once
        // per update, e.g. under StrictMode) — so the isAdding check happens here, outside it,
        // and the fire-and-forget sync call happens after, not from inside the updater.
        const isAdding = !wishlist.includes(productId);
        setWishlist((current) =>
          isAdding ? [...current, productId] : current.filter((item) => item !== productId)
        );

        // Optimistic + fire-and-forget: the heart icon must stay instant everywhere in the
        // catalog, so we never await this. Without a known email yet there's nothing to sync —
        // the local list above is already the full source of truth in that case.
        const knownEmail = getStoredAccountEmail();
        if (knownEmail) {
          const request = isAdding
            ? wishlistApi.addToWishlist(knownEmail, productId)
            : wishlistApi.removeFromWishlist(knownEmail, productId);
          request.catch(() => {
            // Vendure unreachable — local state already updated, reconciled on the next sync.
          });
        }
      },
      isWishlisted: (productId) => wishlist.includes(productId),

      setCustomerEmail: async (email) => {
        const ok = await runOrderOperation(() => shop.setCustomerEmail(email));
        if (ok && getStoredAccountEmail() !== email) {
          // The cart is the other place (besides Mascotas) an email can surface for the first
          // time — treat it the same way: remember it, then push up whatever was wishlisted
          // before we knew who this visitor was.
          storeAccountEmail(email);
          wishlistApi
            .syncWishlist(email, wishlist)
            .then(setWishlist)
            .catch(() => {
              // Vendure unreachable — keep working off the local list.
            });
        }
        return ok;
      },
      // Takes the email explicitly rather than reading order.customerEmail from closed-over state —
      // this is called right after setCustomerEmail() in the same checkout submit, and a caller
      // that destructured this function earlier in its render would otherwise read a stale
      // pre-email order here (confirmed against the real server: this silently overwrote a brand
      // new customer's email back to "" on their very first checkout).
      updateCustomerName: (email, fullName) => runOrderOperation(() => shop.updateCustomerName(email, fullName)),
      setShippingAddress: (input) => runOrderOperation(() => shop.setShippingAddress(input)),
      setShippingMethod: (shippingMethodId) => runOrderOperation(() => shop.setShippingMethod(shippingMethodId)),
      placeOrder: async (paymentMethodCode) => {
        try {
          setCartError(null);
          const completedOrder = await shop.placeOrder(paymentMethodCode);
          // The order that was just paid is no longer the "active" cart — start the next visit
          // to /carrito or /checkout with a clean slate instead of showing the finished order.
          shop
            .getActiveOrder()
            .then(setOrder)
            .catch(() => setOrder(null));
          return completedOrder;
        } catch (error) {
          setCartError(error instanceof Error ? error.message : "No pudimos confirmar tu pedido.");
          return null;
        }
      }
    };
  }, [cartError, isCartReady, order, runOrderOperation, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
}
