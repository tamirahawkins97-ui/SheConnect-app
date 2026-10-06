// src/utils/api.ts

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData | null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  // Base headers
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let body: BodyInit | undefined;

  // Handle JSON vs FormData (e.g. image uploads)
  if (options.body instanceof FormData) {
    body = options.body;
    // Don't set 'Content-Type' manually for FormData; browser sets boundary automatically
  } else if (options.body) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  // Vite proxy catches any path starting with /api and routes to :1111
  const response = await fetch(endpoint, {
    ...options,
    headers,
    body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}