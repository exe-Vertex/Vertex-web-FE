const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL =
  (configuredApiBaseUrl ?? 'https://localhost:7099').replace(/\/+$/, '');

if (import.meta.env.PROD && !configuredApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL must be set for production builds.');
}

// Keep track of active refreshing promise to avoid concurrent refresh requests
let refreshPromise: Promise<any> | null = null;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  } as Record<string, string>;

  // Ensure request is sent with the latest access token if it's stored
  const currentToken = localStorage.getItem('vertex.accessToken');
  if (currentToken && !headers['Authorization'] && !path.startsWith('/api/auth/')) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // If 401 and not an auth path, try to refresh token dynamically
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    const refreshToken = localStorage.getItem('vertex.refreshToken');
    if (refreshToken) {
      try {
        if (!refreshPromise) {
          // Perform the refresh
          refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          }).then(async (res) => {
            if (!res.ok) throw new Error('Refresh failed');
            const tokens = await res.json();
            localStorage.setItem('vertex.accessToken', tokens.accessToken);
            localStorage.setItem('vertex.refreshToken', tokens.refreshToken);
            return tokens;
          }).finally(() => {
            refreshPromise = null;
          });
        }

        const tokens = await refreshPromise;
        
        // Retry original request with the new access token
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        });
      } catch (err) {
        // Refresh token failed -> clear everything and redirect to login
        console.error('Session expired, logging out:', err);
        localStorage.removeItem('vertex.accessToken');
        localStorage.removeItem('vertex.refreshToken');
        localStorage.removeItem('vertex.userInfo');
        window.location.href = '/login';
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
      }
    } else {
      // No refresh token -> clear and redirect
      localStorage.removeItem('vertex.accessToken');
      localStorage.removeItem('vertex.refreshToken');
      localStorage.removeItem('vertex.userInfo');
      window.location.href = '/login';
      throw new Error('Bạn chưa đăng nhập, vui lòng đăng nhập lại.');
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string; error?: string; errors?: any };
      console.error('API Error Response:', data);
      if (data?.message) message = data.message;
      else if (data?.error) message = data.error;
      else if (data?.errors) message = JSON.stringify(data.errors);
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
