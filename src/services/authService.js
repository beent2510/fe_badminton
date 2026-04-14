import axiosInstance from './axiosConfig';

const authService = {
  login: (data) => axiosInstance.post('/auth/login', data),
  register: (data) => axiosInstance.post('/auth/register', data),
  me: () => axiosInstance.get('/auth/me'),
  logout: () => axiosInstance.post('/auth/logout'),
};

export default authService;
