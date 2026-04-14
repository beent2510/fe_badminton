import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, TextField, Button, CircularProgress, Avatar } from '@mui/material';
import { Person, Email, Phone, Home as HomeIcon, Save } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import { updateUser } from '../../store/authSlice';
import authService from '../../services/authService';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.updateProfile(formData);
      dispatch(updateUser(res.data || res));
      dispatch(showNotification({ message: 'Cập nhật thông tin thành công!', severity: 'success' }));
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Cập nhật thất bại';
      dispatch(showNotification({ message: msg, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Tài khoản của tôi</Typography>
        <Typography sx={{ color: '#9a9a9a', mb: 4 }}>Quản lý thông tin cá nhân và bảo mật tài khoản</Typography>

        <Card sx={{ border: '1px solid #2a2a2a', bgcolor: '#111' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
              <Avatar 
                sx={{ 
                  width: 100, height: 100, mb: 2, 
                  background: 'linear-gradient(135deg, #FFD600, #FFC000)',
                  color: '#000', fontSize: '3rem', fontWeight: 800 
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>{user?.name}</Typography>
              <Typography color="text.secondary">{user?.email}</Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    <Person sx={{ color: '#FFD600', mb: 0.5 }} />
                    <TextField 
                      fullWidth 
                      label="Họ và tên" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      variant="standard"
                      sx={{ '& .MuiInput-underline:before': { borderBottomColor: '#2a2a2a' } }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    <Email sx={{ color: '#FFD600', mb: 0.5 }} />
                    <TextField 
                      fullWidth 
                      label="Email" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      variant="standard"
                      sx={{ '& .MuiInput-underline:before': { borderBottomColor: '#2a2a2a' } }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    <Phone sx={{ color: '#FFD600', mb: 0.5 }} />
                    <TextField 
                      fullWidth 
                      label="Số điện thoại" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      variant="standard"
                      sx={{ '& .MuiInput-underline:before': { borderBottomColor: '#2a2a2a' } }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    <HomeIcon sx={{ color: '#FFD600', mb: 0.5 }} />
                    <TextField 
                      fullWidth 
                      label="Địa chỉ" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      variant="standard"
                      sx={{ '& .MuiInput-underline:before': { borderBottomColor: '#2a2a2a' } }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    sx={{ px: 4, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                  >
                    Lưu Thay Đổi
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
