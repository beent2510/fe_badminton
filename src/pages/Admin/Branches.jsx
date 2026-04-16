import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import adminService from '../../services/adminService';

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', address: '', phone_number: '' });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const res = await adminService.getBranches();
      setBranches(res.data.items || res.data.data || res.data);
    } catch {
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setFormData({ id: null, name: '', address: '', phone_number: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (branch) => {
    setFormData({ ...branch });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa chi nhánh này?')) return;
    try {
      await adminService.deleteBranch(id);
      dispatch(showNotification({ message: 'Xóa thành công', severity: 'success' }));
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Lỗi xóa', severity: 'error' }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.id) {
        await adminService.updateBranch(formData.id, formData);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await adminService.createBranch(formData);
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
        <Typography variant="h5" fontWeight={700}>Quản lý Chi Nhánh</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Thêm chi nhánh</Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#161616', border: '1px solid #2a2a2a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#FFD600', borderBottom: '1px solid #2a2a2a' } }}>
              <TableCell>ID</TableCell>
              <TableCell>Tên chi nhánh</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map(row => (
              <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid #1e1e1e' } }}>
                <TableCell>{row.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell>{row.address}</TableCell>
                <TableCell>{row.phone_number}</TableCell>
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
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>{formData.id ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth label="Tên chi nhánh" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Địa chỉ" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} margin="dense" multiline rows={2} />
          <TextField fullWidth label="Số điện thoại" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} margin="dense" />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2a2a2a' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
