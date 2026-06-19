const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (rawApiBaseUrl?.trim() || '/api').replace(/\/+$/, '');

export interface ProductDto {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  url: string | null;
  stock: number;
  price: number | string;
  previous_price: number | string | null;
  likes_count: number;
  created_at: string;
  category: {
    id: number;
    name: string;
  } | null;
}

export async function fetchProducts(signal?: AbortSignal): Promise<ProductDto[]> {
  const response = await fetch(`${API_BASE_URL}/products/`, { signal });

  if (!response.ok) {
    throw new Error(`Erreur API produits (${response.status})`);
  }

  return response.json();
}
