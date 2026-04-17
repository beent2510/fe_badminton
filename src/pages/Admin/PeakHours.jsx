import React, { useState, useEffect } from "react";
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
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import adminService from "../../services/adminService";

const DAY_LABELS = [
  "Chủ Nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

export default function AdminPeakHours() {
  const { user } = useSelector((state) => state.auth);
  const isSystemAdmin = user?.role === "admin";
  const [peakHours, setPeakHours] = useState([]);
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState("all");
  const [filterCourtId, setFilterCourtId] = useState("all");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [formData, setFormData] = useState({
    id: null,
    court_id: "",
    day_of_week: [0],
    from_time: "17:00",
    to_time: "21:00",
    price_peak_hour: "",
  });
  const dispatch = useDispatch();

  const fetchPeakHours = async () => {
    try {
      const params = {
        page: page + 1,
        items_per_page: rowsPerPage,
      };
      /** @type {Record<string, string | number>} */
      const requestParams = { ...params };
      if (isSystemAdmin && filterBranchId !== "all")
        requestParams.branch_id = filterBranchId;
      if (filterCourtId !== "all") requestParams.court_id = filterCourtId;
      if (filterDayOfWeek !== "all")
        requestParams.day_of_week = filterDayOfWeek;

      const peakRes = await adminService.getPeakHours(requestParams);
      const items =
        peakRes.data.items || peakRes.data.data || peakRes.data || [];
      setPeakHours(items);
      setTotalRows(
        peakRes.data.paginate?.total ??
          (Array.isArray(items) ? items.length : 0),
      );
    } catch {
      dispatch(
        showNotification({ message: "Lỗi tải dữ liệu", severity: "error" }),
      );
    }
  };

  const fetchBranches = async () => {
    if (!isSystemAdmin) return;
    try {
      const branchesRes = await adminService.getBranches();
      setBranches(
        branchesRes.data.items ||
          branchesRes.data.data ||
          branchesRes.data ||
          [],
      );
    } catch {
      dispatch(
        showNotification({
          message: "Lỗi tải dữ liệu chi nhánh",
          severity: "error",
        }),
      );
    }
  };

  const fetchCourts = async () => {
    try {
      const courtParams =
        isSystemAdmin && filterBranchId !== "all"
          ? { branch_id: filterBranchId }
          : undefined;
      const courtsRes = await adminService.getCourts(courtParams);
      setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
    } catch {
      dispatch(
        showNotification({ message: "Lỗi tải dữ liệu sân", severity: "error" }),
      );
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [isSystemAdmin]);

  useEffect(() => {
    fetchCourts();
  }, [isSystemAdmin, filterBranchId]);

  useEffect(() => {
    fetchPeakHours();
  }, [
    page,
    rowsPerPage,
    filterBranchId,
    filterCourtId,
    filterDayOfWeek,
    isSystemAdmin,
  ]);

  const filteredCourts =
    isSystemAdmin && filterBranchId !== "all"
      ? courts.filter((c) => String(c.branch_id) === String(filterBranchId))
      : courts;

  const handleOpenAdd = () => {
    setFormData({
      id: null,
      court_id: "",
      day_of_week: [1],
      from_time: "17:00",
      to_time: "21:00",
      price_peak_hour: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({ ...item, day_of_week: [Number(item.day_of_week)] });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa giờ cao điểm này?")) return;
    try {
      await adminService.deletePeakHour(id);
      dispatch(
        showNotification({ message: "Xóa thành công", severity: "success" }),
      );
      fetchPeakHours();
    } catch {
      dispatch(showNotification({ message: "Lỗi xóa", severity: "error" }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.id) {
        const rawDays = Array.isArray(formData.day_of_week)
          ? formData.day_of_week
          : [formData.day_of_week];
        const days = [
          ...new Set(
            rawDays.map((d) => Number(d)).filter((d) => Number.isFinite(d)),
          ),
        ];
        const [firstDay, ...remainingDays] = days;

        const payload = {
          ...formData,
          day_of_week: firstDay,
        };
        await adminService.updatePeakHour(formData.id, payload);

        if (remainingDays.length > 0) {
          const { id, ...baseData } = formData;
          await Promise.all(
            remainingDays.map((day) =>
              adminService.createPeakHour({ ...baseData, day_of_week: day }),
            ),
          );
        }

        dispatch(
          showNotification({
            message:
              remainingDays.length > 0
                ? `Cập nhật + thêm ${remainingDays.length} giờ cao điểm thành công`
                : "Cập nhật thành công",
            severity: "success",
          }),
        );
      } else {
        const rawDays = Array.isArray(formData.day_of_week)
          ? formData.day_of_week
          : [formData.day_of_week];
        const days = [
          ...new Set(
            rawDays.map((d) => Number(d)).filter((d) => Number.isFinite(d)),
          ),
        ];
        await Promise.all(
          days.map((day) =>
            adminService.createPeakHour({ ...formData, day_of_week: day }),
          ),
        );
        dispatch(
          showNotification({
            message: `Thêm mới ${days.length} giờ cao điểm thành công`,
            severity: "success",
          }),
        );
      }
      setOpenDialog(false);
      fetchPeakHours();
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
          Giờ Cao Điểm (Peak Hours)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{
            bgcolor: "#FFD600",
            color: "#000",
            "&:hover": { bgcolor: "#FFC000" },
          }}>
          Thêm giờ cao điểm
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: isSystemAdmin ? "1fr 1fr 1fr" : "1fr 1fr",
          },
          gap: 2,
          mb: 2,
        }}>
        {isSystemAdmin && (
          <TextField
            select
            label="Lọc theo chi nhánh"
            value={filterBranchId}
            onChange={(e) => {
              setFilterBranchId(e.target.value);
              setFilterCourtId("all");
              setPage(0);
            }}
            fullWidth>
            <MenuItem value="all">Tất cả chi nhánh</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          label="Lọc theo sân"
          value={filterCourtId}
          onChange={(e) => {
            setFilterCourtId(e.target.value);
            setPage(0);
          }}
          fullWidth>
          <MenuItem value="all">Tất cả sân</MenuItem>
          {filteredCourts.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Lọc theo thứ"
          value={filterDayOfWeek}
          onChange={(e) => {
            setFilterDayOfWeek(e.target.value);
            setPage(0);
          }}
          fullWidth>
          <MenuItem value="all">Tất cả thứ</MenuItem>
          {DAY_LABELS.map((day, idx) => (
            <MenuItem key={idx} value={String(idx)}>
              {day}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ bgcolor: "#161616", border: "1px solid #2a2a2a" }}>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 700,
                  color: "#FFD600",
                  borderBottom: "1px solid #2a2a2a",
                },
              }}>
              <TableCell>Sân</TableCell>
              <TableCell>Thứ</TableCell>
              <TableCell>Từ</TableCell>
              <TableCell>Đến</TableCell>
              <TableCell>Giá giờ vàng</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {peakHours.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  {row.court?.name ||
                    courts.find((c) => c.id === row.court_id)?.name ||
                    row.court_id}
                </TableCell>
                <TableCell>
                  {DAY_LABELS[row.day_of_week] ?? row.day_of_week}
                </TableCell>
                <TableCell>{row.from_time?.substring(0, 5)}</TableCell>
                <TableCell>{row.to_time?.substring(0, 5)}</TableCell>
                <TableCell sx={{ color: "#FFD600", fontWeight: 700 }}>
                  {new Intl.NumberFormat("vi-VN").format(row.price_peak_hour)}
                  đ/h
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Chỉnh sửa">
                    <IconButton
                      onClick={() => handleOpenEdit(row)}
                      sx={{ color: "#60a5fa" }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton
                      onClick={() => handleDelete(row.id)}
                      sx={{ color: "#ef4444" }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {peakHours.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ color: "#9a9a9a", py: 4 }}>
                  Không có dữ liệu phù hợp bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20]}
          labelRowsPerPage="Số dòng/trang"
        />
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "#161616", border: "1px solid #2a2a2a" },
        }}>
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: "1px solid #2a2a2a" }}>
          {formData.id ? "Sửa giờ cao điểm" : "Thêm giờ cao điểm"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            select
            fullWidth
            label="Sân"
            value={formData.court_id}
            onChange={(e) =>
              setFormData({ ...formData, court_id: e.target.value })
            }
            margin="dense"
            required>
            {courts.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <FormControl fullWidth margin="dense">
            <InputLabel id="peak-hour-day-of-week-label">
              Thứ trong tuần (có thể chọn nhiều)
            </InputLabel>
            <Select
              labelId="peak-hour-day-of-week-label"
              multiple
              value={
                Array.isArray(formData.day_of_week)
                  ? formData.day_of_week
                  : [formData.day_of_week]
              }
              label="Thứ trong tuần (có thể chọn nhiều)"
              renderValue={(selected) =>
                selected
                  .map((val) => DAY_LABELS[Number(val)])
                  .filter(Boolean)
                  .join(", ")
              }
              onChange={(e) => {
                const val = e.target.value;
                const arr = (Array.isArray(val) ? val : [val])
                  .map((v) => Number(v))
                  .filter((v) => Number.isFinite(v));
                setFormData({ ...formData, day_of_week: arr });
              }}>
              {DAY_LABELS.map((d, i) => (
                <MenuItem key={i} value={i}>
                  <Checkbox
                    checked={(Array.isArray(formData.day_of_week)
                      ? formData.day_of_week
                      : [formData.day_of_week]
                    )
                      .map((v) => String(v))
                      .includes(String(i))}
                    sx={{
                      color: "#FFD600",
                      "&.Mui-checked": { color: "#FFD600" },
                    }}
                  />
                  <ListItemText primary={d} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Từ giờ"
              type="time"
              value={formData.from_time}
              onChange={(e) =>
                setFormData({ ...formData, from_time: e.target.value })
              }
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Đến giờ"
              type="time"
              value={formData.to_time}
              onChange={(e) =>
                setFormData({ ...formData, to_time: e.target.value })
              }
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            fullWidth
            label="Giá giờ vàng (VND/giờ)"
            type="number"
            value={formData.price_peak_hour}
            onChange={(e) =>
              setFormData({ ...formData, price_peak_hour: e.target.value })
            }
            margin="dense"
            required
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
            }}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
