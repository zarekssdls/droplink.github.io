export const API = window.APP_CONFIG.API_URL;

export function getToken() {
  return localStorage.getItem('authToken');
}
export function setToken(t) {
  localStorage.setItem('authToken', t);
}
export function clearToken() {
  localStorage.removeItem('authToken');
}
export function requireAuth() {
  if (!getToken()) {
    window.location.href = '/auth/login';
  }
}

export async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export function discordLoginUrl() {
  const clientId = window.APP_CONFIG.DISCORD_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/discord/callback`;
  const scope = 'identify email';
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
}
