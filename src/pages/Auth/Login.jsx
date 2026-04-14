import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, InputAdornment, IconButton, Link as MuiLink } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { showNotification } from '../../store/notificationSlice';
import authService from '../../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return dispatch(showNotification({ message: 'Vui lòng nhập đầy đủ thông tin!', severity: 'warning' }));
    }

    try {
      dispatch(loginStart());
      const res = await authService.login({ email, password });
      
      // Auto fetch user profile after getting token
      localStorage.setItem('token', res.data.token);
      const userRes = await authService.me();
      
      dispatch(loginSuccess({ token: res.data.token, user: userRes.data }));
      dispatch(showNotification({ message: 'Đăng nhập thành công!', severity: 'success' }));
      
      if (userRes.data.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.error || 'Đăng nhập thất bại'));
      dispatch(showNotification({ message: 'Sai email hoặc mật khẩu', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,214,0,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,214,0,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Container maxWidth="xs">
        <Box sx={{
          background: 'rgba(22, 22, 22, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid #2a2a2a',
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 1
        }}>
          <Typography variant="h3" sx={{ mb: 1, fontSize: '2.5rem' }}>🐝</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(135deg, #FFD600, #FFC000)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Chào mừng trở lại
          </Typography>
          <Typography variant="body2" sx={{ color: '#9a9a9a', mb: 4 }}>
            Đăng nhập để đặt sân cầu lông
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder="Email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email sx={{ color: '#666' }}/></InputAdornment>,
                sx: { bgcolor: '#111', borderRadius: 2 }
              }}
            />
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 3 }}>
              <MuiLink href="#" underline="hover" sx={{ color: '#FFD600', fontSize: '0.85rem' }}>
                Quên mật khẩu?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                bgcolor: '#FFD600', color: '#000', fontWeight: 700, fontSize: '1rem',
                '&:hover': { bgcolor: '#FFC000' }
              }}
            >
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 3, color: '#9a9a9a' }}>
            Chưa có tài khoản?{' '}
            <MuiLink component={Link} to="/register" sx={{ color: '#FFD600', fontWeight: 600, textDecoration: 'none' }}>
              Đăng ký ngay
            </MuiLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
