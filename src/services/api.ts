import axios from 'axios';

export const api = axios.create({
  baseURL: (typeof window !== 'undefined' ? window.location.origin : '') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  forgotPassword: (email: string, password?: string) => api.post('/auth/forgot-password', { email, password }),
};

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
  createOrder: (data: any) => api.post('/procurement/orders', data),
  getCodes: () => api.get('/procurement/codes'),
  submitRequest: (data: any) => api.post('/procurement/requests', data),
};

export const trashService = {
  getTrash: () => api.get('/trash'),
  moveToTrash: (id: string, reason: string) => api.post(`/items/${id}/trash`, { reason }),
  restoreFromTrash: (trashId: string) => api.post(`/trash/restore/${trashId}`),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  clearNotifications: () => api.delete('/notifications'),
  sendSMS: (to: string, message: string) => api.post('/notifications/sms', { to, message }),
};

export const emailService = {
  getEmails: () => api.get('/emails'),
  sendEmail: (data: { to: string, subject: string, text: string, html?: string, requestId?: string, type?: string }) => api.post('/send-email', data),
  updateEmail: (id: string, data: any) => api.patch(`/emails/${id}`, data),
};

export const analyticsService = {
  getAnnualNeeds: () => api.get('/analytics/annual-needs'),
  getForecast: () => api.get('/analytics/forecast'),
  getAllocation: () => api.get('/inventory/allocation'),
};

export const userService = {
  getUsers: () => api.get('/users'),
  addUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.patch(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.post('/user/profile', data),
};

export const traceabilityService = {
  getFaculties: () => api.get('/faculties'),
  addFaculty: (data: any) => api.post('/faculties', data),
  updateFaculty: (id: string, data: any) => api.patch(`/faculties/${id}`, data),
  deleteFaculty: (id: string) => api.delete(`/faculties/${id}`),
  
  getAdminUnits: () => api.get('/admin-units'),
  addAdminUnit: (data: any) => api.post('/admin-units', data),
  updateAdminUnit: (id: string, data: any) => api.patch(`/admin-units/${id}`, data),
  deleteAdminUnit: (id: string) => api.delete(`/admin-units/${id}`),
  
  getDepartments: () => api.get('/departments'),
  addDepartment: (data: any) => api.post('/departments', data),
  updateDepartment: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
  
  getPersonnel: () => api.get('/personnel'),
  addPersonnel: (data: any) => api.post('/personnel', data),
  updatePersonnel: (id: string, data: any) => api.patch(`/personnel/${id}`, data),
  deletePersonnel: (id: string) => api.delete(`/personnel/${id}`),
  
  getHistory: (params: any) => api.get('/traceability/history', { params }),
  manualAllocate: (data: { personId: string, itemId: string, quantity: number, date?: string, notes?: string }) => 
    api.post('/traceability/allocate', data)
};

export default api;
