import api from './axiosConfig';

const reviewService = {
  // User
  create: (data) => api.post('/user/reviews', data),
  getAll: (params) => api.get('/user/reviews', { params }),
  // Admin
  adminGetAll: (params) => api.get('/admin/reviews', { params }),
  adminGetById: (id) => api.get(`/admin/reviews/${id}`),
  adminUpdate: (id, data) => api.put(`/admin/reviews/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/reviews/${id}`),
};

export default reviewService;
