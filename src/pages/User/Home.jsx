import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Grid, Card, CardContent, CardMedia, Chip, TextField, MenuItem, Container, CircularProgress } from '@mui/material';
import { LocationOn, Star, AccessTime, SportsTennis, FilterList, Search } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import courtService from '../../services/courtService';
import branchService from '../../services/branchService';

export default function Home() {
  const navigate = useNavigate();
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    keyword: '',
    branch_id: 'all',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiFilters = { ...filters };
      if (apiFilters.branch_id === 'all') {
        apiFilters.branch_id = '';
      }
      const [courtsRes, branchesRes] = await Promise.all([
        courtService.getAll({ ...apiFilters, per_page: 8 }),
        branchService.getAll({ ...apiFilters, per_page: 8 })
      ]);
      setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
      setBranches(branchesRes.data.items || branchesRes.data.data || branchesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => fetchData();

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      branch_id: 'all',
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: ''
    });
    setTimeout(fetchData, 0);
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{
        position: 'relative', bgcolor: '#0a0a0a', pt: 10, pb: 12, px: 2,
        overflow: 'hidden', textAlign: 'center',
        borderBottom: '1px solid #1e1e1e'
      }}>
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, bgcolor: 'rgba(255,214,0,0.05)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, bgcolor: 'rgba(255,214,0,0.03)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <Box sx={{ display: 'inline-block', p: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,214,0,0.3)', bgcolor: 'rgba(255,214,0,0.1)', color: '#FFD600', mb: 3, fontWeight: 600, fontSize: '0.85rem' }} className="fade-in-up">
          🌟 NỀN TẢNG ĐẶT SÂN HÀNG ĐẦU
        </Box>

        <Typography variant="h1" className="fade-in-up" sx={{ animationDelay: '0.1s', mb: 2, mx: 'auto', maxWidth: 800 }}>
          Trải nghiệm cầu lông <br />
          <span style={{
            background: 'linear-gradient(135deg, #FFD600, #FFC000)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>đỉnh cao</span> cùng Bee Court
        </Typography>

        <Typography variant="h6" className="fade-in-up" sx={{ animationDelay: '0.2s', color: '#9a9a9a', fontWeight: 400, mb: 6, mx: 'auto', maxWidth: 600 }}>
          Hệ thống đặt sân nhanh chóng, tiện lợi với hàng chục sân đạt chuẩn trải dài khắp các quận.
        </Typography>

        {/* Search Bar */}
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 10 }} className="fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Box sx={{
            p: 3, borderRadius: 4, bgcolor: 'rgba(22,22,22,0.85)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,214,0,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#FFD600' }}>
              <FilterList fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700}>Tìm & Lọc Sân</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth name="keyword" placeholder="Tên sân, quận..." value={filters.keyword} onChange={handleFilterChange}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#111' } }} size="small"
                />
              </Grid>
              <Grid xs={12} md={5}>
                <TextField
                  fullWidth select name="branch_id" label="Chi nhánh" value={filters.branch_id} onChange={handleFilterChange}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#111' } }} size="small"
                >
                  <MenuItem value="all">Tất cả chi nhánh</MenuItem>
                  {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid xs={12} md={3}>
                <TextField
                  fullWidth type="date" name="date" label="Ngày chơi" value={filters.date} onChange={handleFilterChange}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#111' } }} size="small" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth type="time" name="start_time" label="Từ giờ" value={filters.start_time} onChange={handleFilterChange}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#111' } }} size="small" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth type="time" name="end_time" label="Đến giờ" value={filters.end_time} onChange={handleFilterChange}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#111' } }} size="small" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" color="primary" onClick={handleClearFilters} sx={{ flex: 1 }}>
                  XÓA LỌC
                </Button>
                <Button fullWidth variant="contained" color="primary" onClick={handleSearch} sx={{ flex: 2, display: 'flex', gap: 1 }}>
                  <Search fontSize="small" /> TÌM SÂN
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Branches List */}
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3">Danh sách chi nhánh</Typography>
            <Typography sx={{ color: '#9a9a9a' }}>Khám phá các chi nhánh cầu lông nổi bật trên hệ thống</Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#FFD600' }} />
          </Box>
        ) : branches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#111', borderRadius: 4, border: '1px dashed #2a2a2a' }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>🏸</Typography>
            <Typography variant="h6" sx={{ color: '#9a9a9a' }}>Không có chi nhánh nào</Typography>
            <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={handleClearFilters}>Tải lại dữ liệu</Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {branches.map((branch) => (
              <Grid xs={12} sm={6} md={4} key={branch.id}>
                <Card sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s ease', cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-8px)', borderColor: 'rgba(255,214,0,0.5)', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }
                }} onClick={() => navigate(`/branches/${branch.id}`)}>

                  <Box sx={{ position: 'relative', pt: '60%', bgcolor: '#1e1e1e' }}>
                    <CardMedia
                      component="img"
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      image={`http://localhost:8000/public/?name=${encodeURIComponent(branch.name)}&background=1e1e1e&color=FFD600&size=400&font-size=0.3`}
                      alt={branch.name}
                    />
                    <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', px: 1.5, py: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ color: '#FFD600', fontSize: 16 }} />
                      <Typography variant="body2" fontWeight={700} color="#fff">4.9</Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {branch.name}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationOn sx={{ color: '#FFD600', fontSize: 18, mt: '2px' }} />
                        <Typography variant="body2" sx={{ color: '#9a9a9a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {branch.address}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                          Liên hệ: {branch.phone_number}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 'auto', py: 1, fontWeight: 700 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/branches/${branch.id}`);
                      }}
                    >
                      XEM CÁC SÂN
                    </Button>
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
