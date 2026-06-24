import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { addCartItem, getCart, removeCartItem, updateCartItemQuantity } from '../api/cart';
import type { CartResponse } from '../api/cart';
import { getUserIdFromToken } from '../api/client';
import { useToast } from '../components/feedback/useToast';
import { AUTH_CHANGED_EVENT } from './authEvents';

export interface CartItem {
  id: number;       // id de la ligne CartItem en DB (0 pour un panier invité)
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
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { id?: number }) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'cv_guest_cart';

/** Convertit la réponse API en CartItem[] local. */
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

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage indisponible : on ignore silencieusement.
  }
}

function clearGuestCart(): void {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { showError } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncing = useRef(false);

  /**
   * Synchronise l'état du panier avec la source de vérité courante :
   * - connecté : on fusionne un éventuel panier invité dans le panier serveur,
   *   puis on charge le panier serveur ;
   * - invité : on charge le panier local.
   */
  const syncCart = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    const userId = getUserIdFromToken();

    if (userId === null) {
      setItems(loadGuestCart());
      syncing.current = false;
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const guest = loadGuestCart();
      if (guest.length > 0) {
        for (const item of guest) {
          await addCartItem(userId, item.productId, item.quantity);
        }
        clearGuestCart();
      }
      const data = await getCart(userId);
      setItems(toCartItems(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur panier');
    } finally {
      setLoading(false);
      syncing.current = false;
    }
  }, []);

  // Chargement initial + resynchronisation quand l'authentification change.
  useEffect(() => {
    void syncCart();
    const onAuthChanged = () => void syncCart();
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [syncCart]);

  const addItem = useCallback<CartContextType['addItem']>(
    async (item) => {
      const userId = getUserIdFromToken();

      // Panier invité : tout reste en localStorage, aucun appel serveur.
      if (userId === null) {
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === item.productId);
          const next = existing
            ? prev.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i,
              )
            : [...prev, { ...item, id: 0, quantity: 1 }];
          saveGuestCart(next);
          return next;
        });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await addCartItem(userId, item.productId, 1);
        setItems(toCartItems(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible d'ajouter l'article");
        showError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const removeItem = useCallback(async (productId: number) => {
    const userId = getUserIdFromToken();
    if (userId === null) {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        saveGuestCart(next);
        return next;
      });
      return;
    }

    const target = items.find((i) => i.productId === productId);
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const data = await removeCartItem(userId, target.id);
      setItems(toCartItems(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de retirer l'article");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [items]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    const userId = getUserIdFromToken();
    const target = items.find((i) => i.productId === productId);
    if (!target) return;

    // Mise à jour optimiste (locale et serveur).
    setItems((prev) => {
      const next = prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
      if (userId === null) saveGuestCart(next);
      return next;
    });

    if (userId !== null) {
      try {
        const data = await updateCartItemQuantity(userId, target.id, quantity);
        setItems(toCartItems(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de modifier la quantité');
        void syncCart(); // rollback
      }
    }
  }, [items, removeItem, syncCart]);

  const clearCart = useCallback(() => {
    clearGuestCart();
    setItems([]);
  }, []);

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
        refreshCart: syncCart,
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
