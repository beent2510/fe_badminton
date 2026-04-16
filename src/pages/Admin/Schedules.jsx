import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import adminService from '../../services/adminService';

const DAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [courts, setCourts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, court_id: '', day_of_week: 0, start_time: '05:00', end_time: '22:00', slot_duration: 30, is_active: true });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const [schedulesRes, courtsRes] = await Promise.all([
        adminService.getSchedules(),
        adminService.getCourts(),
      ]);
      setSchedules(schedulesRes.data.items || schedulesRes.data.data || schedulesRes.data);
      setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
    } catch {
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setFormData({ id: null, court_id: '', day_of_week: 1, start_time: '05:00', end_time: '22:00', slot_duration: 30, is_active: true });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch này?')) return;
    try {
      await adminService.deleteSchedule(id);
      dispatch(showNotification({ message: 'Xóa thành công', severity: 'success' }));
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Lỗi xóa', severity: 'error' }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.id) {
        await adminService.updateSchedule(formData.id, formData);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await adminService.createSchedule(formData);
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
        <Typography variant="h5" fontWeight={700}>Lịch Hoạt Động Sân</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Thêm lịch</Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#161616', border: '1px solid #2a2a2a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#FFD600', borderBottom: '1px solid #2a2a2a' } }}>
              <TableCell>Sân</TableCell>
              <TableCell>Thứ</TableCell>
              <TableCell>Giờ mở cửa</TableCell>
              <TableCell>Giờ đóng cửa</TableCell>
              <TableCell>Slot (phút)</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map(row => (
              <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid #1e1e1e' } }}>
                <TableCell sx={{ fontWeight: 600 }}>{row.court?.name || courts.find(c => c.id === row.court_id)?.name || row.court_id}</TableCell>
                <TableCell>{DAY_LABELS[row.day_of_week] ?? row.day_of_week}</TableCell>
                <TableCell>{row.start_time?.substring(0, 5)}</TableCell>
                <TableCell>{row.end_time?.substring(0, 5)}</TableCell>
                <TableCell>{row.slot_duration}</TableCell>
                <TableCell>
                  <Chip label={row.is_active ? 'Hoạt động' : 'Tắt'} size="small"
                    sx={{ bgcolor: row.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: row.is_active ? '#22c55e' : '#ef4444', fontWeight: 600 }} />
                </TableCell>
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
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>{formData.id ? 'Sửa lịch sân' : 'Thêm lịch sân'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField select fullWidth label="Sân" value={formData.court_id} onChange={e => setFormData({ ...formData, court_id: e.target.value })} margin="dense" required>
            {courts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Thứ trong tuần" value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: Number(e.target.value) })} margin="dense">
            {DAY_LABELS.map((d, i) => <MenuItem key={i} value={i}>{d}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Giờ mở cửa" type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Giờ đóng cửa" type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField fullWidth label="Thời lượng mỗi slot (phút)" type="number" value={formData.slot_duration} onChange={e => setFormData({ ...formData, slot_duration: Number(e.target.value) })} margin="dense" />
          <TextField select fullWidth label="Trạng thái" value={formData.is_active ? 1 : 0} onChange={e => setFormData({ ...formData, is_active: Boolean(Number(e.target.value)) })} margin="dense">
            <MenuItem value={1}>Hoạt động</MenuItem>
            <MenuItem value={0}>Tắt</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2a2a2a' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
