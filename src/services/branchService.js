import axiosInstance from './axiosConfig';

const branchService = {
  getAll: (params) => axiosInstance.get('/user/branches', { params }),
  
  // Admin methods
  adminGetAll: (params) => axiosInstance.get('/admin/branches', { params }),
  adminCreate: (data) => axiosInstance.post('/admin/branches', data),
  adminUpdate: (id, data) => axiosInstance.put(`/admin/branches/${id}`, data),
  adminDelete: (id) => axiosInstance.delete(`/admin/branches/${id}`),
};

export default branchService;
