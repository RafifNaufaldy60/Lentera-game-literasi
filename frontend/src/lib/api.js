import { invalidateAfterMutation, resourceGeneration } from './resource-cache.js';
export class ApiError extends Error {
  constructor(message, status, fields = {}, code) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

export async function api(path, { method = 'GET', body, csrfToken, signal } = {}) {
  const requestGeneration = resourceGeneration();
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', signal,
      headers: { ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}), ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Koneksi terputus. Periksa jaringan Anda, lalu coba lagi.', 0);
  }
  if (response.status === 204) {
    if (method !== 'GET' && requestGeneration === resourceGeneration()) invalidateAfterMutation(path);
    return null;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new ApiError(data?.error || 'Layanan belum dapat dihubungi. Coba lagi sebentar.', response.status, data?.fields, data?.code);
  }
  if (method !== 'GET' && requestGeneration === resourceGeneration()) invalidateAfterMutation(path, data);
  return data;
}

let sessionRequest;
export function loadSession() {
  sessionRequest ??= api('/auth/session').finally(() => { sessionRequest = null; });
  return sessionRequest;
}
