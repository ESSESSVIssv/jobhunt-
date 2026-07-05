/**
 * API Fetch wrapper to automatically inject user-defined Gemini API keys
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const customKey = localStorage.getItem('user_gemini_api_key');
  const headers = new Headers(options.headers || {});
  if (customKey) {
    headers.set('X-Gemini-Api-Key', customKey);
  }
  return fetch(url, { ...options, headers });
}

export async function apiFetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(url, options);
  
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    let errMsg = `Server returned status ${res.status}`;
    if (contentType && contentType.includes('application/json')) {
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch (_) {}
    } else {
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
          errMsg = 'Server returned an HTML page. This usually means the API endpoint was not found or a route handler was not registered.';
        } else if (text && text.length < 150) {
          errMsg = text;
        }
      } catch (_) {}
    }
    throw new Error(errMsg);
  }

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned an invalid non-JSON response. Please verify the backend API service is running correctly.');
  }

  return res.json() as Promise<T>;
}

