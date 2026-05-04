import api from "./axiosConfig";

const blockedSlotService = {
  getAll: (params) => api.get("/user/blocked-slots", { params }),
  adminGetAll: (params) => api.get("/admin/blocked-slots", { params }),
  adminCreate: (data) => api.post("/admin/blocked-slots", data),
  adminUpdate: (id, data) => api.put(`/admin/blocked-slots/${id}`, data),
  adminDelete: (id) => api.delete(`/admin/blocked-slots/${id}`),
};

export default blockedSlotService;
