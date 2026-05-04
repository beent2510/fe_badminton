import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import blockedSlotService from "../../services/blockedSlotService";

export default function AdminBlockedSlots() {
  const [slots, setSlots] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    booking_date: "",
    start_time: "",
    end_time: "",
    reason: "",
    is_active: true,
  });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const res = await blockedSlotService.adminGetAll();
      const data = res.data?.items || res.data?.data || res.data || [];
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      dispatch(
        showNotification({ message: "Lỗi tải dữ liệu", severity: "error" }),
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      id: null,
      booking_date: "",
      start_time: "",
      end_time: "",
      reason: "",
      is_active: true,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      id: item.id,
      booking_date: item.booking_date,
      start_time: item.start_time?.substring(0, 5) || "",
      end_time: item.end_time?.substring(0, 5) || "",
      reason: item.reason || "",
      is_active: Boolean(item.is_active),
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa khung giờ cấm này?")) return;
    try {
      await blockedSlotService.adminDelete(id);
      dispatch(
        showNotification({ message: "Xóa thành công", severity: "success" }),
      );
      fetchData();
    } catch {
      dispatch(showNotification({ message: "Lỗi xóa", severity: "error" }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.booking_date || !formData.start_time || !formData.end_time) {
      return dispatch(
        showNotification({
          message: "Vui lòng nhập đủ ngày và giờ",
          severity: "warning",
        }),
      );
    }
    const payload = {
      booking_date: formData.booking_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      reason: formData.reason,
      is_active: formData.is_active,
    };

    try {
      if (formData.id) {
        await blockedSlotService.adminUpdate(formData.id, payload);
        dispatch(
          showNotification({
            message: "Cập nhật thành công",
            severity: "success",
          }),
        );
      } else {
        await blockedSlotService.adminCreate(payload);
        dispatch(
          showNotification({
            message: "Thêm mới thành công",
            severity: "success",
          }),
        );
      }
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Khung giờ cấm đặt
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{
            bgcolor: "#FFD600",
            color: "#000",
            "&:hover": { bgcolor: "#FFC000" },
          }}
        >
          Thêm khung giờ
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
              <TableCell>Ngày</TableCell>
              <TableCell>Giờ</TableCell>
              <TableCell>Lý do</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slots.length > 0 ? (
              slots.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}
                >
                  <TableCell>{row.booking_date}</TableCell>
                  <TableCell>
                    {row.start_time?.substring(0, 5)} -{" "}
                    {row.end_time?.substring(0, 5)}
                  </TableCell>
                  <TableCell>{row.reason || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.is_active ? "Kích hoạt" : "Tắt"}
                      size="small"
                      sx={{
                        bgcolor: row.is_active
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: row.is_active ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        onClick={() => handleOpenEdit(row)}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Chưa có khung giờ cấm
                </TableCell>
              </TableRow>
            )}
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
          {formData.id ? "Sửa khung giờ cấm" : "Thêm khung giờ cấm"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            type="date"
            label="Ngày"
            value={formData.booking_date}
            onChange={(e) =>
              setFormData({ ...formData, booking_date: e.target.value })
            }
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              type="time"
              label="Bắt đầu"
              value={formData.start_time}
              onChange={(e) =>
                setFormData({ ...formData, start_time: e.target.value })
              }
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="time"
              label="Kết thúc"
              value={formData.end_time}
              onChange={(e) =>
                setFormData({ ...formData, end_time: e.target.value })
              }
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            fullWidth
            label="Lý do"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            margin="dense"
          />
          <TextField
            select
            fullWidth
            label="Trạng thái"
            value={formData.is_active ? 1 : 0}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_active: Boolean(Number(e.target.value)),
              })
            }
            margin="dense"
          >
            <MenuItem value={1}>Kích hoạt</MenuItem>
            <MenuItem value={0}>Tắt</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2a2a2a" }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              bgcolor: "#FFD600",
              color: "#000",
              "&:hover": { bgcolor: "#FFC000" },
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
