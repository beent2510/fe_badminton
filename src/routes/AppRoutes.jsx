import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import PrivateRoute from "../components/PrivateRoute";
import AdminRoute from "../components/AdminRoute";

// User Pages
import Home from "../pages/User/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import CourtDetail from "../pages/User/CourtDetail";
import MyBookings from "../pages/User/MyBookings";
import Profile from "../pages/User/Profile";

// Admin Pages
import Dashboard from "../pages/Admin/Dashboard";
import AdminCourts from "../pages/Admin/Courts";

const AppRoutes = () => (
  <Routes>
    {/* Auth */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Main layout cho user */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/courts" element={<Home />} />

      <Route path="/courts/:id" element={<CourtDetail />} />

      {/* Protected User Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Route>

    {/* Admin routes */}
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="courts" element={<AdminCourts />} />
      <Route path="*" element={<Dashboard />} /> {/* Mock other admin pages to dashboard for now */}
    </Route>
  </Routes>
);

export default AppRoutes;