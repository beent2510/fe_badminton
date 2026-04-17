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

export default function AdminManagers() {
  const [managers, setManagers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null, name: '', email: '', password: '', is_active: true
  });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const res = await adminService.getManagers();
      const data = res.data?.items || res.data?.data || res.data || [];
      setManagers(Array.isArray(data) ? data : []);
    } catch {
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setFormData({ id: null, name: '', email: '', password: '', is_active: true });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name,
      email: item.email,
      password: '', // do not show password
      is_active: item.is_active
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tài khoản này?')) return;
    try {
      await adminService.deleteManager(id);
      dispatch(showNotification({ message: 'Xóa thành công', severity: 'success' }));
      fetchData();
    } catch (err) {
      dispatch(showNotification({ message: err.response?.data?.error || 'Lỗi xóa', severity: 'error' }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || (!formData.id && !formData.password)) {
      return dispatch(showNotification({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc', severity: 'warning' }));
    }
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        is_active: formData.is_active,
      };
      if (formData.password) payload.password = formData.password;

      if (formData.id) {
        await adminService.updateManager(formData.id, payload);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await adminService.createManager(payload);
        dispatch(showNotification({ message: 'Thêm mới thành công', severity: 'success' }));
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      dispatch(showNotification({ message: msg, severity: 'error' }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Quản lý Nhân sự (Admin Chi nhánh)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Thêm tài khoản</Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#161616', border: '1px solid #2a2a2a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#FFD600', borderBottom: '1px solid #2a2a2a' } }}>
              <TableCell>STT</TableCell>
              <TableCell>Họ tên</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {managers.length > 0 ? managers.map((row, index) => (
              <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid #1e1e1e' } }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <Chip label={row.is_active ? 'Hoạt động' : 'Đã khóa'} size="small"
                    sx={{ bgcolor: row.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: row.is_active ? '#22c55e' : '#ef4444', fontWeight: 600 }} />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Chỉnh sửa"><IconButton onClick={() => handleOpenEdit(row)} sx={{ color: '#60a5fa' }}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Xóa"><IconButton onClick={() => handleDelete(row.id)} sx={{ color: '#ef4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            )) : (
               <TableRow><TableCell colSpan={5} align="center">Chưa có tài khoản nào</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#161616', border: '1px solid #2a2a2a' } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>{formData.id ? 'Sửa thông tin quản lý' : 'Thêm quản lý mới'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth label="Họ tên *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} margin="dense" />
          <TextField fullWidth label="Email *" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} margin="dense" />
          <TextField fullWidth label={formData.id ? "Mật khẩu (để trống nếu không đổi)" : "Mật khẩu *"} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} margin="dense" />
          
          <TextField select fullWidth label="Trạng thái" value={formData.is_active ? 1 : 0} onChange={e => setFormData({ ...formData, is_active: Boolean(Number(e.target.value)) })} margin="dense" sx={{ mt: 2 }}>
            <MenuItem value={1}>Hoạt động</MenuItem>
            <MenuItem value={0}>Khóa</MenuItem>
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
