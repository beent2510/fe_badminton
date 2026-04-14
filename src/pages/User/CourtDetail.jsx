import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardMedia, Divider, Button, Rating, Chip, CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { LocationOn, SportsTennis, AccessTime, Star, CheckCircle } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import courtService from '../../services/courtService';
import bookingService from '../../services/bookingService';
import promotionService from '../../services/promotionService';

export default function CourtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem('user'));
  const { isAuthenticated } = useSelector(state => state.auth);

  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '20:00',
    promotion_code: ''
  });
  const [promoResult, setPromoResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectionStep, setSelectionStep] = useState(0);

  const TIME_SLOTS = Array.from({ length: 37 }, (_, i) => {
    const hour = Math.floor(i / 2) + 5;
    const min = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${min}`;
  });

  const getNextSlot = (slot) => {
    const [h, m] = slot.split(':').map(Number);
    if (m === 0) return `${h.toString().padStart(2, '0')}:30`;
    return `${(h + 1).toString().padStart(2, '0')}:00`;
  };

  const handleSlotClick = (slot) => {
    if (selectionStep === 0) {
      setBookingData({ ...bookingData, start_time: slot, end_time: getNextSlot(slot) });
      setSelectionStep(1);
    } else {
      if (slot >= bookingData.start_time) {
        setBookingData({ ...bookingData, end_time: getNextSlot(slot) });
      } else {
        setBookingData({ ...bookingData, start_time: slot, end_time: getNextSlot(bookingData.start_time) });
      }
      setSelectionStep(0);
    }
  };

  const isSlotSelected = (slot) => {
    return slot >= bookingData.start_time && slot < bookingData.end_time;
  };

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const res = await courtService.getById(id);
        setCourt(res.data.data || res.data);
      } catch {
        dispatch(showNotification({ message: 'Không thể tải thông tin sân', severity: 'error' }));
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchCourt();
  }, [id, navigate, dispatch]);

  const handleChange = (e) => setBookingData({ ...bookingData, [e.target.name]: e.target.value });

  const calculateHours = () => {
    const start = new Date(`2000-01-01T${bookingData.start_time}`);
    const end = new Date(`2000-01-01T${bookingData.end_time}`);
    const diff = (end - start) / 3600000;
    return diff > 0 ? diff : 0;
  };

  const calculateTotal = () => {
    if (!court) return 0;
    const hours = calculateHours();
    return court.price_per_hour * hours;
  };

  const checkPromoCode = async () => {
    if (!bookingData.promotion_code) return;
    try {
      const res = await promotionService.checkCode(bookingData.promotion_code);
      if (res.data.success) {
        const total = calculateTotal();
        const applyRes = await promotionService.applyCode(bookingData.promotion_code, total);
        setPromoResult({ valid: true, ...applyRes.data });
        dispatch(showNotification({ message: 'Đã áp dụng mã giảm giá', severity: 'success' }));
      } else {
        setPromoResult({ valid: false, message: res.data.message });
      }
    } catch {
      setPromoResult({ valid: false, message: 'Mã không hợp lệ hoặc đã hết hạn' });
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) return navigate('/login');
    const hours = calculateHours();
    if (hours <= 0) return dispatch(showNotification({ message: 'Giờ kết thúc phải sau giờ bắt đầu', severity: 'warning' }));

    try {
      setBookingLoading(true);
      const total = calculateTotal();
      const payload = {
        user_id: user.id,
        court_id: court.id,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        total_price: total,
        final_price: promoResult?.valid ? promoResult.final_price : total,
        promotion_code: promoResult?.valid ? bookingData.promotion_code : null
      };

      await bookingService.bookCourt(payload);
      dispatch(showNotification({ message: 'Đặt sân thành công!', severity: 'success' }));
      setOpenBooking(false);
      // Optional: navigate to my-bookings
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra khi đặt sân';
      dispatch(showNotification({ message: errorMsg, severity: 'error' }));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#FFD600' }} />
      </Box>
    );
  }

  if (!court) return null;

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box sx={{ borderRadius: 4, overflow: 'hidden', mb: 3, position: 'relative' }}>
              <CardMedia
                component="img"
                height="400"
                image={court.image_url ? 'http://localhost:8000/storage/' + court.image_url : `http://localhost:8000/public/?name=${encodeURIComponent(court.name)}&background=1e1e1e&color=FFD600&font-size=0.3`}
                alt={court.name}
              />
              <Chip
                label={court.status === 'active' ? 'Đang hoạt động' : 'Bảo trì'}
                sx={{ position: 'absolute', top: 16, left: 16, bgcolor: court.status === 'active' ? '#22c55e' : '#f59e0b', color: '#fff', fontWeight: 600 }}
              />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{court.name}</Typography>

            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#FFD600' }} />
                <Typography color="text.secondary">{court.branch?.name} - {court.branch?.address}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star sx={{ color: '#FFD600' }} />
                <Typography>4.8 <span style={{ color: '#666' }}>(120 đánh giá)</span></Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#2a2a2a', my: 3 }} />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Mô tả sân</Typography>
            <Typography sx={{ color: '#9a9a9a', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {court.description || 'Sân cầu lông đạt tiêu chuẩn thi đấu quốc tế với thảm trải cao cấp, ánh sáng chống chói và không gian rộng rãi thoáng mát. Phù hợp cho cả việc tập luyện và tổ chức các giải đấu quy mô nhỏ đến vừa.'}
            </Typography>

            <Divider sx={{ borderColor: '#2a2a2a', my: 3 }} />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Tiện ích</Typography>
            <Grid container spacing={2}>
              {['Wifi miễn phí', 'Chỗ để xe rộng rãi', 'Khu vực nghỉ ngơi', 'Nước suối lạnh', 'Băng gạc y tế'].map(item => (
                <Grid item xs={6} sm={4} key={item}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Booking Widget Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              <Card sx={{ p: 3, background: 'linear-gradient(145deg, #161616, #111)', border: '1px solid #2a2a2a', borderRadius: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#FFD600' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(court.price_per_hour)}
                  <span style={{ fontSize: '1rem', color: '#9a9a9a', fontWeight: 500 }}> / giờ</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>Bao gồm thuế và phí</Typography>

                <Divider sx={{ borderColor: '#2a2a2a', mb: 3 }} />

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => setOpenBooking(true)}
                  sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem', bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}
                >
                  ĐẶT SÂN NGAY
                </Button>

                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9a9a9a' }}>
                    <CheckCircle sx={{ color: '#FFD600', fontSize: 16 }} /> Xác nhận tức thì
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9a9a9a' }}>
                    <CheckCircle sx={{ color: '#FFD600', fontSize: 16 }} /> Hỗ trợ huỷ linh hoạt
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Booking Dialog */}
      <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a', pb: 2 }}>
          Xác nhận đặt sân
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>{court.name}</Typography>
            <Typography variant="body2" color="text.secondary">{court.branch?.name}</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth type="date" name="booking_date" label="Ngày chơi"
                value={bookingData.booking_date} onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1.5} mt={1}>
                Chọn giờ chơi (Bấm vào 1 ô để chọn giờ bắt đầu, bấm ô tiếp theo để chọn giờ kết thúc)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                {TIME_SLOTS.map(slot => (
                  <Chip
                    key={slot}
                    label={slot}
                    clickable
                    onClick={() => handleSlotClick(slot)}
                    sx={{
                      width: '100%',
                      bgcolor: isSlotSelected(slot) ? '#FFD600' : '#1e1e1e',
                      color: isSlotSelected(slot) ? '#000' : '#fff',
                      fontWeight: isSlotSelected(slot) ? 700 : 500,
                      border: isSlotSelected(slot) ? 'none' : '1px solid #333',
                      '&:hover': { bgcolor: isSlotSelected(slot) ? '#e6c200' : '#333' },
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, bgcolor: 'rgba(255,214,0,0.1)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,214,0,0.2)' }}>
                <Typography variant="body2" color="#FFD600">Bắt đầu: <strong>{bookingData.start_time}</strong></Typography>
                <Typography variant="body2" color="#FFD600">Kết thúc: <strong>{bookingData.end_time}</strong></Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth name="promotion_code" label="Mã giảm giá (nếu có)"
                  value={bookingData.promotion_code} onChange={handleChange}
                />
                <Button variant="outlined" color="primary" onClick={checkPromoCode} disabled={!bookingData.promotion_code}>
                  ÁP DỤNG
                </Button>
              </Box>
              {promoResult?.valid === false && (
                <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>{promoResult.message}</Typography>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#111', borderRadius: 2, border: '1px solid #2a2a2a' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Đơn giá</Typography>
              <Typography>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(court.price_per_hour)}/h</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Thời gian</Typography>
              <Typography>{calculateHours()} giờ</Typography>
            </Box>

            {promoResult?.valid && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: '#22c55e' }}>
                <Typography>Giảm giá</Typography>
                <Typography>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal() - promoResult.total)}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 1, borderColor: '#2a2a2a' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography fontWeight={700}>Tổng cộng</Typography>
              <Typography fontWeight={800} color="#FFD600" fontSize="1.2rem">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promoResult?.valid ? promoResult.total : calculateTotal())}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #2a2a2a' }}>
          <Button onClick={() => setOpenBooking(false)} color="inherit">Hủy</Button>
          <Button onClick={handleBooking} variant="contained" color="primary" disabled={bookingLoading} sx={{ px: 4 }}>
            XÁC NHẬN ĐẶT {bookingLoading && <CircularProgress size={20} sx={{ ml: 1, color: '#000' }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
