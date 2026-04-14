import api from './axiosConfig';

const promotionService = {
  // User
  checkCode: (code) => api.post('/user/promotions/check-code', { code }),
  applyCode: (code, total) => api.post('/user/promotions/apply-code', { code, total }),
  getAll: (params) => api.get('/user/promotions', { params }),
  // Admin
  adminGetAll: (params) => api.get('/admin/promotions', { params }),
  adminGetById: (id) => api.get(`/admin/promotions/${id}`),
  adminCreate: (data) => api.post('/admin/promotions', data),
  adminUpdate: (id, data) => api.put(`/admin/promotions/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/promotions/${id}`),
};

export default promotionService;
