const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (rawApiBaseUrl?.trim() || '/api').replace(/\/+$/, '');
const FALLBACK_API_BASE_URLS = ['http://127.0.0.1:8000', 'http://localhost:8000'];

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
  return fetchFromApi<ProductDto[]>('/products/', { signal });
}

export async function likeProduct(productId: number | string): Promise<VoteStatusDto> {
  const accessToken = getAccessToken();
  return fetchFromApi<VoteStatusDto>(`/products/${productId}/vote`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

async function fetchFromApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  let lastError: unknown;
  const baseUrls = rawApiBaseUrl?.trim() ? [API_BASE_URL] : [API_BASE_URL, ...FALLBACK_API_BASE_URLS];

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);

      if (!response.ok) {
        throw new Error(`Erreur API ${path} (${response.status})`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
}
