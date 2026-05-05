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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  PhotoCamera,
  BrokenImage,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import adminService from "../../services/adminService";

const API_BASE = "http://localhost:8000";

export default function AdminCourts() {
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    branch_id: "",
    name: "",
    description: "",
    price_per_hour: "",
    status: "active",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const dispatch = useDispatch();

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE}/storage/${path}`;
  };

  const fetchData = async (branchId = branchFilter) => {
    try {
      const [courtsRes, branchesRes] = await Promise.all([
        adminService.getCourts({ branch_id: branchId || undefined }),
        adminService.getBranches(),
      ]);
      setCourts(courtsRes.data.items || courtsRes.data.data || courtsRes.data);
      setBranches(
        branchesRes.data.items || branchesRes.data.data || branchesRes.data,
      );
    } catch {
      dispatch(
        showNotification({ message: "Lỗi tải dữ liệu", severity: "error" }),
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData(branchFilter);
  }, [branchFilter]);

  const handleOpenAdd = () => {
    setFormData({
      id: null,
      branch_id: "",
      name: "",
      description: "",
      price_per_hour: "",
      status: "active",
    });
    setImageFile(null);
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (court) => {
    setFormData({ ...court, branch_id: court.branch_id || "" });
    setImageFile(null);
    setImagePreview(getImageUrl(court.image_url));
    setOpenDialog(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sân này?")) return;
    try {
      await adminService.deleteCourt(id);
      dispatch(
        showNotification({ message: "Xóa thành công", severity: "success" }),
      );
      fetchData();
    } catch {
      dispatch(showNotification({ message: "Lỗi xóa sân", severity: "error" }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.branch_id || !formData.name || !formData.price_per_hour) {
      return dispatch(
        showNotification({
          message: "Vui lòng điền đầy đủ thông tin bắt buộc",
          severity: "warning",
        }),
      );
    }
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "id" && v !== null && v !== undefined && v !== "")
          fd.append(k, v);
      });
      if (imageFile) fd.append("image_url", imageFile);

      if (formData.id) {
        await adminService.updateCourt(formData.id, fd);
        dispatch(
          showNotification({
            message: "Cập nhật thành công",
            severity: "success",
          }),
        );
      } else {
        await adminService.createCourt(fd);
        dispatch(
          showNotification({
            message: "Thêm mới thành công",
            severity: "success",
          }),
        );
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra";
      dispatch(showNotification({ message: msg, severity: "error" }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Quản lý Sân Cầu Lông
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
          Thêm sân
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TextField
          select
          label="Lọc chi nhánh"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {branches.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.name}
            </MenuItem>
          ))}
        </TextField>
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
              <TableCell>Ảnh</TableCell>
              <TableCell>Tên sân</TableCell>
              <TableCell>Chi nhánh</TableCell>
              <TableCell>Giá/giờ</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courts.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}
              >
                <TableCell>
                  <Avatar
                    src={getImageUrl(row.image_url)}
                    variant="rounded"
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: "#2a2a2a",
                      borderRadius: 2,
                    }}
                    imgProps={{
                      onError: (e) => {
                        e.target.style.display = "none";
                      },
                    }}
                  >
                    {!row.image_url ? (
                      row.name?.[0]?.toUpperCase()
                    ) : (
                      <BrokenImage sx={{ color: "#555" }} />
                    )}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{row.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.description?.substring(0, 40)}
                    {row.description?.length > 40 ? "..." : ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  {row.branch?.name ||
                    branches.find((b) => b.id === row.branch_id)?.name ||
                    "—"}
                </TableCell>
                <TableCell sx={{ color: "#FFD600", fontWeight: 600 }}>
                  {new Intl.NumberFormat("vi-VN").format(row.price_per_hour)}đ/h
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.status === "active" ? "Hoạt động" : "Bảo trì"}
                    size="small"
                    sx={{
                      bgcolor:
                        row.status === "active"
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(245,158,11,0.15)",
                      color: row.status === "active" ? "#22c55e" : "#f59e0b",
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
          {formData.id ? "Sửa thông tin sân" : "Thêm sân mới"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Image Preview & Upload */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              mb: 3,
              p: 2,
              bgcolor: "#111",
              borderRadius: 2,
              border: "1px dashed #333",
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 2,
                bgcolor: "#2a2a2a",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <PhotoCamera sx={{ fontSize: 36, color: "#555" }} />
              )}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Ảnh sân cầu lông
              </Typography>
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{
                  borderColor: "#FFD600",
                  color: "#FFD600",
                  "&:hover": {
                    borderColor: "#FFC000",
                    bgcolor: "rgba(255,214,0,0.05)",
                  },
                }}
              >
                {imagePreview ? "Đổi ảnh" : "Chọn ảnh"}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageChange}
                />
              </Button>
              {imageFile && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 0.5, color: "#22c55e" }}
                >
                  ✓ {imageFile.name}
                </Typography>
              )}
            </Box>
          </Box>

          <TextField
            select
            fullWidth
            label="Chi nhánh *"
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
            label="Tên sân *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="dense"
          />
          <TextField
            fullWidth
            label="Giá tiền/giờ (VND) *"
            type="number"
            value={formData.price_per_hour}
            onChange={(e) =>
              setFormData({ ...formData, price_per_hour: e.target.value })
            }
            margin="dense"
          />
          <TextField
            select
            fullWidth
            label="Trạng thái"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            margin="dense"
          >
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="maintenance">Bảo trì</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Mô tả"
            multiline
            rows={3}
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
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
              px: 3,
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
