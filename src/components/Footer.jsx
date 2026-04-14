import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, IconButton } from '@mui/material';
import { Facebook, YouTube, Instagram, Phone, Email, LocationOn } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
        borderTop: '1px solid #1a1a1a',
        pt: 6, pb: 3, mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ fontSize: '2.5rem' }}>🐝</Box>
              <Box>
                <Typography variant="h5" sx={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 800,
                  background: 'linear-gradient(135deg,#FFD600,#FFC000)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>BEE COURT</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#555', fontWeight: 500, letterSpacing: '0.1em' }}>
                  BADMINTON BOOKING SYSTEM
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8, mb: 2 }}>
              Hệ thống đặt sân cầu lông hiện đại, nhanh chóng và tiện lợi.
              Trải nghiệm thể thao tuyệt vời cùng Bee Court!
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { icon: <Facebook />, href: '#' },
                { icon: <YouTube />, href: '#' },
                { icon: <Instagram />, href: '#' },
              ].map((s, i) => (
                <IconButton
                  key={i}
                  href={s.href}
                  size="small"
                  sx={{
                    color: '#555', border: '1px solid #2a2a2a', borderRadius: 2,
                    '&:hover': { color: '#FFD600', borderColor: '#FFD600', background: 'rgba(255,214,0,0.08)' },
                    transition: 'all 0.2s',
                  }}
                >
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Links */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ color: '#FFD600', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
              Cho người dùng
            </Typography>
            {['Trang chủ', 'Danh sách sân', 'Đặt sân', 'Lịch đặt của tôi'].map((text) => (
              <Link
                key={text} href="#" underline="none"
                sx={{
                  display: 'block', color: '#666', fontSize: '0.85rem', mb: 1,
                  '&:hover': { color: '#FFD600' }, transition: 'color 0.2s'
                }}
              >
                {text}
              </Link>
            ))}
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ color: '#FFD600', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
              Hỗ trợ
            </Typography>
            {['Hướng dẫn đặt sân', 'Chính sách hoàn tiền', 'Điều khoản dịch vụ', 'Liên hệ'].map((text) => (
              <Link
                key={text} href="#" underline="none"
                sx={{
                  display: 'block', color: '#666', fontSize: '0.85rem', mb: 1,
                  '&:hover': { color: '#FFD600' }, transition: 'color 0.2s'
                }}
              >
                {text}
              </Link>
            ))}
          </Grid>

          {/* Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ color: '#FFD600', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
              Liên hệ
            </Typography>
            {[
              { icon: <Phone sx={{ fontSize: 16 }} />, text: '1800 599 920' },
              { icon: <Email sx={{ fontSize: 16 }} />, text: 'support@beecourt.vn' },
              { icon: <LocationOn sx={{ fontSize: 16 }} />, text: 'TP. Hồ Chí Minh, Việt Nam' },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#666' }}>
                <Box sx={{ color: '#FFD600' }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ color: '#666' }}>{item.text}</Typography>
              </Box>
            ))}

            {/* Stripe decorative */}
            <Box sx={{
              mt: 3, p: 2, borderRadius: 2,
              background: 'repeating-linear-gradient(45deg, rgba(255,214,0,0.04), rgba(255,214,0,0.04) 8px, transparent 8px, transparent 16px)',
              border: '1px solid rgba(255,214,0,0.1)',
            }}>
              <Typography variant="caption" sx={{ color: '#FFD600', fontWeight: 600 }}>🐝 Giờ mở cửa</Typography>
              <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>06:00 – 22:00 (Tất cả các ngày)</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: '#1a1a1a', my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#444' }}>
            © {new Date().getFullYear()} Bee Court. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['Điều khoản', 'Bảo mật', 'Cookie'].map((t) => (
              <Link key={t} href="#" underline="none"
                sx={{ color: '#444', fontSize: '0.75rem', '&:hover': { color: '#FFD600' }, transition: 'color 0.2s' }}
              >{t}</Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
