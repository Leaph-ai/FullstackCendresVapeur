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

export interface VoteStatusDto {
  product_id: number;
  likes_count: number;
  liked: boolean;
}

export async function fetchProducts(signal?: AbortSignal): Promise<ProductDto[]> {
  const response = await fetch(`${API_BASE_URL}/products/`, { signal });

  if (!response.ok) {
    throw new Error(`Erreur API produits (${response.status})`);
  }

  return response.json();
}

export async function likeProduct(productId: number | string): Promise<VoteStatusDto> {
  const accessToken = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/products/${productId}/vote`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Erreur API vote (${response.status})`);
  }

  return response.json();
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
}
