import axiosInstance from './axiosConfig';

const courtService = {
  getAll: (params) => axiosInstance.get('/user/courts', { params }),
  getById: (id, params) => axiosInstance.get(`/user/courts/${id}`, { params }),
  
  // Admin methods
  adminGetAll: (params) => axiosInstance.get('/admin/courts', { params }),
  adminCreate: (data) => axiosInstance.post('/admin/courts', data),
  adminUpdate: (id, data) => axiosInstance.put(`/admin/courts/${id}`, data),
  adminDelete: (id) => axiosInstance.delete(`/admin/courts/${id}`),
};

export default courtService;
