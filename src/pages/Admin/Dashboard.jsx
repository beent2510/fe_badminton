import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, IconButton } from '@mui/material';
import { Storefront, SportsTennis, BookOnline, AttachMoney, TrendingUp } from '@mui/icons-material';
import bookingService from '../../services/bookingService';
import courtService from '../../services/courtService';
import branchService from '../../services/branchService';

export default function Dashboard() {
  const [stats, setStats] = useState({
    bookings: 0,
    courts: 0,
    branches: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, courtsRes, branchesRes] = await Promise.all([
          bookingService.adminGetAll(),
          courtService.adminGetAll(),
          branchService.adminGetAll()
        ]);
        
        const bookings = bookingsRes.data.data || [];
        const revenue = bookings.reduce((sum, b) => sum + Number(b.final_price || 0), 0);
        
        setStats({
          bookings: bookingsRes.data.total || bookings.length,
          courts: courtsRes.data.total || courtsRes.data.data?.length || 0,
          branches: branchesRes.data.total || branchesRes.data.data?.length || 0,
          revenue: revenue
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Tống số lượt đặt', value: stats.bookings, icon: <BookOnline sx={{ fontSize: 40 }} />, color: '#3b82f6' },
    { title: 'Tổng số sân', value: stats.courts, icon: <SportsTennis sx={{ fontSize: 40 }} />, color: '#22c55e' },
    { title: 'Chi nhánh', value: stats.branches, icon: <Storefront sx={{ fontSize: 40 }} />, color: '#f59e0b' },
    { 
      title: 'Doanh thu dự kiến', 
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), 
      icon: <AttachMoney sx={{ fontSize: 40 }} />, 
      color: '#FFD600' 
    },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#FFD600' }}/></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Dashboard Tổng Quan</Typography>
          <Typography sx={{ color: '#9a9a9a' }}>Theo dõi hiệu suất kinh doanh hệ thống Bee Court</Typography>
        </Box>
        <IconButton sx={{ bgcolor: 'rgba(255,214,0,0.1)', color: '#FFD600' }}><TrendingUp /></IconButton>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ height: '100%', bgcolor: '#161616', border: '1px solid #2a2a2a', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, color: card.color, transform: 'scale(2)' }}>
                {card.icon}
              </Box>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="body2" sx={{ color: '#9a9a9a', mb: 1, fontWeight: 600 }}>{card.title}</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: card.color === '#FFD600' ? '#FFD600' : '#fff' }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Chart mock area */}
      <Box sx={{ mt: 4, p: 4, bgcolor: '#161616', border: '1px solid #2a2a2a', borderRadius: 4, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: '#666' }}>[ Biểu đồ doanh thu - Để sau ]</Typography>
      </Box>
    </Box>
  );
}
