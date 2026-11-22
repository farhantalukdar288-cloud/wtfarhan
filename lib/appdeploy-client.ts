const apiProxy = new Proxy({}, {
  get(_, prop) {
    return async (params: any = {}) => {
      const res = await fetch('/api/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: String(prop), params }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
  },
}) as any;

export const backend = apiProxy;
export const client = apiProxy;
export const createClient = () => apiProxy;
export default apiProxy;

