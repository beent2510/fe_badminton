import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, Button, IconButton, Avatar,
  Menu, MenuItem, Drawer, List, ListItem, ListItemButton,
  ListItemText, useMediaQuery, useTheme, Divider, Typography, Chip
} from '@mui/material';
import {
  Menu as MenuIcon, Close as CloseIcon,
  Person as PersonIcon, BookOnline as BookIcon,
  ExitToApp as LogoutIcon, AdminPanelSettings as AdminIcon,
  SportsTennis as BadmintonIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { showNotification } from '../store/notificationSlice';
import authService from '../services/authService';

// Bee SVG Logo
const BeeLogo = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }} component={Link} to="/">
    <Box sx={{ fontSize: '2rem', animation: 'beeFloat 3s ease-in-out infinite', display: 'inline-block' }}>🐝</Box>
    <Box>
      <Typography variant="h6" sx={{
        fontFamily: "'Poppins',sans-serif", fontWeight: 800, lineHeight: 1,
        background: 'linear-gradient(135deg, #FFD600, #FFC000)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        BEE COURT
      </Typography>
      <Typography sx={{ fontSize: '0.6rem', color: '#666', fontWeight: 500, letterSpacing: '0.12em', mt: '-2px' }}>
        BADMINTON BOOKING
      </Typography>
    </Box>
  </Box>
);

const NAV_LINKS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sân cầu lông', to: '/courts' },
];

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    try { await authService.logout(); } catch (e) { console.error(e); }
    dispatch(logout());
    dispatch(showNotification({ message: 'Đã đăng xuất thành công!', severity: 'success' }));
    navigate('/');
    setAnchorEl(null);
  };

  const isActive = (to) => location.pathname === to;

  const navItems = (
    <>
      {NAV_LINKS.map((link) => (
        <Button
          key={link.to}
          component={Link}
          to={link.to}
          sx={{
            color: isActive(link.to) ? '#FFD600' : '#9a9a9a',
            fontWeight: 500, fontSize: '0.9rem',
            px: 2, py: 1, borderRadius: 2,
            background: isActive(link.to) ? 'rgba(255,214,0,0.08)' : 'transparent',
            '&:hover': { color: '#FFD600', background: 'rgba(255,214,0,0.06)' },
            textTransform: 'none',
          }}
        >
          {link.label}
        </Button>
      ))}
    </>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1, maxWidth: 1280, width: '100%', mx: 'auto', minHeight: '70px !important' }}>
          <BeeLogo />

          <Box sx={{ flexGrow: 1 }} />

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              {navItems}
            </Box>
          )}

          {!isMobile && (
            <>
              {isAuthenticated ? (
                <>
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
                    <Avatar sx={{
                      width: 38, height: 38,
                      background: 'linear-gradient(135deg,#FFD600,#FFC000)',
                      color: '#000', fontWeight: 700, fontSize: '0.9rem'
                    }}>
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      sx: { mt: 1, minWidth: 200, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 2 }
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ color: '#FFD600', fontWeight: 700 }}>{user?.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>{user?.email}</Typography>
                      {user?.role === 'admin' && <Chip label="Admin" size="small" sx={{ ml: 1, background: 'rgba(255,214,0,0.15)', color: '#FFD600', fontSize: '0.65rem' }} />}
                    </Box>
                    <Divider sx={{ borderColor: '#2a2a2a' }} />
                    {user?.role === 'admin' && (
                      <MenuItem onClick={() => { navigate('/admin'); setAnchorEl(null); }} sx={{ gap: 1.5, py: 1.5 }}>
                        <AdminIcon sx={{ fontSize: 18, color: '#FFD600' }} /> <Typography variant="body2">Quản trị</Typography>
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => { navigate('/my-bookings'); setAnchorEl(null); }} sx={{ gap: 1.5, py: 1.5 }}>
                      <BookIcon sx={{ fontSize: 18, color: '#9a9a9a' }} /> <Typography variant="body2">Lịch đặt sân</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ gap: 1.5, py: 1.5 }}>
                      <PersonIcon sx={{ fontSize: 18, color: '#9a9a9a' }} /> <Typography variant="body2">Tài khoản</Typography>
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2a2a2a' }} />
                    <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.5, color: '#ef4444' }}>
                      <LogoutIcon sx={{ fontSize: 18 }} /> <Typography variant="body2">Đăng xuất</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button component={Link} to="/login" variant="outlined" sx={{
                    borderColor: '#2a2a2a', color: '#9a9a9a',
                    '&:hover': { borderColor: '#FFD600', color: '#FFD600', background: 'rgba(255,214,0,0.05)' }
                  }}>
                    Đăng nhập
                  </Button>
                  <Button component={Link} to="/register" variant="contained">
                    Đăng ký
                  </Button>
                </Box>
              )}
            </>
          )}

          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#FFD600' }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280, background: '#0f0f0f', p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <BeeLogo />
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#666' }}><CloseIcon /></IconButton>
        </Box>
        <Divider sx={{ borderColor: '#1e1e1e', mb: 2 }} />
        <List disablePadding>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link} to={link.to}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2, color: isActive(link.to) ? '#FFD600' : '#9a9a9a',
                  background: isActive(link.to) ? 'rgba(255,214,0,0.08)' : 'transparent',
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {isAuthenticated && (
            <>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton component={Link} to="/my-bookings" onClick={() => setMobileOpen(false)} sx={{ borderRadius: 2, color: '#9a9a9a' }}>
                  <ListItemText primary="Lịch đặt sân" />
                </ListItemButton>
              </ListItem>
              {user?.role === 'admin' && (
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton component={Link} to="/admin" onClick={() => setMobileOpen(false)} sx={{ borderRadius: 2, color: '#FFD600' }}>
                    <ListItemText primary="Quản trị" />
                  </ListItemButton>
                </ListItem>
              )}
            </>
          )}
        </List>
        <Box sx={{ mt: 'auto', pt: 3 }}>
          {isAuthenticated ? (
            <Button fullWidth variant="outlined" color="error" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Đăng xuất
            </Button>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button fullWidth component={Link} to="/login" variant="outlined" onClick={() => setMobileOpen(false)}>Đăng nhập</Button>
              <Button fullWidth component={Link} to="/register" variant="contained" onClick={() => setMobileOpen(false)}>Đăng ký</Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
