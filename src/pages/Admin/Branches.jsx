import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, MenuItem, Avatar
} from '@mui/material';
import { Add, Edit, Delete, PhotoCamera, BrokenImage } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/notificationSlice';
import adminService from '../../services/adminService';

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', address: '', phone_number: '', user_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const dispatch = useDispatch();

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000/storage/${path}`;
  };

  const fetchData = async () => {
    try {
      const [resBranches, resManagers] = await Promise.all([
        adminService.getBranches(),
        adminService.getManagers()
      ]);
      const branchData = resBranches.data?.items || resBranches.data?.data || resBranches.data || [];
      const managerData = resManagers.data?.items || resManagers.data?.data || resManagers.data || [];
      setBranches(Array.isArray(branchData) ? branchData : []);
      setManagers(Array.isArray(managerData) ? managerData : []);
    } catch (e) {
      console.error(e);
      dispatch(showNotification({ message: 'Lỗi tải dữ liệu', severity: 'error' }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setFormData({ id: null, name: '', address: '', phone_number: '', user_id: '' });
    setImageFile(null);
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (branch) => {
    setFormData({ ...branch, user_id: branch.user_id || '' });
    setImageFile(null);
    setImagePreview(getImageUrl(branch.image_url));
    setOpenDialog(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
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
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== 'id' && v !== null && v !== undefined && v !== '') fd.append(k, v);
      });
      if (imageFile) fd.append('image_url', imageFile);

      if (formData.id) {
        await adminService.updateBranch(formData.id, fd);
        dispatch(showNotification({ message: 'Cập nhật thành công', severity: 'success' }));
      } else {
        await adminService.createBranch(fd);
        dispatch(showNotification({ message: 'Thêm mới thành công', severity: 'success' }));
      }
      setOpenDialog(false);
      fetchData();
    } catch {
      dispatch(showNotification({ message: 'Có lỗi xảy ra', severity: 'error' }));
    }
  };

  if (renderError) {
    return <Box p={5} color="red">Giao diện bị lỗi: {renderError}</Box>;
  }

  try {
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
              <TableCell>Ảnh</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Tên chi nhánh</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Quản lý bơi</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map(row => {
              if (!row) return null;
              const manager = managers.find(m => m && m.id === row.user_id);
              return (
              <TableRow key={row.id || Math.random()} sx={{ '& td': { borderBottom: '1px solid #1e1e1e' } }}>
                <TableCell>
                  <Avatar
                    src={getImageUrl(row.image_url)}
                    variant="rounded"
                    sx={{ width: 60, height: 60, bgcolor: '#2a2a2a', borderRadius: 2 }}
                    imgProps={{ onError: (e) => { e.target.style.display='none'; } }}
                  >
                    {!row.image_url ? row.name?.[0]?.toUpperCase() : <BrokenImage sx={{ color: '#555' }} />}
                  </Avatar>
                </TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell>{row.address}</TableCell>
                <TableCell>{row.phone_number}</TableCell>
                <TableCell>{manager ? manager.name : 'Chưa phân công'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Chỉnh sửa"><IconButton onClick={() => handleOpenEdit(row)} sx={{ color: '#60a5fa' }}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Xóa"><IconButton onClick={() => handleDelete(row.id)} sx={{ color: '#ef4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#161616', border: '1px solid #2a2a2a' } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #2a2a2a' }}>{formData.id ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Image Preview & Upload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2, bgcolor: '#111', borderRadius: 2, border: '1px dashed #333' }}>
            <Box
              sx={{ width: 100, height: 100, borderRadius: 2, bgcolor: '#2a2a2a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <PhotoCamera sx={{ fontSize: 36, color: '#555' }} />
              )}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>Ảnh đại diện</Typography>
              <Button variant="outlined" component="label" size="small" sx={{ borderColor: '#FFD600', color: '#FFD600', '&:hover': { borderColor: '#FFC000', bgcolor: 'rgba(255,214,0,0.05)' } }}>
                {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </Button>
              {imageFile && <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#22c55e' }}>✓ {imageFile.name}</Typography>}
            </Box>
          </Box>
          <TextField fullWidth label="Tên chi nhánh" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Địa chỉ" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} margin="dense" multiline rows={2} />
          <TextField fullWidth label="Số điện thoại" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} margin="dense" />
          <TextField select fullWidth label="Quản lý chi nhánh" value={formData.user_id !== null ? formData.user_id : ''} onChange={e => setFormData({ ...formData, user_id: e.target.value })} margin="dense" sx={{ mt: 2 }}>
            <MenuItem value=""><em>-- Không phân công --</em></MenuItem>
            {Array.isArray(managers) && managers.map(m => {
              if (!m) return null;
              return <MenuItem key={m.id || Math.random()} value={m.id || ''}>{m.name} ({m.email})</MenuItem>
            })}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2a2a2a' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#FFD600', color: '#000', '&:hover': { bgcolor: '#FFC000' } }}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
    );
  } catch (err) {
    if (!renderError) setRenderError(err.message);
    return null;
  }
}
