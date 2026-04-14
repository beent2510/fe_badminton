import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, InputAdornment, IconButton, Link as MuiLink } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import authService from '../../services/authService';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return dispatch(showNotification({ message: 'Vui lòng nhập đầy đủ thông tin!', severity: 'warning' }));
    }
    if (formData.password !== formData.confirmPassword) {
      return dispatch(showNotification({ message: 'Mật khẩu xác nhận không khớp!', severity: 'error' }));
    }

    try {
      setLoading(true);
      await authService.register({ name: formData.name, email: formData.email, password: formData.password });
      dispatch(showNotification({ message: 'Đăng ký thành công! Vui lòng đăng nhập.', severity: 'success' }));
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Đăng ký thất bại';
      dispatch(showNotification({ message: errorMsg, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,214,0,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Container maxWidth="xs">
        <Box sx={{
          background: 'rgba(22, 22, 22, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid #2a2a2a',
          borderRadius: 4, p: 4, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1
        }}>
          <Typography variant="h3" sx={{ mb: 1, fontSize: '2rem' }}>🐝</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(135deg, #FFD600, #FFC000)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tạo tài khoản mới
          </Typography>
          <Typography variant="body2" sx={{ color: '#9a9a9a', mb: 3 }}>
            Tham gia vào cộng đồng Bee Court
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth name="name" placeholder="Họ và tên" variant="outlined" margin="normal"
              value={formData.name} onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person sx={{ color: '#666' }}/></InputAdornment>,
                sx: { bgcolor: '#111', borderRadius: 2 }
              }}
            />
            <TextField
              fullWidth name="email" placeholder="Email" variant="outlined" margin="normal"
              value={formData.email} onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email sx={{ color: '#666' }}/></InputAdornment>,
                sx: { bgcolor: '#111', borderRadius: 2 }
              }}
            />
            <TextField
              fullWidth name="password" type={showPassword ? 'text' : 'password'} placeholder="Mật khẩu" variant="outlined" margin="normal"
              value={formData.password} onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#666' }}/></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#666' }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { bgcolor: '#111', borderRadius: 2 }
              }}
            />
            <TextField
              fullWidth name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Xác nhận mật khẩu" variant="outlined" margin="normal"
              value={formData.confirmPassword} onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#666' }}/></InputAdornment>,
                sx: { bgcolor: '#111', borderRadius: 2 }
              }}
            />

            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, py: 1.5, bgcolor: '#FFD600', color: '#000', fontWeight: 700, fontSize: '1rem', '&:hover': { bgcolor: '#FFC000' } }}>
              {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 3, color: '#9a9a9a' }}>
            Đã có tài khoản?{' '}
            <MuiLink component={Link} to="/login" sx={{ color: '#FFD600', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </MuiLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
