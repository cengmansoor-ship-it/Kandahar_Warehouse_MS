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
};

export const receivingService = {
  getReceivings: () => api.get('/receivings'),
};

export default api;
