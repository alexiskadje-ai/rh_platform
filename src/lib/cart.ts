import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  title: string;
  type: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

function clampQty(value: number) {
  return Math.max(1, Math.min(99, Math.trunc(value) || 1));
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const qty = clampQty(quantity);
        const existing = get().items.find((row) => row.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.productId === item.productId
                ? { ...row, quantity: clampQty(row.quantity + qty), title: item.title, type: item.type, price: item.price }
                : row,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, quantity: qty }] });
      },
      setQuantity: (productId, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter((row) => row.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((row) =>
            row.productId === productId ? { ...row, quantity: clampQty(quantity) } : row,
          ),
        });
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((row) => row.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "rh-cart" },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
