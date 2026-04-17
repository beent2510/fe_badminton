import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Pagination,
} from "@mui/material";
import {
  Event,
  AccessTime,
  LocationOn,
  Star,
  RateReview,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import bookingService from "../../services/bookingService";
import reviewService from "../../services/reviewService";

export default function MyBookings() {
  const ITEMS_PER_PAGE = 6;
  const PAYMENT_HOLD_SECONDS = 5 * 60;
  const [bookings, setBookings] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [paging, setPaging] = useState({
    current_page: 1,
    per_page: ITEMS_PER_PAGE,
    total: 0,
  });
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(
    /** @type {any | null} */ (null),
  ); // { booking }
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [reviewedIds, setReviewedIds] = useState(
    /** @type {Record<number, boolean>} */ ({}),
  ); // bookingId -> true
  const dispatch = useDispatch();

  const sortNewestFirst = (items = []) =>
    [...items].sort((a, b) => {
      const dateA = new Date(
        a.created_at || a.updated_at || a.booking_date || 0,
      ).getTime();
      const dateB = new Date(
        b.created_at || b.updated_at || b.booking_date || 0,
      ).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  const fetchBookings = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings({
        page: targetPage,
        items_per_page: ITEMS_PER_PAGE,
      });
      const payload = res?.data?.data || res?.data || {};
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

      const paginate = payload?.paginate || {};
      setBookings(sortNewestFirst(items));
      setPaging({
        current_page: Number(paginate.current_page || targetPage || 1),
        per_page: Number(paginate.per_page || ITEMS_PER_PAGE),
        total: Number(paginate.total || items.length || 0),
      });

      if (
        items.length === 0 &&
        targetPage > 1 &&
        Number(paginate.total || 0) > 0
      ) {
        setPage(targetPage - 1);
      }
    } catch {
      dispatch(
        showNotification({
          message: "Không thể tải lịch sử đặt sân",
          severity: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch này?")) return;
    try {
      await bookingService.cancel(id);
      dispatch(
        showNotification({
          message: "Hủy lịch thành công",
          severity: "success",
        }),
      );
      fetchBookings(page);
    } catch {
      dispatch(
        showNotification({ message: "Hủy lịch thất bại", severity: "error" }),
      );
    }
  };

  const openReview = (booking) => {
    setReviewTarget(booking);
    setReviewForm({ rating: 5, comment: "" });
    setReviewDialog(true);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await reviewService.submitReview({
        court_id: reviewTarget.court_id,
        booking_id: reviewTarget.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      dispatch(
        showNotification({
          message: "Cảm ơn bạn đã đánh giá sân!",
          severity: "success",
        }),
      );
      setReviewedIds((prev) => ({ ...prev, [reviewTarget.id]: true }));
      setReviewDialog(false);
    } catch (err) {
      const msg = err.response?.data?.error || "Không thể gửi đánh giá";
      dispatch(showNotification({ message: msg, severity: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  const canReview = (booking) =>
    (booking.status === "confirmed" || booking.status === "paid") &&
    !booking.review_id &&
    !reviewedIds[booking.id];
  const isPlayed = (booking) => {
    const now = new Date();
    const playDate = new Date(booking.booking_date);
    return playDate < now || booking.status === "paid";
  };

  const isPendingUnpaid = (booking) => {
    const paymentStatus = (booking?.payment?.payment_status || "").toLowerCase();
    return booking?.status === "pending" && paymentStatus !== "paid";
  };

  const getPendingRemainingMs = (booking) => {
    if (!isPendingUnpaid(booking)) return 0;
    const createdAt = new Date(booking.created_at || booking.updated_at || Date.now()).getTime();
    const expireAt = createdAt + PAYMENT_HOLD_SECONDS * 1000;
    return Math.max(0, expireAt - nowTs);
  };

  const formatRemaining = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (loading || autoRefreshing || bookings.length === 0) return;
    const hasExpiredPending = bookings.some(
      (booking) => isPendingUnpaid(booking) && getPendingRemainingMs(booking) === 0,
    );
    if (!hasExpiredPending) return;

    setAutoRefreshing(true);
    fetchBookings(page).finally(() => setAutoRefreshing(false));
  }, [bookings, nowTs, loading, autoRefreshing, page]);

  const STATUS_COLOR = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    paid: "#22c55e",
    cancelled: "#ef4444",
  };
  const STATUS_TEXT = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    paid: "Đã thanh toán",
    cancelled: "Đã hủy",
  };
  const totalPages = Math.max(
    1,
    Math.ceil((paging.total || 0) / (paging.per_page || ITEMS_PER_PAGE)),
  );

  if (loading)
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <CircularProgress sx={{ color: "#FFD600" }} />
      </Box>
    );

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Lịch đặt sân của tôi
        </Typography>
        <Typography sx={{ color: "#9a9a9a", mb: 4 }}>
          Quản lý và xem lại lịch sử các sân cầu lông bạn đã đặt
        </Typography>

        {bookings.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              bgcolor: "#111",
              borderRadius: 4,
              border: "1px dashed #2a2a2a",
            }}>
            <Typography variant="h1" sx={{ fontSize: "4rem", mb: 2 }}>
              📅
            </Typography>
            <Typography variant="h6" sx={{ color: "#9a9a9a" }}>
              Bạn chưa có lịch đặt sân nào
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {bookings.map((booking) => (
              <Grid xs={12} md={6} key={booking.id}>
                <Card
                  sx={{
                    border: "1px solid #2a2a2a",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "rgba(255,214,0,0.3)" },
                  }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 0.5 }}>
                          {booking.court?.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "#9a9a9a",
                          }}>
                          <LocationOn
                            fontSize="small"
                            sx={{ color: "#FFD600" }}
                          />{" "}
                          {booking.court?.branch?.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={STATUS_TEXT[booking.status] || booking.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: `${STATUS_COLOR[booking.status]}20`,
                          color: STATUS_COLOR[booking.status],
                        }}
                      />
                    </Box>

                    <Divider sx={{ borderColor: "#2a2a2a", my: 1.5 }} />

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid xs={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block">
                          Ngày chơi
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: 600,
                          }}>
                          <Event fontSize="small" /> {booking.booking_date}
                        </Typography>
                      </Grid>
                      <Grid xs={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block">
                          Thời gian
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: 600,
                          }}>
                          <AccessTime fontSize="small" />{" "}
                          {booking.start_time?.substring(0, 5)} -{" "}
                          {booking.end_time?.substring(0, 5)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        bgcolor: "#111",
                        p: 1.5,
                        borderRadius: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}>
                      <Typography variant="body2" color="text.secondary">
                        Tổng thanh toán:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#FFD600", fontWeight: 800 }}>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(booking.final_price || booking.total_price)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {booking.status === "pending" && (
                        <Box sx={{ width: "100%", display: "grid", gap: 0.75 }}>
                          {isPendingUnpaid(booking) && (
                            <Typography
                              variant="caption"
                              sx={{
                                textAlign: "center",
                                color:
                                  getPendingRemainingMs(booking) > 0
                                    ? "#f59e0b"
                                    : "#ef4444",
                                fontWeight: 700,
                              }}>
                              {getPendingRemainingMs(booking) > 0
                                ? `Chờ thanh toán: ${formatRemaining(getPendingRemainingMs(booking))}`
                                : "Đã quá hạn thanh toán, đang tự hủy..."}
                            </Typography>
                          )}
                          <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            onClick={() => handleCancel(booking.id)}
                            sx={{ textTransform: "none", fontWeight: 600 }}>
                            Hủy lịch
                          </Button>
                        </Box>
                      )}
                      {canReview(booking) && isPlayed(booking) && (
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<RateReview />}
                          onClick={() => openReview(booking)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: "#FFD600",
                            color: "#FFD600",
                            "&:hover": {
                              borderColor: "#FFC000",
                              bgcolor: "rgba(255,214,0,0.05)",
                            },
                          }}>
                          Đánh giá sân
                        </Button>
                      )}
                      {(booking.review_id || reviewedIds[booking.id]) && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "#22c55e",
                            fontSize: "0.85rem",
                            width: "100%",
                            justifyContent: "center",
                          }}>
                          <Star fontSize="small" />
                          Đã đánh giá
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {paging.total > (paging.per_page || ITEMS_PER_PAGE) && (
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, nextPage) => setPage(nextPage)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Container>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog}
        onClose={() => setReviewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "#161616", border: "1px solid #2a2a2a" },
        }}>
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: "1px solid #2a2a2a" }}>
          Đánh giá sân {reviewTarget?.court?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Ngày chơi: <strong>{reviewTarget?.booking_date}</strong> | Giờ:{" "}
            <strong>
              {reviewTarget?.start_time?.substring(0, 5)} -{" "}
              {reviewTarget?.end_time?.substring(0, 5)}
            </strong>
          </Typography>

          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="body1" fontWeight={600} mb={1}>
              Chất lượng sân
            </Typography>
            <Rating
              value={reviewForm.rating}
              onChange={(_, val) =>
                setReviewForm({ ...reviewForm, rating: val })
              }
              size="large"
              sx={{
                "& .MuiRating-iconFilled": { color: "#FFD600" },
                "& .MuiRating-iconHover": { color: "#FFC000" },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={0.5}>
              {
                ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][
                  reviewForm.rating
                ]
              }
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Nhận xét của bạn (không bắt buộc)"
            value={reviewForm.comment}
            onChange={(e) =>
              setReviewForm({ ...reviewForm, comment: e.target.value })
            }
            placeholder="Chia sẻ trải nghiệm của bạn về sân cầu lông này..."
            inputProps={{ maxLength: 1000 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            mt={0.5}
            display="block"
            textAlign="right">
            {reviewForm.comment.length}/1000
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2a2a2a" }}>
          <Button onClick={() => setReviewDialog(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={submitReview}
            variant="contained"
            disabled={submitting || !reviewForm.rating}
            sx={{
              bgcolor: "#FFD600",
              color: "#000",
              "&:hover": { bgcolor: "#FFC000" },
              px: 3,
            }}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: "#000" }} />
            ) : (
              "Gửi đánh giá"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
