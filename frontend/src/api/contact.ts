import { apiPost } from './client';

// ── Types miroirs des schemas Pydantic backend (app/contact/schemas.py) ──────

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

/** POST /contact — envoi d'une missive au bureau de poste (accès invité). */
export function submitContactMessage(
  payload: ContactMessagePayload,
): Promise<ContactMessageResponse> {
  return apiPost<ContactMessageResponse>('/contact', payload);
}
