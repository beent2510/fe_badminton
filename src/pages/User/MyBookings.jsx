import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, Chip, Button, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating } from '@mui/material';
import { Event, AccessTime, LocationOn, Star, RateReview } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import bookingService from '../../services/bookingService';
import reviewService from '../../services/reviewService';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null); // { booking }
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewedIds, setReviewedIds] = useState({}); // bookingId -> true
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings();
      setBookings(res.data.items || res.data.data || res.data);
    } catch {
      dispatch(showNotification({ message: 'Không thể tải lịch sử đặt sân', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch này?')) return;
    try {
      await bookingService.cancel(id);
      dispatch(showNotification({ message: 'Hủy lịch thành công', severity: 'success' }));
      fetchBookings();
    } catch {
      dispatch(showNotification({ message: 'Hủy lịch thất bại', severity: 'error' }));
    }
  };

  const openReview = (booking) => {
    setReviewTarget(booking);
    setReviewForm({ rating: 5, comment: '' });
    setReviewDialog(true);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await reviewService.submitReview({
        court_id: reviewTarget.court_id,
        booking_id: reviewTarget.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      dispatch(showNotification({ message: 'Cảm ơn bạn đã đánh giá sân!', severity: 'success' }));
      setReviewedIds(prev => ({ ...prev, [reviewTarget.id]: true }));
      setReviewDialog(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Không thể gửi đánh giá';
      dispatch(showNotification({ message: msg, severity: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const canReview = (booking) => (booking.status === 'confirmed' || booking.status === 'paid') && !reviewedIds[booking.id];
  const isPlayed = (booking) => {
    const now = new Date();
    const playDate = new Date(booking.booking_date);
    return playDate < now || booking.status === 'paid';
  };

  const STATUS_COLOR = { pending: '#f59e0b', confirmed: '#3b82f6', paid: '#22c55e', cancelled: '#ef4444' };
  const STATUS_TEXT = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', paid: 'Đã thanh toán', cancelled: 'Đã hủy' };

  if (loading) return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: '#FFD600' }} />
    </Box>
  );

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Lịch đặt sân của tôi</Typography>
        <Typography sx={{ color: '#9a9a9a', mb: 4 }}>Quản lý và xem lại lịch sử các sân cầu lông bạn đã đặt</Typography>

        {bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#111', borderRadius: 4, border: '1px dashed #2a2a2a' }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>📅</Typography>
            <Typography variant="h6" sx={{ color: '#9a9a9a' }}>Bạn chưa có lịch đặt sân nào</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {bookings.map((booking) => (
              <Grid xs={12} md={6} key={booking.id}>
                <Card sx={{ border: '1px solid #2a2a2a', transition: 'all 0.2s', '&:hover': { borderColor: 'rgba(255,214,0,0.3)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{booking.court?.name}</Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#9a9a9a' }}>
                          <LocationOn fontSize="small" sx={{ color: '#FFD600' }} /> {booking.court?.branch?.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={STATUS_TEXT[booking.status] || booking.status}
                        size="small"
                        sx={{ fontWeight: 600, bgcolor: `${STATUS_COLOR[booking.status]}20`, color: STATUS_COLOR[booking.status] }}
                      />
                    </Box>

                    <Divider sx={{ borderColor: '#2a2a2a', my: 1.5 }} />

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">Ngày chơi</Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                          <Event fontSize="small" /> {booking.booking_date}
                        </Typography>
                      </Grid>
                      <Grid xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">Thời gian</Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                          <AccessTime fontSize="small" /> {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ bgcolor: '#111', p: 1.5, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Tổng thanh toán:</Typography>
                      <Typography variant="h6" sx={{ color: '#FFD600', fontWeight: 800 }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.final_price || booking.total_price)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {booking.status === 'pending' && (
                        <Button variant="outlined" color="error" fullWidth onClick={() => handleCancel(booking.id)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                          Hủy lịch
                        </Button>
                      )}
                      {canReview(booking) && isPlayed(booking) && (
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<RateReview />}
                          onClick={() => openReview(booking)}
                          sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#FFD600', color: '#FFD600', '&:hover': { borderColor: '#FFC000', bgcolor: 'rgba(255,214,0,0.05)' } }}
                        >
                          Đánh giá sân
                        </Button>
                      )}
                      {reviewedIds[booking.id] && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#22c55e', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                          <Star fontSize="small" />
                          Đã đánh giá
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#161616', border: '1px solid #2a2a2a' } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>
          Đánh giá sân {reviewTarget?.court?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Ngày chơi: <strong>{reviewTarget?.booking_date}</strong> | Giờ: <strong>{reviewTarget?.start_time?.substring(0,5)} - {reviewTarget?.end_time?.substring(0,5)}</strong>
          </Typography>

          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={600} mb={1}>Chất lượng sân</Typography>
            <Rating
              value={reviewForm.rating}
              onChange={(_, val) => setReviewForm({ ...reviewForm, rating: val })}
              size="large"
              sx={{ '& .MuiRating-iconFilled': { color: '#FFD600' }, '& .MuiRating-iconHover': { color: '#FFC000' } }}
            />
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc'][reviewForm.rating]}
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Nhận xét của bạn (không bắt buộc)"
            value={reviewForm.comment}
            onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
            placeholder="Chia sẻ trải nghiệm của bạn về sân cầu lông này..."
            inputProps={{ maxLength: 1000 }}
          />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block" textAlign="right">
            {reviewForm.comment.length}/1000
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2a2a2a' }}>
          <Button onClick={() => setReviewDialog(false)} color="inherit">Hủy</Button>
          <Button
            onClick={submitReview}
            variant="contained"
            disabled={submitting || !reviewForm.rating}
            sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' }, px: 3 }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: '#000' }} /> : 'Gửi đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
