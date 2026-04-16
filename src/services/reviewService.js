import axiosInstance from './axiosConfig';

const reviewService = {
  // User
  submitReview: (data) => axiosInstance.post('/user/reviews', data),
  getByCourtId: (courtId) => axiosInstance.get('/user/reviews', { params: { court_id: courtId } }),
  getMyReviews: (userId) => axiosInstance.get('/user/reviews', { params: { user_id: userId } }),
};

export default reviewService;
