import api from './axiosConfig';

const courtPeakHourService = {
  // Admin CRUD
  adminGetAll: (params) => api.get('/admin/court-peak-hours', { params }),
  adminGetById: (id) => api.get(`/admin/court-peak-hours/${id}`),
  adminCreate: (data) => api.post('/admin/court-peak-hours', data),
  adminUpdate: (id, data) => api.put(`/admin/court-peak-hours/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/court-peak-hours/${id}`),
};

export default courtPeakHourService;
