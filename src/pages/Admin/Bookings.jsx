import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Visibility } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import adminService from "../../services/adminService";

const STATUS_OPTS = ["pending", "confirmed", "paid", "cancelled"];
const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  paid: "#22c55e",
  cancelled: "#ef4444",
};
const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [filterCourtId, setFilterCourtId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [selected, setSelected] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [status, setStatus] = useState("");
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isBranchAdmin = user?.role === "branch_admin";

  const getPrimaryDate = (booking) =>
    booking?.items?.[0]?.booking_date || booking.booking_date;
  const getTimeLabel = (booking) => {
    const items =
      booking?.items || booking?.booking_items || booking?.bookingItems || [];
    if (items.length > 1) {
      return `Nhiều khung giờ (${items.length})`;
    }
    const item = items[0];
    const start = item?.start_time || booking.start_time;
    const end = item?.end_time || booking.end_time;
    if (!start || !end) return "-";
    return `${start.substring(0, 5)} - ${end.substring(0, 5)}`;
  };

  const getCourtCount = (booking) => {
    const items =
      booking?.items || booking?.booking_items || booking?.bookingItems || [];
    if (!items.length) return 0;
    return new Set(items.map((item) => item.court_id)).size;
  };

  const getDateTimeLabels = (booking) => {
    if (booking?.items && booking.items.length > 0) {
      return booking.items.map((item) => {
        const date = item.booking_date || booking.booking_date || "-";
        const start = item.start_time?.substring(0, 5);
        const end = item.end_time?.substring(0, 5);
        return start && end ? `${date} ${start} - ${end}` : date;
      });
    }
    const date = booking.booking_date || "-";
    const start = booking.start_time?.substring(0, 5);
    const end = booking.end_time?.substring(0, 5);
    return start && end ? [`${date} ${start} - ${end}`] : [date];
  };

  const fetchData = async (filters = {}) => {
    try {
      const res = await adminService.getBookings(filters);
      setBookings(res.data.items || res.data.data || res.data);
    } catch {
      dispatch(
        showNotification({ message: "Lỗi tải dữ liệu", severity: "error" }),
      );
    }
  };

  const fetchCourts = async () => {
    try {
      const res = await adminService.getCourts({ per_page: 999 });
      const data = res.data?.items || res.data?.data || res.data || [];
      setCourts(Array.isArray(data) ? data : []);
    } catch {
      setCourts([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCourts();
  }, []);

  const handleApplyFilters = () => {
    fetchData({
      court_id: filterCourtId || undefined,
      booking_date: filterDate || undefined,
      start_time: filterStartTime || undefined,
      end_time: filterEndTime || undefined,
    });
  };

  const handleOpen = (booking) => {
    setSelected(booking);
    setStatus(booking.status);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa booking này?")) return;
    try {
      await adminService.deleteBooking(id);
      dispatch(
        showNotification({ message: "Xóa thành công", severity: "success" }),
      );
      fetchData();
    } catch {
      dispatch(showNotification({ message: "Lỗi xóa", severity: "error" }));
    }
  };

  const handleUpdate = async () => {
    try {
      await adminService.updateBooking(selected.id, { status });
      dispatch(
        showNotification({
          message: "Cập nhật trạng thái thành công",
          severity: "success",
        }),
      );
      setOpenDialog(false);
      fetchData();
    } catch {
      dispatch(
        showNotification({ message: "Có lỗi xảy ra", severity: "error" }),
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Quản lý Đặt Sân
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          select
          label="Lọc sân"
          value={filterCourtId}
          onChange={(e) => setFilterCourtId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {courts.map((court) => (
            <MenuItem key={court.id} value={court.id}>
              {court.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          label="Ngày chơi"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="time"
          label="Từ giờ"
          value={filterStartTime}
          onChange={(e) => setFilterStartTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="time"
          label="Đến giờ"
          value={filterEndTime}
          onChange={(e) => setFilterEndTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          sx={{
            bgcolor: "#FFD600",
            color: "#000",
            "&:hover": { bgcolor: "#FFC000" },
          }}
        >
          Lọc
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ bgcolor: "#161616", border: "1px solid #2a2a2a" }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 700,
                  color: "#FFD600",
                  borderBottom: "1px solid #2a2a2a",
                },
              }}
            >
              <TableCell>ID</TableCell>
              <TableCell>Người đặt</TableCell>
              <TableCell>Sân</TableCell>
              <TableCell>Ngày chơi</TableCell>
              <TableCell>Giờ</TableCell>
              {isBranchAdmin && <TableCell>Ngày giờ đặt</TableCell>}
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}
              >
                <TableCell>#{row.id}</TableCell>
                <TableCell>
                  {row.customer_name || row.user?.name || row.user_id}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {getCourtCount(row) > 1
                    ? `Nhiều sân (${getCourtCount(row)})`
                    : row.court?.name || row.court_id}
                </TableCell>
                <TableCell>{getPrimaryDate(row)}</TableCell>
                <TableCell>{getTimeLabel(row)}</TableCell>
                {isBranchAdmin && (
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {getDateTimeLabels(row).map((label, idx) => (
                        <Typography key={`${row.id}-dt-${idx}`} variant="body2">
                          {label}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                )}
                <TableCell sx={{ color: "#FFD600", fontWeight: 600 }}>
                  {new Intl.NumberFormat("vi-VN").format(
                    row.final_price || row.total_price,
                  )}
                  đ
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[row.status] || row.status}
                    size="small"
                    sx={{
                      bgcolor: `${STATUS_COLORS[row.status] || "#666"}25`,
                      color: STATUS_COLORS[row.status] || "#fff",
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Xem / Sửa trạng thái">
                    <IconButton
                      onClick={() => handleOpen(row)}
                      sx={{ color: "#60a5fa" }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton
                      onClick={() => handleDelete(row.id)}
                      sx={{ color: "#ef4444" }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: "#161616", border: "1px solid #2a2a2a" } }}
      >
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: "1px solid #2a2a2a" }}
        >
          Chi tiết đặt sân #{selected?.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selected && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}
            >
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Người đặt
                  </Typography>
                  <Typography fontWeight={600}>
                    {selected.user?.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sân
                  </Typography>
                  <Typography fontWeight={600}>
                    {selected.court?.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Chi nhánh
                  </Typography>
                  <Typography>{selected.court?.branch?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Ngày chơi
                  </Typography>
                  <Typography>{getPrimaryDate(selected)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Giờ chơi
                  </Typography>
                  <Typography>{getTimeLabel(selected)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tổng tiền
                  </Typography>
                  <Typography color="#FFD600" fontWeight={700}>
                    {new Intl.NumberFormat("vi-VN").format(
                      selected.final_price || selected.total_price,
                    )}
                    đ
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          <TextField
            select
            fullWidth
            label="Cập nhật trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTS.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2a2a2a" }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            sx={{
              bgcolor: "#FFD600",
              color: "#000",
              "&:hover": { bgcolor: "#FFC000" },
            }}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
