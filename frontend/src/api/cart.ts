import { apiDelete, apiGet, apiPatch, apiPost } from './client';

// ── Types miroirs des schemas Pydantic backend ──────────────────────────────

export interface CartItemProductBrief {
  id: number;
  name: string;
  price: string;
  stock: number;
}

export interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  product: CartItemProductBrief | null;
}

export interface CartResponse {
  id: number | null;
  user_id: number;
  items: CartItemResponse[];
}

// ── Appels API ───────────────────────────────────────────────────────────────

/** GET /carts/{userId} */
export function getCart(userId: number): Promise<CartResponse> {
  return apiGet<CartResponse>(`/carts/${userId}`);
}

/** POST /carts/{userId}/items */
export function addCartItem(
  userId: number,
  productId: number,
  quantity = 1,
): Promise<CartResponse> {
  return apiPost<CartResponse>(`/carts/${userId}/items`, { product_id: productId, quantity });
}

/** PATCH /carts/{userId}/items/{itemId} — met à jour la quantité */
export function updateCartItemQuantity(
  userId: number,
  itemId: number,
  quantity: number,
): Promise<CartResponse> {
  return apiPatch<CartResponse>(`/carts/${userId}/items/${itemId}`, { quantity });
}

/** DELETE /carts/{userId}/items/{itemId} puis re-fetch */
export async function removeCartItem(
  userId: number,
  itemId: number,
): Promise<CartResponse> {
  await apiDelete(`/carts/${userId}/items/${itemId}`);
  return getCart(userId);
}
