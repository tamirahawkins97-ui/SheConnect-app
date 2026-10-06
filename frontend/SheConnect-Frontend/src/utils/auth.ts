// src/utils/auth.ts

const TOKEN_KEY = 'authToken';
const LEGACY_TOKEN_KEY = 'token';

export interface DecodedToken {
  id?: string;
  _id?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

// 1. Read token from storage
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

// 2. Save token to storage
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

// 3. Clear token from storage (logout/expired)
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

// 4. Safely decode the JWT payload on client side
export function decodeToken(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;

    // Handle base64url decoding
    const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonString = decodeURIComponent(
      atob(normalizedBase64)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonString) as DecodedToken;
  } catch (err) {
    console.error('Failed to decode JWT token:', err);
    removeToken();
    return null;
  }
}

// 5. Fast client-side validity check (presence + expiration)
export function isTokenValid(): boolean {
  const payload = decodeToken();
  if (!payload) return false;

  // If token includes an 'exp' claim (UNIX timestamp in seconds)
  if (typeof payload.exp === 'number') {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= currentTimeInSeconds) {
      removeToken();
      return false;
    }
  }

  return true;
}