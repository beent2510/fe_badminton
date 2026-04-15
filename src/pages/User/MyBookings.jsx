import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, Chip, Button, CircularProgress, Divider } from '@mui/material';
import { Event, AccessTime, LocationOn, SportsTennis } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import bookingService from '../../services/bookingService';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

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

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'paid': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'paid': return 'Đã thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#FFD600' }} />
      </Box>
    );
  }

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
                      <Chip label={getStatusText(booking.status)} color={getStatusColor(booking.status)} size="small" sx={{ fontWeight: 600 }} />
                    </Box>

                    <Divider sx={{ borderColor: '#2a2a2a', my: 2 }} />

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
                          <AccessTime fontSize="small" /> {booking.start_time} - {booking.end_time}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ bgcolor: '#111', p: 1.5, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Tổng thanh toán:</Typography>
                      <Typography variant="h6" sx={{ color: '#FFD600', fontWeight: 800 }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.final_price || booking.total_price)}
                      </Typography>
                    </Box>

                    {booking.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() => handleCancel(booking.id)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Hủy lịch
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
