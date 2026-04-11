const API_BASE = '' // Use relative URL so Nginx proxy handles it
const API_KEY = 'dev_api_key_12345'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'API Error')
  }
  return res.json()
}

export const api = {
  evaluate: (data) => apiFetch('/api/evaluate', { method: 'POST', body: JSON.stringify(data) }),
  getSalaryData: () => apiFetch('/api/salary-data'),
  getScripts: () => apiFetch('/api/scripts'),
  getForum: () => apiFetch('/api/forum'),
  postForum: (data) => apiFetch('/api/forum', { method: 'POST', body: JSON.stringify(data) }),
  getOffers: () => apiFetch('/api/offers'),
  postOffer: (data) => apiFetch('/api/offers', { method: 'POST', body: JSON.stringify(data) }),
  putOffer: (id, data) => apiFetch(`/api/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffer: (id) => apiFetch(`/api/offers/${id}`, { method: 'DELETE' }),
}
