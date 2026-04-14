import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, Typography } from '@mui/material';

export default function LoginRegisterDialog({ open, onClose }) {
  const [tab, setTab] = useState(0);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [register, setRegister] = useState({ email: '', password: '', name: '', captcha: '' });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>ĐĂNG KÝ TÀI KHOẢN</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Đăng nhập" />
        <Tab label="Đăng ký" />
      </Tabs>
      <DialogContent>
        {tab === 0 ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="SĐT/email" value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} fullWidth size="small" />
            <TextField label="Mật khẩu" type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} fullWidth size="small" />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="SĐT/email" value={register.email} onChange={e => setRegister({ ...register, email: e.target.value })} fullWidth size="small" />
            <TextField label="Mật khẩu" type="password" value={register.password} onChange={e => setRegister({ ...register, password: e.target.value })} fullWidth size="small" />
            <TextField label="Họ và tên" value={register.name} onChange={e => setRegister({ ...register, name: e.target.value })} fullWidth size="small" />
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ bgcolor: '#eee', p: 1, borderRadius: 1, fontWeight: 700 }}>74</Box>
              <TextField label="Mã xác nhận" value={register.captcha} onChange={e => setRegister({ ...register, captcha: e.target.value })} size="small" />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, alignItems: 'stretch', px: 3, pb: 2 }}>
        <Button variant="contained" color="primary" fullWidth>{tab === 0 ? 'Đăng nhập' : 'Tạo tài khoản'}</Button>
        <Typography variant="body2" align="center">
          {tab === 0 ? 'Bạn chưa có tài khoản? ' : 'Bạn đã có tài khoản? '}
          <Button color="primary" size="small" onClick={() => setTab(tab === 0 ? 1 : 0)} sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
            {tab === 0 ? 'Đăng ký' : 'Đăng nhập'}
          </Button>
        </Typography>
      </DialogActions>
    </Dialog>
  );
}
