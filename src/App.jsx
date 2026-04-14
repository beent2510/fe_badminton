import React from 'react';
import AppRoutes from './routes/AppRoutes';
import NotificationSnackbar from './components/NotificationSnackbar';
import { CssBaseline } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      <AppRoutes />
      <NotificationSnackbar />
    </>
  );
}

export default App;
