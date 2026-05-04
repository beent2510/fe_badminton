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
} from "@mui/material";
import adminService from "../../services/adminService";

export default function Reports() {
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [customerRevenue, setCustomerRevenue] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");

  const fetchData = async () => {
    const [branchRes, branchesRes] = await Promise.all([
      adminService.getBranchRevenue(),
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
  };

  const fetchCustomerRevenue = async (branchId) => {
    const res = await adminService.getBranchCustomerRevenue({
      branch_id: branchId || undefined,
    });
    setCustomerRevenue(res.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchCustomerRevenue(branchFilter);
  }, [branchFilter]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Thống kê doanh thu
      </Typography>

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
