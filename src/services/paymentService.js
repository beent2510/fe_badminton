import api from './axiosConfig';

const paymentService = {
  // User
  create: (data) => api.post('/user/payments', data),
  createZalopayPayment: (data) => api.post('/user/payments/zalopay/create', data),
  getAll: (params) => api.get('/user/payments', { params }),
  getById: (id) => api.get(`/user/payments/${id}`),
  // Admin
  adminGetAll: (params) => api.get('/admin/payments', { params }),
  adminGetById: (id) => api.get(`/admin/payments/${id}`),
  adminCreate: (data) => api.post('/admin/payments', data),
  adminUpdate: (id, data) => api.put(`/admin/payments/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/payments/${id}`),
};

export default paymentService;
