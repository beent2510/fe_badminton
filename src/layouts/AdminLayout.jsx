import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Divider,
  Collapse,
} from "@mui/material";
import {
  Dashboard,
  SportsTennis,
  Storefront,
  CalendarMonth,
  AccessTime,
  CardGiftcard,
  RateReview,
  Payment,
  Menu as MenuIcon,
  ExitToApp,
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  TrendingUp,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const drawerWidth = 260;

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courtsOpen, setCourtsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const isAdmin = user?.role === "admin";
  const isBranchAdmin = user?.role === "branch_admin";

  let menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/admin" },
    ...(isAdmin
      ? [
          {
            text: "Quản lý nhân sự",
            icon: <MenuIcon />,
            path: "/admin/managers",
          },
        ]
      : []),
    ...(isBranchAdmin
      ? [{ text: "Nhân viên", icon: <MenuIcon />, path: "/admin/staff" }]
      : []),
    ...(isBranchAdmin
      ? [
          {
            text: "Lịch nhân sự",
            icon: <MenuIcon />,
            path: "/admin/staff-schedules",
          },
        ]
      : []),
    ...(isAdmin
      ? [{ text: "Chi nhánh", icon: <Storefront />, path: "/admin/branches" }]
      : []),
    {
      text: "Quản lý Sân",
      icon: <SportsTennis />,
      path: "/admin/courts",
      subItems: [
        { text: "Danh sách Sân", path: "/admin/courts" },
        { text: "Lịch hoạt động", path: "/admin/schedules" },
        { text: "Giờ cao điểm", path: "/admin/peak-hours" },
      ],
    },
    { text: "Đặt sân", icon: <CalendarMonth />, path: "/admin/bookings" },
    {
      text: "Khung giờ cấm",
      icon: <AccessTime />,
      path: "/admin/blocked-slots",
    },
    { text: "Thống kê", icon: <TrendingUp />, path: "/admin/reports" },
    ...(isAdmin
      ? [
          {
            text: "Khuyến mãi",
            icon: <CardGiftcard />,
            path: "/admin/promotions",
          },
        ]
      : []),
    { text: "Đánh giá", icon: <RateReview />, path: "/admin/reviews" },
    { text: "Thanh toán", icon: <Payment />, path: "/admin/payments" },
  ];

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#0f0f0f",
      }}
    >
      <Toolbar sx={{ justifyContent: "center", py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h5">🐝</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFD600" }}>
            ADMIN
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#1e1e1e" }} />
      <List sx={{ px: 2, pt: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.subItems ? (
              <>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => setCourtsOpen(!courtsOpen)}
                    sx={{
                      borderRadius: 2,
                      "&:hover": { bgcolor: "rgba(255,214,0,0.08)" },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#FFD600", minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                    {courtsOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={courtsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 3 }}>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.path}
                        onClick={() => navigate(subItem.path)}
                        selected={location.pathname === subItem.path}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          py: 0.5,
                          "&.Mui-selected": {
                            bgcolor: "rgba(255,214,0,0.15)",
                            color: "#FFD600",
                          },
                          "&:hover": { bgcolor: "rgba(255,214,0,0.08)" },
                        }}
                      >
                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{ fontSize: "0.9rem" }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "rgba(255,214,0,0.15)",
                      color: "#FFD600",
                    },
                    "&:hover": { bgcolor: "rgba(255,214,0,0.08)" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color:
                        location.pathname === item.path ? "#FFD600" : "#9a9a9a",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ borderColor: "#1e1e1e" }} />
      <List sx={{ px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate("/")}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#9a9a9a" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Về trang chủ" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: 2, color: "#ef4444" }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#ef4444" }}>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#0a0a0a" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #1e1e1e",
          boxShadow: "none",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2">{user?.name}</Typography>
            <Avatar
              sx={{ bgcolor: "#FFD600", color: "#000", width: 32, height: 32 }}
            >
              {user?.name?.[0]}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid #1e1e1e",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: "64px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
