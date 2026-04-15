import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, Divider, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { LocationOn, Phone, Star, SportsTennis } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import branchService from '../../services/branchService';
import bookingService from '../../services/bookingService';
import promotionService from '../../services/promotionService';

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem('user'));
  const { isAuthenticated } = useSelector(state => state.auth);

  const [branch, setBranch] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [openBooking, setOpenBooking] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [bookingData, setBookingData] = useState({
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
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

  const handleSlotClick = (court, slot) => {
    if (selectedCourt?.id !== court.id) {
      setSelectedCourt(court);
      setBookingData({ ...bookingData, start_time: slot, end_time: getNextSlot(slot) });
      setSelectionStep(1);
    } else {
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
    }
  };

  const handleChange = (e) => setBookingData({ ...bookingData, [e.target.name]: e.target.value });

  const isSlotBooked = (court, slot) => {
    if (!court.bookings || court.bookings.length === 0) return false;
    return court.bookings.some(booking => {
      const start = booking.start_time.substring(0, 5);
      const end = booking.end_time.substring(0, 5);
      return slot >= start && slot < end;
    });
  };

  const isSlotSelected = (court, slot) => {
    return selectedCourt?.id === court.id && slot >= bookingData.start_time && slot < bookingData.end_time;
  };

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const branchRes = await branchService.getById(id);
        setBranch(branchRes.data.data || branchRes.data);
      } catch (error) {
        console.error('Lỗi tải chi nhánh', error);
        dispatch(showNotification({ message: 'Không thể tải thông tin chi nhánh', severity: 'error' }));
        navigate('/');
      }
    };
    fetchBranch();
  }, [id, navigate, dispatch]);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const courtsRes = await branchService.getCourts(id, { date: bookingData.booking_date });
        setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
      } catch (error) {
        console.error('Lỗi tải danh sách sân', error);
      } finally {
        setLoading(false);
      }
    };
    if (bookingData.booking_date) {
      fetchCourts();
    }
  }, [id, bookingData.booking_date]);

  const calculateHours = () => {
    if (!bookingData.start_time || !bookingData.end_time) return 0;
    const start = new Date(`2000-01-01T${bookingData.start_time}`);
    const end = new Date(`2000-01-01T${bookingData.end_time}`);
    const diff = (end - start) / 3600000;
    return diff > 0 ? diff : 0;
  };

  const calculateTotal = () => {
    if (!selectedCourt) return 0;
    const hours = calculateHours();
    return selectedCourt.price_per_hour * hours;
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

  const handleOpenBooking = (court) => {
    if (!isAuthenticated) return navigate('/login');
    if (!selectedCourt || selectedCourt.id !== court.id || !bookingData.start_time) {
      dispatch(showNotification({ message: 'Vui lòng chọn thời gian chơi trên bảng giờ', severity: 'warning' }));
      return;
    }
    setOpenBooking(true);
  };

  const handleBooking = async () => {
    const hours = calculateHours();
    if (hours <= 0) return dispatch(showNotification({ message: 'Giờ kết thúc phải sau giờ bắt đầu', severity: 'warning' }));

    try {
      setBookingLoading(true);
      const total = calculateTotal();
      const payload = {
        user_id: user.id,
        court_id: selectedCourt.id,
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
      setBookingData({ ...bookingData, start_time: '', end_time: '', promotion_code: '' });
      setSelectedCourt(null);
      setSelectionStep(0);
      setPromoResult(null);
      navigate('/my-bookings');
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

  if (!branch) return null;

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="lg">
        {/* Branch Info */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{branch.name}</Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ color: '#FFD600' }} />
              <Typography color="text.secondary">{branch.address}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ color: '#FFD600' }} />
              <Typography color="text.secondary">{branch.phone_number}</Typography>
            </Box>
          </Box>
          <Divider sx={{ borderColor: '#2a2a2a' }} />
        </Box>

        {/* Global Date Selection & Legend */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 3, bgcolor: '#111', p: 3, borderRadius: 2, border: '1px solid #2a2a2a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Chọn ngày chơi chung:</Typography>
            <TextField
              type="date"
              name="booking_date"
              value={bookingData.booking_date}
              onChange={(e) => {
                handleChange(e);
                setSelectedCourt(null);
                setBookingData(prev => ({ ...prev, start_time: '', end_time: '' }));
                setSelectionStep(0);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#1e1e1e' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: 4 }}></span> Trống</Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: '#FFD600', borderRadius: 4 }}></span> Đang chọn</Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: '#ef4444', borderRadius: 4 }}></span> Đã có người đặt</Typography>
          </Box>
        </Box>

        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Danh sách sân</Typography>

        {courts.length === 0 ? (
          <Typography sx={{ color: '#9a9a9a' }}>Chi nhánh này hiện chưa có sân nào.</Typography>
        ) : (
          <Grid container spacing={4}>
            {courts.map((court) => (
              <Grid xs={12} key={court.id}>
                <Card sx={{ bgcolor: '#111', border: '1px solid #2a2a2a', borderRadius: 4, overflow: 'hidden' }}>
                  <Grid container>
                    <Grid xs={12} md={3} sx={{ bgcolor: '#1e1e1e', p: 3, borderRight: { md: '1px solid #2a2a2a' }, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#FFD600' }}>{court.name}</Typography>
                      <Chip
                        label={court.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                        size="small"
                        sx={{ alignSelf: 'flex-start', mb: 2, bgcolor: court.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: court.status === 'active' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', mb: 2 }}>
                        <SportsTennis sx={{ color: '#9a9a9a' }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(court.price_per_hour)}/h</Typography>
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ fontWeight: 700, bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}
                        onClick={() => handleOpenBooking(court)}
                      >
                        ĐẶT SÂN NÀY
                      </Button>
                    </Grid>
                    <Grid xs={12} md={9} sx={{ p: 3 }}>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Bảng giờ: Bấm vào 1 ô để chọn giờ bắt đầu, bấm ô tiếp theo để chọn giờ kết thúc.
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 1 }}>
                        {TIME_SLOTS.map(slot => {
                          const isBooked = isSlotBooked(court, slot);
                          const isSelected = isSlotSelected(court, slot);
                          return (
                            <Chip
                              key={slot}
                              label={slot}
                              clickable={!isBooked}
                              onClick={() => !isBooked && handleSlotClick(court, slot)}
                              sx={{
                                bgcolor: isBooked ? '#ef4444' : (isSelected ? '#FFD600' : '#1e1e1e'),
                                color: isBooked ? '#fff' : (isSelected ? '#000' : '#fff'),
                                fontWeight: isSelected ? 700 : 500,
                                border: isSelected || isBooked ? 'none' : '1px solid #333',
                                '&:hover': { bgcolor: isBooked ? '#ef4444' : (isSelected ? '#e6c200' : '#333') },
                                transition: 'all 0.2s',
                                borderRadius: 1,
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                opacity: isBooked ? 0.8 : 1
                              }}
                            />
                          );
                        })}
                      </Box>
                      {selectedCourt?.id === court.id && bookingData.start_time && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, bgcolor: 'rgba(255,214,0,0.1)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,214,0,0.2)' }}>
                          <Typography variant="body2" color="#FFD600">Đã chọn: <strong>{bookingData.start_time} - {bookingData.end_time || '...'}</strong></Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Booking Dialog */}
      <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a', pb: 2 }}>
          Xác nhận đặt sân
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedCourt && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>{selectedCourt.name}</Typography>
              <Typography variant="body2" color="text.secondary">{branch.name}</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>Ngày: {bookingData.booking_date}</Typography>
              <Typography variant="body2" color="text.secondary">Giờ: {bookingData.start_time} - {bookingData.end_time}</Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid xs={12}>
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
              <Typography>{selectedCourt && new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedCourt.price_per_hour)}/h</Typography>
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
