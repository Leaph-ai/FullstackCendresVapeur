import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { addCartItem, getCart, removeCartItem } from '../api/cart';
import type { CartResponse } from '../api/cart';
import { getUserIdFromToken } from '../api/client';

export interface CartItem {
  id: number;       // id de la ligne CartItem en DB
  productId: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Convertit la réponse API en CartItem[] local */
function toCartItems(data: CartResponse): CartItem[] {
  return data.items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product?.name ?? `Produit #${item.product_id}`,
    category: '',
    price: parseFloat(item.product?.price ?? '0'),
    quantity: item.quantity,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    const userId = getUserIdFromToken();
    if (userId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCart(userId);
      setItems(toCartItems(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur panier');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (item: Omit<CartItem, 'quantity'>) => {
    const userId = getUserIdFromToken();
    if (userId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await addCartItem(userId, item.productId, 1);
      setItems(toCartItems(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'ajouter l\'article');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (productId: number) => {
    const userId = getUserIdFromToken();
    if (userId === null) return;
    const target = items.find((i) => i.productId === productId);
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const data = await removeCartItem(userId, target.id);
      setItems(toCartItems(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de retirer l\'article');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [items]);

  // updateQuantity : mise à jour locale uniquement (pas d'endpoint PATCH côté backend)
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const getItemCount = useCallback(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        error,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart: fetchCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
}
