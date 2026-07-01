const API_BASE_URL = resolveApiBaseUrl();
const API_TIMEOUT_MS = 15000;

function resolveApiBaseUrl() {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envValue) return envValue.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location.hostname) {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!isLocalhost) return `${window.location.protocol}//${window.location.hostname}/api`;
  }

  return 'http://127.0.0.1:3000/api';
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

function extractMessage(payload: unknown): string {
  if (!payload) return 'Ошибка запроса';
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return payload.map(extractMessage).join('\n');

  if (typeof payload === 'object' && payload !== null) {
    const message = (payload as Record<string, unknown>).message;
    const error = (payload as Record<string, unknown>).error;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.map(extractMessage).join('\n');
    if (typeof error === 'string' && error.trim()) return error;
  }

  return 'Ошибка запроса';
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getNetworkErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const text = error.message.toLowerCase();
    if (error.name === 'AbortError') return 'Сервер отвечает слишком долго. Попробуйте позже.';
    if (text.includes('failed to fetch') || text.includes('networkerror')) {
      return 'Нет соединения с сервером. Проверьте адрес API и доступность backend.';
    }
  }

  return 'Не удалось выполнить запрос.';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('admin_access_token');
  const headers = new Headers(init.headers || {});

  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(getNetworkErrorMessage(error));
  }

  clearTimeout(timeoutId);
  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = extractMessage(payload);
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('admin_access_token');
      throw new Error(response.status === 401 ? 'Сессия истекла. Войдите снова.' : message);
    }
    throw new Error(message);
  }

  return payload as T;
}
