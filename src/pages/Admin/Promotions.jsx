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

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null, code: '', type: 'percentage', discount_value: '',
    start_date: '', end_date: '', max_usage: '', is_active: true, description: ''
  });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const res = await adminService.getPromotions();
      setPromotions(res.data.items || res.data.data || res.data);
    } catch {
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setFormData({ id: null, code: '', type: 'percentage', discount_value: '', start_date: '', end_date: '', max_usage: '', is_active: true, description: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      ...item,
      type: item.discount_type || 'percentage',
      discount_value: item.discount_value || '',
      max_usage: item.max_usage || '',
      start_date: item.start_date?.substring(0, 10) || '',
      end_date: item.end_date?.substring(0, 10) || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mã khuyến mãi này?')) return;
    try {
      await adminService.deletePromotion(id);
      dispatch(showNotification({ message: 'Xóa thành công', severity: 'success' }));
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Lỗi xóa', severity: 'error' }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.discount_value || !formData.start_date || !formData.end_date) {
      return dispatch(showNotification({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc', severity: 'warning' }));
    }
    try {
      const payload = {
        code: formData.code,
        discount_type: formData.type,
        discount_value: Number(formData.discount_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_usage: formData.max_usage ? Number(formData.max_usage) : null,
        is_active: formData.is_active,
        description: formData.description || '',
      };

      if (formData.id) {
        await adminService.updatePromotion(formData.id, payload);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await adminService.createPromotion(payload);
        dispatch(showNotification({ message: 'Thêm mới thành công', severity: 'success' }));
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      dispatch(showNotification({ message: msg, severity: 'error' }));
    }
  };

  const displayValue = (row) => {
    const type = row.discount_type;
    const val = row.discount_value;
    if (type === 'percentage') return `${val}%`;
    return `${new Intl.NumberFormat('vi-VN').format(val)}đ`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Quản lý Khuyến Mãi</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Thêm mã</Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#161616', border: '1px solid #2a2a2a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#FFD600', borderBottom: '1px solid #2a2a2a' } }}>
              <TableCell>Mã</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Giá trị</TableCell>
              <TableCell>Đã dùng / Tối đa</TableCell>
              <TableCell>Hiệu lực</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map(row => (
              <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid #1e1e1e' } }}>
                <TableCell><Chip label={row.code} size="small" sx={{ bgcolor: 'rgba(255,214,0,0.15)', color: '#FFD600', fontWeight: 700 }} /></TableCell>
                <TableCell>{row.discount_type === 'percentage' ? 'Phần trăm' : 'Cố định'}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#22c55e' }}>{displayValue(row)}</TableCell>
                <TableCell>{row.usage_count ?? 0} / {row.max_usage ?? '∞'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: '#9a9a9a' }}>{row.start_date?.substring(0, 10)} → {row.end_date?.substring(0, 10)}</TableCell>
                <TableCell>
                  <Chip label={row.is_active ? 'Kích hoạt' : 'Tắt'} size="small"
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
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>{formData.id ? 'Sửa mã khuyến mãi' : 'Thêm mã khuyến mãi'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth label="Mã code *" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} margin="dense" />
          <TextField select fullWidth label="Loại giảm giá" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} margin="dense">
            <MenuItem value="percentage">Phần trăm (%)</MenuItem>
            <MenuItem value="fixed">Cố định (VND)</MenuItem>
          </TextField>
          <TextField fullWidth label={formData.type === 'percentage' ? 'Giá trị (%) *' : 'Giá trị (VND) *'} type="number" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} margin="dense" />
          <TextField fullWidth label="Mô tả" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} margin="dense" />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Ngày bắt đầu *" type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Ngày kết thúc *" type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField fullWidth label="Giới hạn sử dụng (để trống = không giới hạn)" type="number" value={formData.max_usage} onChange={e => setFormData({ ...formData, max_usage: e.target.value })} margin="dense" />
          <TextField select fullWidth label="Trạng thái" value={formData.is_active ? 1 : 0} onChange={e => setFormData({ ...formData, is_active: Boolean(Number(e.target.value)) })} margin="dense">
            <MenuItem value={1}>Kích hoạt</MenuItem>
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
