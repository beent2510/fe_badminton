import api from "./axiosConfig";

const bookingService = {
  // User
  bookCourt: (data) => api.post("/user/bookings/book-court", data),
  bookGroup: (data) => api.post("/user/bookings/book-group", data),
  getMyBookings: (params) => api.get("/user/bookings", { params }),
  getById: (id) => api.get(`/user/bookings/${id}`),
  cancel: (id) => api.put(`/user/bookings/${id}`, { status: "cancelled" }),
  // Admin
  adminGetAll: (params) => api.get("/admin/bookings", { params }),
  adminGetById: (id) => api.get(`/admin/bookings/${id}`),
  adminCreate: (data) => api.post("/admin/bookings", data),
  adminUpdate: (id, data) => api.put(`/admin/bookings/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/bookings/${id}`),
};

export default bookingService;
