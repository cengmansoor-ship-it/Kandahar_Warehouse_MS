import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const inventoryService = {
  getItems: () => api.get('/items'),
  addItem: (item: any) => api.post('/items', item),
};

export const requestService = {
  getRequests: () => api.get('/requests'),
  submitRequest: (request: any) => api.post('/requests', request),
  updateStatus: (id: string, data: any) => api.patch(`/requests/${id}`, data),
};

export const receivingService = {
  getReceivings: () => api.get('/receivings'),
  addReceiving: (data: any) => api.post('/v1/receiving', data),
  updateReceiving: (id: string, data: any) => api.put(`/v1/receiving/${id}`, data),
  deleteReceiving: (id: string) => api.delete(`/v1/receiving/${id}`),
  uploadReceivings: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/v1/receiving/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  exportReceivings: () => api.get('/v1/receiving/export', { responseType: 'blob' }),
};

export const procurementService = {
  getRequests: () => api.get('/procurement/requests'),
  getTenders: () => api.get('/procurement/tenders'),
  createTender: (data: any) => api.post('/procurement/tenders', data),
  getQuotations: () => api.get('/procurement/quotations'),
  submitQuotation: (data: any) => api.post('/procurement/quotations', data),
  selectWinner: (data: any) => api.post('/procurement/select-winner', data),
  getOrders: () => api.get('/procurement/orders'),
  getCodes: () => api.get('/procurement/codes'),
};

export const trashService = {
  getTrash: () => api.get('/trash'),
  moveToTrash: (id: string, reason: string) => api.post(`/items/${id}/trash`, { reason }),
  restoreFromTrash: (trashId: string) => api.post(`/trash/restore/${trashId}`),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  clearNotifications: () => api.delete('/notifications'),
};

export const userService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.post('/user/profile', data),
};

export default api;
