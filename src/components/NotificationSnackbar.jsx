import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { hideNotification } from '../store/notificationSlice';

const NotificationSnackbar = () => {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state) => state.notification);

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={() => dispatch(hideNotification())}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => dispatch(hideNotification())}
        severity={severity}
        variant="filled"
        sx={{
          borderRadius: 2,
          fontWeight: 600,
          '&.MuiAlert-filledSuccess': { background: 'linear-gradient(135deg,#22c55e,#16a34a)' },
          '&.MuiAlert-filledError': { background: 'linear-gradient(135deg,#ef4444,#dc2626)' },
          '&.MuiAlert-filledWarning': { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' },
          '&.MuiAlert-filledInfo': { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;