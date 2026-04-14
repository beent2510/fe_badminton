import api from './axiosConfig';

const courtScheduleService = {
  // Admin CRUD
  adminGetAll: (params) => api.get('/admin/court-schedules', { params }),
  adminGetById: (id) => api.get(`/admin/court-schedules/${id}`),
  adminCreate: (data) => api.post('/admin/court-schedules', data),
  adminUpdate: (id, data) => api.put(`/admin/court-schedules/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/court-schedules/${id}`),
};

export default courtScheduleService;
