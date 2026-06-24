const BASE_URL = '/api';

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: { field: string; msg: string }[];

  constructor(
    message: string,
    code: string,
    status: number,
    fields?: { field: string; msg: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let code = 'UNKNOWN';
  let message = response.statusText || 'Erreur serveur';
  let fields: { field: string; msg: string }[] | undefined;
  try {
    const body = await response.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      fields = body.error.fields;
    } else if (typeof body?.detail === 'string') {
      message = body.detail;
    }
  } catch {
    // corps non-JSON : on garde les valeurs par défaut
  }
  return new ApiError(message, code, response.status, fields);
}

function handleUnauthorized(): void {
  localStorage.removeItem('access_token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!response.ok) {
    const error = await toApiError(response);
    if (error.status === 401) handleUnauthorized();
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await toApiError(response);
    if (error.status === 401) handleUnauthorized();
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await toApiError(response);
    if (error.status === 401) handleUnauthorized();
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!response.ok) {
    const error = await toApiError(response);
    if (error.status === 401) handleUnauthorized();
    throw error;
  }
}

/** Décode le JWT en localStorage et retourne l'id utilisateur (ou null). */
export function getUserIdFromToken(): number | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = parseInt(payload.sub, 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}
