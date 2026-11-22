async function request(method: string, path: string, body?: any) {
  const res = await fetch('/api/backend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ httpMethod: method, path, body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return { data };
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body),
  delete: (path: string, body?: any) => request('DELETE', path, body),
};

export const backend = api;
export const client = api;
export const createClient = () => api;
export default api;
