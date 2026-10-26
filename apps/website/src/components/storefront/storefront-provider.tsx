"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  quantity: number;
  options: Record<string, string>;
};

type StorefrontContextValue = {
  cartCount: number;
  cartItems: CartItem[];
  searchTerm: string;
  selectedCategory: string | null;
  addToCart: (
    productId: string,
    quantity?: number,
    options?: Record<string, string>,
  ) => void;
  updateCartQuantity: (productId: string, quantity: number, options: Record<string, string>) => void;
  removeFromCart: (productId: string, options: Record<string, string>) => void;
  clearCart: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string | null) => void;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);
const CART_STORAGE_KEY = "naijamart-cart";
const CART_CHANGE_EVENT = "naijamart-cart-change";
const EMPTY_CART_SNAPSHOT = "[]";
let memoryCartSnapshot = EMPTY_CART_SNAPSHOT;
let hasLoggedStorageError = false;

function logStorageError(action: string, error: unknown) {
  if (hasLoggedStorageError) return;
  hasLoggedStorageError = true;
  console.error(`Could not ${action} the saved cart.`, error);
}

function getCartSnapshot() {
  if (typeof window === "undefined") return EMPTY_CART_SNAPSHOT;

  try {
    memoryCartSnapshot =
      window.localStorage.getItem(CART_STORAGE_KEY) ?? EMPTY_CART_SNAPSHOT;
  } catch (error) {
    logStorageError("read", error);
  }

  return memoryCartSnapshot;
}

function subscribeToCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
  };
}

function parseCartSnapshot(snapshot: string): CartItem[] {
  try {
    const parsedCart: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsedCart)) return [];

    return parsedCart.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        typeof item.productId === "string" &&
        item.productId.length > 0 &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        "options" in item &&
        typeof item.options === "object" &&
        item.options !== null &&
        !Array.isArray(item.options),
    );
  } catch (error) {
    logStorageError("parse", error);
    return [];
  }
}

function saveCartSnapshot(items: CartItem[]) {
  memoryCartSnapshot = JSON.stringify(items);
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, memoryCartSnapshot);
  } catch (error) {
    logStorageError("save", error);
  }
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const cartSnapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => EMPTY_CART_SNAPSHOT,
  );
  const cartItems = useMemo(() => parseCartSnapshot(cartSnapshot), [cartSnapshot]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = useMemo(
    () => ({
      cartCount,
      cartItems,
      searchTerm,
      selectedCategory,
      addToCart: (
        productId: string,
        quantity = 1,
        options: Record<string, string> = {},
      ) =>
        {
          const items = parseCartSnapshot(getCartSnapshot());
          const matchingItem = items.find(
            (item) =>
              item.productId === productId &&
              JSON.stringify(item.options) === JSON.stringify(options),
          );
          if (matchingItem) {
            saveCartSnapshot(items.map((item) =>
              item === matchingItem
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ));
            return;
          }
          saveCartSnapshot([...items, { productId, quantity, options }]);
        },
      updateCartQuantity: (
        productId: string,
        quantity: number,
        options: Record<string, string>,
      ) =>
        {
          const items = parseCartSnapshot(getCartSnapshot());
          saveCartSnapshot(items.map((item) =>
            item.productId === productId &&
            JSON.stringify(item.options) === JSON.stringify(options)
              ? { ...item, quantity }
              : item,
          ));
        },
      removeFromCart: (productId: string, options: Record<string, string>) =>
        {
          const items = parseCartSnapshot(getCartSnapshot());
          saveCartSnapshot(items.filter(
            (item) =>
              item.productId !== productId ||
              JSON.stringify(item.options) !== JSON.stringify(options),
          ));
        },
      clearCart: () => saveCartSnapshot([]),
      setSearchTerm,
      setSelectedCategory,
    }),
    [cartCount, cartItems, searchTerm, selectedCategory],
  );

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (!context) {
    throw new Error("useStorefront must be used within StorefrontProvider");
  }
  return context;
}
