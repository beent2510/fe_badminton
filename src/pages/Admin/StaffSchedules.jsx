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
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import adminService from "../../services/adminService";

export default function StaffSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    staff_user_id: "",
    branch_id: "",
    work_date: "",
    start_time: "",
    end_time: "",
    note: "",
  });
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const [scheduleRes, staffRes, branchRes] = await Promise.all([
        adminService.getStaffSchedules(),
        adminService.getStaff({ per_page: 999 }),
        adminService.getBranches({ per_page: 999 }),
      ]);
      const scheduleData =
        scheduleRes.data?.items ||
        scheduleRes.data?.data ||
        scheduleRes.data ||
        [];
      const staffData =
        staffRes.data?.items || staffRes.data?.data || staffRes.data || [];
      const branchData =
        branchRes.data?.items || branchRes.data?.data || branchRes.data || [];
      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
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
      staff_user_id: "",
      branch_id: "",
      work_date: "",
      start_time: "",
      end_time: "",
      note: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      id: item.id,
      staff_user_id: item.staff_user_id,
      branch_id: item.branch_id,
      work_date: item.work_date,
      start_time: item.start_time?.substring(0, 5) || "",
      end_time: item.end_time?.substring(0, 5) || "",
      note: item.note || "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lịch làm việc này?")) return;
    try {
      await adminService.deleteStaffSchedule(id);
      dispatch(
        showNotification({ message: "Xóa thành công", severity: "success" }),
      );
      fetchData();
    } catch {
      dispatch(showNotification({ message: "Lỗi xóa", severity: "error" }));
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.staff_user_id ||
      !formData.branch_id ||
      !formData.work_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
      return dispatch(
        showNotification({
          message: "Vui lòng điền đủ thông tin",
          severity: "warning",
        }),
      );
    }
    const payload = {
      staff_user_id: formData.staff_user_id,
      branch_id: formData.branch_id,
      work_date: formData.work_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      note: formData.note,
    };

    try {
      if (formData.id) {
        await adminService.updateStaffSchedule(formData.id, payload);
        dispatch(
          showNotification({
            message: "Cập nhật thành công",
            severity: "success",
          }),
        );
      } else {
        await adminService.createStaffSchedule(payload);
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
          Lịch làm việc nhân viên
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
          Thêm lịch
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
              <TableCell>Nhân viên</TableCell>
              <TableCell>Chi nhánh</TableCell>
              <TableCell>Ngày</TableCell>
              <TableCell>Giờ</TableCell>
              <TableCell>Ghi chú</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.length > 0 ? (
              schedules.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}
                >
                  <TableCell>{row.staff?.name || row.staff_user_id}</TableCell>
                  <TableCell>{row.branch?.name || row.branch_id}</TableCell>
                  <TableCell>{row.work_date}</TableCell>
                  <TableCell>
                    {row.start_time?.substring(0, 5)} -{" "}
                    {row.end_time?.substring(0, 5)}
                  </TableCell>
                  <TableCell>{row.note || "-"}</TableCell>
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
                <TableCell colSpan={6} align="center">
                  Chưa có lịch
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
          {formData.id ? "Sửa lịch" : "Thêm lịch"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            select
            fullWidth
            label="Nhân viên"
            value={formData.staff_user_id}
            onChange={(e) =>
              setFormData({ ...formData, staff_user_id: e.target.value })
            }
            margin="dense"
          >
            {staffList.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.email})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Chi nhánh"
            value={formData.branch_id}
            onChange={(e) =>
              setFormData({ ...formData, branch_id: e.target.value })
            }
            margin="dense"
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="date"
            label="Ngày"
            value={formData.work_date}
            onChange={(e) =>
              setFormData({ ...formData, work_date: e.target.value })
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
            label="Ghi chú"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            margin="dense"
          />
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
