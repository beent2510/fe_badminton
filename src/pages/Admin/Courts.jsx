import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import courtService from '../../services/courtService';
import branchService from '../../services/branchService';

export default function AdminCourts() {
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, branch_id: '', name: '', description: '', price_per_hour: '', status: 'active', image_url: '' });
  
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const [courtsRes, branchesRes] = await Promise.all([
        courtService.adminGetAll(),
        branchService.adminGetAll()
      ]);
      setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
      setBranches(branchesRes.data.items || branchesRes.data.data || branchesRes.data);
    } catch {
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleOpenEdit = (court) => {
    setFormData({ ...court, branch_id: court.branch_id || '' });
    setOpenDialog(true);
  };

  const handleOpenAdd = () => {
    setFormData({ id: null, branch_id: '', name: '', description: '', price_per_hour: '', status: 'active', image_url: '' });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa sân này?')) return;
    try {
      await courtService.adminDelete(id);
      dispatch(showNotification({ message: 'Xóa thành công', severity: 'success' }));
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Lỗi xóa sân', severity: 'error' }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.id) {
        await courtService.adminUpdate(formData.id, formData);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await courtService.adminCreate(formData);
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
        <Typography variant="h5" fontWeight={700}>Quản lý Sân Cầu Lông</Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd}>Thêm Mới</Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#161616', border: '1px solid #2a2a2a' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tên sân</TableCell>
              <TableCell>Chi nhánh</TableCell>
              <TableCell>Giá/giờ</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courts.map(row => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell fontWeight={600}>{row.name}</TableCell>
                <TableCell>{row.branch?.name || branches.find(b => b.id === row.branch_id)?.name || 'N/A'}</TableCell>
                <TableCell>{new Intl.NumberFormat('vi-VN').format(row.price_per_hour)}</TableCell>
                <TableCell>
                  <Chip label={row.status === 'active' ? 'Hoạt động' : 'Bảo trì'} color={row.status === 'active' ? 'success' : 'warning'} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenEdit(row)} color="info"><Edit fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(row.id)} color="error"><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formData.id ? 'Sửa thông tin sân' : 'Thêm sân mới'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField select fullWidth label="Chi nhánh" value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} margin="dense">
            {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Tên sân" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} margin="dense" />
          <TextField fullWidth label="Giá tiền/giờ" type="number" value={formData.price_per_hour} onChange={e => setFormData({...formData, price_per_hour: e.target.value})} margin="dense" />
          <TextField select fullWidth label="Trạng thái" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} margin="dense">
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="maintenance">Bảo trì</MenuItem>
          </TextField>
          <TextField fullWidth label="URL Hình ảnh" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} margin="dense" />
          <TextField fullWidth label="Mô tả" multiline rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
