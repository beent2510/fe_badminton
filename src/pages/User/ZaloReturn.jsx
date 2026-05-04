import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Container, Paper, Typography } from "@mui/material";
import bookingService from "../../services/bookingService";
import paymentService from "../../services/paymentService";

export default function ZaloReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const { status, paymentId } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      status: params.get("status") || "failed",
      paymentId: params.get("payment_id") || "",
    };
  }, [location.search]);

  const isSuccess = status === "success";

  useEffect(() => {
    const finalizeBookingAfterPayment = async () => {
      if (!isSuccess) return;
      if (!paymentId) return;

      const lockKey = `zalo_booking_done_${paymentId}`;
      if (sessionStorage.getItem(lockKey) === "1") {
        setMessage("Thanh toán thành công. Booking đã được xử lý trước đó.");
        return;
      }

      const raw = localStorage.getItem("pending_zalopay_booking");
      if (!raw) {
        setMessage(
          "Thanh toán thành công nhưng không tìm thấy dữ liệu đặt sân chờ xử lý.",
        );
        return;
      }

      try {
        const paymentRes = await paymentService.getById(paymentId);
        const payment = paymentRes.data?.data || paymentRes.data || {};
        if ((payment.payment_status || "").toLowerCase() !== "paid") {
          setMessage("Thanh toán chưa được xác nhận. Chưa thể tạo booking.");
          return;
        }

        const parsed = JSON.parse(raw);
        if (
          parsed?.payment_id &&
          String(parsed.payment_id) !== String(paymentId)
        ) {
          setMessage("Dữ liệu đặt sân không khớp giao dịch thanh toán.");
          return;
        }

        const confirmedPaymentId = payment?.id || Number(paymentId);
        const bookingGroup = parsed?.booking_group || null;
        const bookings = Array.isArray(parsed?.bookings) ? parsed.bookings : [];

        if (!bookingGroup && bookings.length === 0) {
          setMessage("Không có dữ liệu đặt sân hợp lệ để tạo booking.");
          return;
        }

        setProcessing(true);
        if (bookingGroup) {
          await bookingService.bookGroup({
            ...bookingGroup,
            payment_id: confirmedPaymentId,
          });
        } else {
          for (const payload of bookings) {
            await bookingService.bookCourt({
              ...payload,
              payment_id: confirmedPaymentId,
            });
          }
        }

        sessionStorage.setItem(lockKey, "1");
        localStorage.removeItem("pending_zalopay_booking");
        setMessage("Thanh toán và đặt sân thành công.");
      } catch (error) {
        const errMsg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Thanh toán thành công nhưng tạo booking thất bại. Vui lòng liên hệ hỗ trợ.";
        setMessage(errMsg);
      } finally {
        setProcessing(false);
      }
    };

    finalizeBookingAfterPayment();
  }, [isSuccess, paymentId]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "#111",
          border: "1px solid #2a2a2a",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          color={isSuccess ? "#22c55e" : "#ef4444"}
        >
          {isSuccess
            ? "Thanh toán ZaloPay thành công"
            : "Thanh toán ZaloPay thất bại"}
        </Typography>

        <Typography color="text.secondary" mb={3}>
          {isSuccess
            ? processing
              ? "Đang tạo booking sau thanh toán..."
              : message || "Giao dịch thành công."
            : "Giao dịch chưa hoàn tất hoặc đã bị hủy. Chưa tạo booking."}
        </Typography>

        {paymentId ? (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Mã thanh toán: #{paymentId}
          </Typography>
        ) : null}

        <Button
          variant="contained"
          onClick={() => navigate("/my-bookings")}
          sx={{
            bgcolor: "#FFD600",
            color: "#000",
            "&:hover": { bgcolor: "#FFC000" },
          }}
          disabled={processing}
        >
          Đi tới booking của tôi
        </Button>
      </Paper>
    </Container>
  );
}
