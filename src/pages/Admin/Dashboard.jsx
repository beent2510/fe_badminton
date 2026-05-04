import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  Storefront,
  SportsTennis,
  BookOnline,
  AttachMoney,
  TrendingUp,
  PeopleAlt,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import bookingService from "../../services/bookingService";
import adminService from "../../services/adminService";

import { useDispatch, useSelector } from "react-redux";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState({
    bookings: 0,
    courts: 0,
    branches: 0,
    revenue: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    promotions: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [managedBranches, setManagedBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, courtsRes, branchesRes, promoRes] =
          await Promise.all([
            bookingService.adminGetAll({ per_page: 999 }),
            adminService.getCourts({ per_page: 999 }),
            adminService.getBranches({ per_page: 999 }),
            isAdmin
              ? adminService.getPromotions({ per_page: 999 })
              : Promise.resolve({ data: [] }),
          ]);

        const bookings =
          bookingsRes.data.items || bookingsRes.data.data || bookingsRes.data;
        const revenue = bookings
          .filter((b) => b.status === "paid")
          .reduce((s, b) => {
            if (b.items && b.items.length > 0) {
              return (
                s +
                b.items.reduce(
                  (sum, item) => sum + Number(item.total_price || 0),
                  0,
                )
              );
            }
            return s + Number(b.final_price || b.total_price || 0);
          }, 0);
        const pending = bookings.filter((b) => b.status === "pending").length;
        const confirmed = bookings.filter(
          (b) => b.status === "confirmed" || b.status === "paid",
        ).length;
        const cancelled = bookings.filter(
          (b) => b.status === "cancelled",
        ).length;

        setStats({
          bookings: bookings.length,
          courts:
            courtsRes.data.total ||
            (courtsRes.data.items || courtsRes.data.data || courtsRes.data)
              .length,
          branches:
            branchesRes.data.total ||
            (
              branchesRes.data.items ||
              branchesRes.data.data ||
              branchesRes.data
            ).length,
          revenue,
          pending,
          confirmed,
          cancelled,
          promotions: (
            promoRes.data.items ||
            promoRes.data.data ||
            promoRes.data ||
            []
          ).length,
        });
        setRecentBookings(bookings.slice(0, 5));

        if (!isAdmin) {
          const branchList =
            branchesRes.data.items ||
            branchesRes.data.data ||
            branchesRes.data ||
            [];
          setManagedBranches(branchList);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Tổng lượt đặt sân",
      value: stats.bookings,
      icon: <BookOnline sx={{ fontSize: 36 }} />,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      title: "Doanh thu (đã đặt)",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(stats.revenue),
      icon: <AttachMoney sx={{ fontSize: 36 }} />,
      color: "#FFD600",
      bg: "rgba(255,214,0,0.1)",
    },
    {
      title: "Tổng số sân",
      value: stats.courts,
      icon: <SportsTennis sx={{ fontSize: 36 }} />,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
    },
    {
      title: "Chi nhánh",
      value: stats.branches,
      icon: <Storefront sx={{ fontSize: 36 }} />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
  ];

  const STATUS_COLORS = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    paid: "#22c55e",
    cancelled: "#ef4444",
  };
  const STATUS_LABELS = {
    pending: "Chờ XN",
    confirmed: "Xác nhận",
    paid: "Đã TT",
    cancelled: "Đã hủy",
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#FFD600" }} />
      </Box>
    );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Dashboard Tổng Quan
        </Typography>
        <Typography sx={{ color: "#9a9a9a" }}>
          Theo dõi hiệu suất kinh doanh hệ thống Bee Court
        </Typography>
      </Box>

      {!isAdmin && managedBranches.length > 0 && (
        <Card
          sx={{
            mb: 4,
            bgcolor: "rgba(255,214,0,0.1)",
            border: "1px solid #FFD600",
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="#FFD600" mb={1}>
              Chi nhánh bạn đang quản lý:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {managedBranches.map((b) => (
                <Box
                  key={b.id}
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: "#161616",
                    borderRadius: 2,
                    border: "1px solid #2a2a2a",
                  }}
                >
                  <Typography fontWeight={600}>{b.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.address}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                bgcolor: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: card.bg,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "#9a9a9a", mb: 0.5 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: "#fff" }}
                  >
                    {card.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Booking status breakdown */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              bgcolor: "#161616",
              border: "1px solid #2a2a2a",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3}>
                Tình trạng đặt sân
              </Typography>

              {[
                {
                  label: "Chờ xác nhận",
                  value: stats.pending,
                  color: "#f59e0b",
                },
                {
                  label: "Đã xác nhận / Đã thanh toán",
                  value: stats.confirmed,
                  color: "#22c55e",
                },
                { label: "Đã hủy", value: stats.cancelled, color: "#ef4444" },
              ].map((item) => (
                <Box key={item.label} mb={2}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={item.color}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      stats.bookings ? (item.value / stats.bookings) * 100 : 0
                    }
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "#2a2a2a",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: item.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}

              {isAdmin && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "rgba(255,214,0,0.05)",
                    borderRadius: 2,
                    border: "1px solid rgba(255,214,0,0.1)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Mã khuyến mãi đang có
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#FFD600">
                    {stats.promotions}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent bookings */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              bgcolor: "#161616",
              border: "1px solid #2a2a2a",
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Đặt sân mới nhất
              </Typography>
              {recentBookings.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Chưa có đặt sân nào
                </Typography>
              ) : (
                recentBookings.map((b) => (
                  <Box
                    key={b.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1.5,
                      borderBottom: "1px solid #1e1e1e",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600} fontSize="0.9rem">
                        {b.court?.name || `Sân #${b.court_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {b.booking_date} • {b.start_time?.substring(0, 5)}-
                        {b.end_time?.substring(0, 5)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          bgcolor: `${STATUS_COLORS[b.status]}20`,
                          color: STATUS_COLORS[b.status],
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          mb: 0.5,
                        }}
                      >
                        {STATUS_LABELS[b.status] || b.status}
                      </Box>
                      <Typography
                        variant="body2"
                        color="#FFD600"
                        fontWeight={700}
                      >
                        {new Intl.NumberFormat("vi-VN").format(
                          b.final_price || b.total_price || 0,
                        )}
                        đ
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
