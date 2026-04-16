import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import adminService from '../../services/adminService';

const DAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function AdminPeakHours() {
  const [peakHours, setPeakHours] = useState([]);
  const [courts, setCourts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, court_id: '', day_of_week: 1, from_time: '17:00', to_time: '21:00', price_peak_hour: '' });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const [peakRes, courtsRes] = await Promise.all([
        adminService.getPeakHours(),
        adminService.getCourts(),
      ]);
      setPeakHours(peakRes.data.items || peakRes.data.data || peakRes.data);
      setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
    } catch {
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setFormData({ id: null, court_id: '', day_of_week: 1, from_time: '17:00', to_time: '21:00', price_peak_hour: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa giờ cao điểm này?')) return;
    try {
      await adminService.deletePeakHour(id);
      dispatch(showNotification({ message: 'Xóa thành công', severity: 'success' }));
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Lỗi xóa', severity: 'error' }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.id) {
        await adminService.updatePeakHour(formData.id, formData);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await adminService.createPeakHour(formData);
        dispatch(showNotification({ message: 'Thêm mới thành công', severity: 'success' }));
      }
      setOpenDialog(false);
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Có lỗi xảy ra', severity: 'error' }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Giờ Cao Điểm (Peak Hours)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Thêm giờ cao điểm</Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#161616', border: '1px solid #2a2a2a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#FFD600', borderBottom: '1px solid #2a2a2a' } }}>
              <TableCell>Sân</TableCell>
              <TableCell>Thứ</TableCell>
              <TableCell>Từ</TableCell>
              <TableCell>Đến</TableCell>
              <TableCell>Giá giờ vàng</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {peakHours.map(row => (
              <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid #1e1e1e' } }}>
                <TableCell sx={{ fontWeight: 600 }}>{row.court?.name || courts.find(c => c.id === row.court_id)?.name || row.court_id}</TableCell>
                <TableCell>{DAY_LABELS[row.day_of_week] ?? row.day_of_week}</TableCell>
                <TableCell>{row.from_time?.substring(0, 5)}</TableCell>
                <TableCell>{row.to_time?.substring(0, 5)}</TableCell>
                <TableCell sx={{ color: '#FFD600', fontWeight: 700 }}>{new Intl.NumberFormat('vi-VN').format(row.price_peak_hour)}đ/h</TableCell>
                <TableCell align="center">
                  <Tooltip title="Chỉnh sửa"><IconButton onClick={() => handleOpenEdit(row)} sx={{ color: '#60a5fa' }}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Xóa"><IconButton onClick={() => handleDelete(row.id)} sx={{ color: '#ef4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#161616', border: '1px solid #2a2a2a' } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>{formData.id ? 'Sửa giờ cao điểm' : 'Thêm giờ cao điểm'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField select fullWidth label="Sân" value={formData.court_id} onChange={e => setFormData({ ...formData, court_id: e.target.value })} margin="dense" required>
            {courts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Thứ trong tuần" value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: Number(e.target.value) })} margin="dense">
            {DAY_LABELS.map((d, i) => <MenuItem key={i} value={i}>{d}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Từ giờ" type="time" value={formData.from_time} onChange={e => setFormData({ ...formData, from_time: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Đến giờ" type="time" value={formData.to_time} onChange={e => setFormData({ ...formData, to_time: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField fullWidth label="Giá giờ vàng (VND/giờ)" type="number" value={formData.price_peak_hour} onChange={e => setFormData({ ...formData, price_peak_hour: e.target.value })} margin="dense" required />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2a2a2a' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
