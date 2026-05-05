import React, { useEffect, useState } from "react";
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
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import adminService from "../../services/adminService";

export default function Reports() {
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [customerRevenue, setCustomerRevenue] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeType, setRangeType] = useState("custom");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const fetchData = async (range = {}) => {
    setLoading(true);
    try {
      const [branchRes, branchesRes] = await Promise.all([
        adminService.getBranchRevenue(range),
        adminService.getBranches({ per_page: 999 }),
      ]);

      const branchData = branchRes.data || [];
      const branchList =
        branchesRes.data?.items ||
        branchesRes.data?.data ||
        branchesRes.data ||
        [];
      setBranchRevenue(branchData);
      setBranches(branchList);
    } catch {
      dispatch(
        showNotification({
          message: "Không thể tải thống kê",
          severity: "error",
        }),
      );
      setBranchRevenue([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerRevenue = async (branchId, range = {}) => {
    try {
      const res = await adminService.getBranchCustomerRevenue({
        branch_id: branchId || undefined,
        ...range,
      });
      setCustomerRevenue(res.data || []);
    } catch {
      setCustomerRevenue([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    fetchCustomerRevenue(branchFilter, {
      from: fromDate || undefined,
      to: toDate || undefined,
    });
  }, [branchFilter, fromDate, toDate, loading]);

  const toDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPresetRange = (type) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (type === "week") {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(now.getDate() + diff);
      end.setDate(start.getDate() + 6);
    } else if (type === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (type === "year") {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }

    return { from: toDateString(start), to: toDateString(end) };
  };

  const handleApply = () => {
    const range =
      rangeType === "custom"
        ? { from: fromDate || undefined, to: toDate || undefined }
        : getPresetRange(rangeType);

    if (rangeType !== "custom") {
      setFromDate(range.from);
      setToDate(range.to);
    }

    fetchData(range);
    fetchCustomerRevenue(branchFilter, range);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Thống kê doanh thu
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          select
          label="Thống kê theo"
          value={rangeType}
          onChange={(e) => setRangeType(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="custom">Ngày tự chọn</MenuItem>
          <MenuItem value="week">Tuần này</MenuItem>
          <MenuItem value="month">Tháng này</MenuItem>
          <MenuItem value="year">Năm nay</MenuItem>
        </TextField>
        <TextField
          type="date"
          label="Từ ngày"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={rangeType !== "custom"}
        />
        <TextField
          type="date"
          label="Đến ngày"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={rangeType !== "custom"}
        />
        <Button
          variant="contained"
          onClick={handleApply}
          sx={{
            bgcolor: "#FFD600",
            color: "#000",
            "&:hover": { bgcolor: "#FFC000" },
          }}
        >
          Áp dụng
        </Button>
      </Box>

      <Typography variant="h6" fontWeight={700} mb={2}>
        Tổng doanh thu từng chi nhánh
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ bgcolor: "#161616", border: "1px solid #2a2a2a", mb: 4 }}
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
              <TableCell>Chi nhánh</TableCell>
              <TableCell>Doanh thu</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branchRevenue.length > 0 ? (
              branchRevenue.map((row) => (
                <TableRow
                  key={row.branch_id}
                  sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}
                >
                  <TableCell>{row.branch_name}</TableCell>
                  <TableCell sx={{ color: "#FFD600", fontWeight: 700 }}>
                    {new Intl.NumberFormat("vi-VN").format(
                      row.total_revenue || 0,
                    )}
                    đ
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Doanh thu theo khách hàng
        </Typography>
        <TextField
          select
          label="Lọc chi nhánh"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          sx={{ minWidth: 220 }}
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
              <TableCell>Khách hàng</TableCell>
              <TableCell>Chi nhánh</TableCell>
              <TableCell>Doanh thu</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customerRevenue.length > 0 ? (
              customerRevenue.map((row, idx) => (
                <TableRow
                  key={`${row.user_id}-${row.branch_id}-${idx}`}
                  sx={{ "& td": { borderBottom: "1px solid #1e1e1e" } }}
                >
                  <TableCell>{row.user_name}</TableCell>
                  <TableCell>{row.branch_name}</TableCell>
                  <TableCell sx={{ color: "#FFD600", fontWeight: 700 }}>
                    {new Intl.NumberFormat("vi-VN").format(
                      row.total_revenue || 0,
                    )}
                    đ
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
