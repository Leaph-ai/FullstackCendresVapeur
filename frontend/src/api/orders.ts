import { apiGet, apiPost } from './client';

export interface OrderItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface OrderResponse {
  id: number;
  user_id: number;
  discount_code_id: number | null;
  total_amount: string;
  status: string;
  created_at: string;
  items: OrderItemResponse[];
}

export interface DiscountCodeResponse {
  id: number;
  code: string;
  percentage: string;
  active: boolean;
}

/** GET /discounts/{code} — valide un code promo et retourne son pourcentage */
export function validateDiscountCode(code: string): Promise<DiscountCodeResponse> {
  return apiGet<DiscountCodeResponse>(`/discounts/${encodeURIComponent(code.toUpperCase())}`);
}

/** POST /orders/ — crée une commande à partir du panier en DB */
export function createOrder(discountCode?: string | null): Promise<OrderResponse> {
  return apiPost<OrderResponse>('/orders/', {
    discount_code: discountCode ?? null,
  });
}

/** GET /orders/user/{userId} */
export function getUserOrders(userId: number): Promise<OrderResponse[]> {
  return apiGet<OrderResponse[]>(`/orders/user/${userId}`);
}
