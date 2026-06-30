const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  health: () => request('/health'),

  // Auth
  loginManager: (email, password) =>
    request('/auth/login-manager', { method: 'POST', body: JSON.stringify({ email, password }) }),
  registerCustomer: (name, email, password) =>
    request('/auth/register-customer', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  loginCustomer: (email, password) =>
    request('/auth/login-customer', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Complaints
  listComplaints: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    return request(`/complaints?${qs}`);
  },
  getStats:       ()             => request('/complaints/stats'),
  getComplaint:   (id)           => request(`/complaints/${id}`),
  createComplaint:(payload)      => request('/complaints', { method: 'POST', body: JSON.stringify(payload) }).then(r => { window.dispatchEvent(new Event('refresh-stats')); return r; }),
  updateStatus:   (id, status, actorName) =>
    request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, actorName }) }).then(r => { window.dispatchEvent(new Event('refresh-stats')); return r; }),
  assignOwner:    (id, ownerName, actorName) =>
    request(`/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ ownerName, actorName }) }).then(r => { window.dispatchEvent(new Event('refresh-stats')); return r; }),
  updatePriority: (id, priority, actorName) =>
    request(`/complaints/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority, actorName }) }).then(r => { window.dispatchEvent(new Event('refresh-stats')); return r; }),
  addNote:        (id, note, actorName) =>
    request(`/complaints/${id}/notes`, { method: 'POST', body: JSON.stringify({ note, actorName }) }),
  sendReminder:   (id, actorName) =>
    request(`/complaints/${id}/reminder`, { method: 'POST', body: JSON.stringify({ actorName }) }),

  // Shipments / AWB
  searchShipments:    (query) => request(`/shipments?search=${encodeURIComponent(query)}`),
  getShipmentByAwb:   (awb)   => request(`/shipments?awb=${encodeURIComponent(awb)}`),
  createShipment:     (payload) => request('/shipments', { method: 'POST', body: JSON.stringify(payload) }),

  // Weight
  calculateChargeableWeight: (payload) =>
    request('/chargeable-weight', { method: 'POST', body: JSON.stringify(payload) }),

  // Users / agents
  listUsers: (role) => request(`/users${role ? `?role=${role}` : ''}`),

  // Quotations (local CRUD, no separate table — stored in complaints with type=QUOTATION in a real impl)
  listQuotations:  ()        => request('/quotations'),
  createQuotation: (payload) => request('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
  updateQuotation: (id, data)=> request(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Partners
  listPartners:  ()        => request('/partners'),
  createPartner: (payload) => request('/partners', { method: 'POST', body: JSON.stringify(payload) }),
  updatePartner: (id, data)=> request(`/partners/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Invoices
  listInvoices:   ()        => request('/invoices'),
  createInvoice:  (payload) => request('/invoices', { method: 'POST', body: JSON.stringify(payload) }),
  updateInvoice:  (id, data)=> request(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  sendInvoiceReminder: (id) => request(`/invoices/${id}/reminder`, { method: 'POST' }),

  // Notifications log
  listNotifications: (complaintId) =>
    request(`/notifications${complaintId ? `?complaintId=${complaintId}` : ''}`),

  // AI helpers (proxied through backend to keep ANTHROPIC_API_KEY server-side)
  aiQuotation:  (messages) => request('/ai/quotation',  { method: 'POST', body: JSON.stringify({ messages }) }),
  aiCustoms:    (messages) => request('/ai/customs',    { method: 'POST', body: JSON.stringify({ messages }) }),
  aiInsurance:  (messages) => request('/ai/insurance',  { method: 'POST', body: JSON.stringify({ messages }) }),
  aiRoute:      (messages) => request('/ai/route',      { method: 'POST', body: JSON.stringify({ messages }) }),
  aiCleanCargo: (text)     => request('/ai/clean-cargo',{ method: 'POST', body: JSON.stringify({ text }) }),

  // Insights
  uploadInsights: (formData) =>
    fetch(`${BASE}/insights/upload`, { method: 'POST', body: formData }).then((r) => r.json()),
  getInsightsSummary: () => request('/insights/summary'),
};
