const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

export function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(','));
    } else {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  meta: () => request('/api/meta'),
  stats: (params = {}) => request(`/api/stats${buildQuery(params)}`),
  questions: (params = {}) => request(`/api/questions${buildQuery(params)}`),
  updateProgress: (id, patch) => request(`/api/progress/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  bulkProgress: (ids, patch) => request('/api/progress/bulk', { method: 'POST', body: JSON.stringify({ ids, patch }) }),
  resetProgress: () => request('/api/progress/reset', { method: 'POST' }),
  importProgress: (backup) => request('/api/import/progress', { method: 'POST', body: JSON.stringify(backup) }),
  exportCsvUrl: (params = {}) => `${API_BASE_URL}/api/export/progress.csv${buildQuery(params)}`,
  exportJsonUrl: () => `${API_BASE_URL}/api/export/progress.json`
};
