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
import BranchDetail from "../pages/User/BranchDetail";
import MyBookings from "../pages/User/MyBookings";
import Profile from "../pages/User/Profile";

// Admin Pages
import Dashboard from "../pages/Admin/Dashboard";
import AdminCourts from "../pages/Admin/Courts";
import AdminBranches from "../pages/Admin/Branches";
import AdminSchedules from "../pages/Admin/Schedules";
import AdminPeakHours from "../pages/Admin/PeakHours";
import AdminBookings from "../pages/Admin/Bookings";
import AdminPromotions from "../pages/Admin/Promotions";
import AdminManagers from "../pages/Admin/Managers";

const AppRoutes = () => (
  <Routes>
    {/* Auth */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Main layout cho user */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/courts" element={<Home />} />

      <Route path="/branches/:id" element={<BranchDetail />} />
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
      <Route path="branches" element={<AdminBranches />} />
      <Route path="courts" element={<AdminCourts />} />
      <Route path="schedules" element={<AdminSchedules />} />
      <Route path="peak-hours" element={<AdminPeakHours />} />
      <Route path="bookings" element={<AdminBookings />} />
      <Route path="promotions" element={<AdminPromotions />} />
      <Route path="managers" element={<AdminManagers />} />
      <Route path="*" element={<Dashboard />} />
    </Route>
  </Routes>
);

export default AppRoutes;