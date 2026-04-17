import axiosInstance from './axiosConfig';

const adminService = {
  // Branches
  getBranches: (params) => axiosInstance.get('/admin/branches', { params }),
  createBranch: (data) => axiosInstance.post('/admin/branches', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBranch: (id, data) => axiosInstance.post(`/admin/branches/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBranch: (id) => axiosInstance.delete(`/admin/branches/${id}`),

  // Managers
  getManagers: (params) => axiosInstance.get('/admin/managers', { params }),
  createManager: (data) => axiosInstance.post('/admin/managers', data),
  updateManager: (id, data) => axiosInstance.put(`/admin/managers/${id}`, data),
  deleteManager: (id) => axiosInstance.delete(`/admin/managers/${id}`),

  // Courts
  getCourts: (params) => axiosInstance.get('/admin/courts', { params }),
  createCourt: (data) => axiosInstance.post('/admin/courts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCourt: (id, data) => axiosInstance.post(`/admin/courts/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCourt: (id) => axiosInstance.delete(`/admin/courts/${id}`),

  // Court Schedules
  getSchedules: (params) => axiosInstance.get('/admin/court-schedules', { params }),
  createSchedule: (data) => axiosInstance.post('/admin/court-schedules', data),
  updateSchedule: (id, data) => axiosInstance.put(`/admin/court-schedules/${id}`, data),
  deleteSchedule: (id) => axiosInstance.delete(`/admin/court-schedules/${id}`),

  // Court Peak Hours
  getPeakHours: (params) => axiosInstance.get('/admin/court-peak-hours', { params }),
  createPeakHour: (data) => axiosInstance.post('/admin/court-peak-hours', data),
  updatePeakHour: (id, data) => axiosInstance.put(`/admin/court-peak-hours/${id}`, data),
  deletePeakHour: (id) => axiosInstance.delete(`/admin/court-peak-hours/${id}`),

  // Bookings
  getBookings: (params) => axiosInstance.get('/admin/bookings', { params }),
  updateBooking: (id, data) => axiosInstance.put(`/admin/bookings/${id}`, data),
  deleteBooking: (id) => axiosInstance.delete(`/admin/bookings/${id}`),

  // Promotions
  getPromotions: (params) => axiosInstance.get('/admin/promotions', { params }),
  createPromotion: (data) => axiosInstance.post('/admin/promotions', data),
  updatePromotion: (id, data) => axiosInstance.put(`/admin/promotions/${id}`, data),
  deletePromotion: (id) => axiosInstance.delete(`/admin/promotions/${id}`),
};

export default adminService;
