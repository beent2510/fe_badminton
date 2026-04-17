import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { LocationOn, Phone, Star, SportsTennis } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import branchService from "../../services/branchService";
import paymentService from "../../services/paymentService";
import promotionService from "../../services/promotionService";

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [branch, setBranch] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [openBooking, setOpenBooking] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [bookingData, setBookingData] = useState({
    booking_date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    promotion_code: "",
  });
  const [promoResult, setPromoResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectionStep, setSelectionStep] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const getCourtTimeSlots = (courtInstance) => {
    if (courtInstance?.schedules && courtInstance.schedules.length > 0) {
      let slots = [];
      courtInstance.schedules.forEach((schedule) => {
        const startStr = schedule.start_time.substring(0, 5);
        const endStr = schedule.end_time.substring(0, 5);
        const duration = parseInt(schedule.slot_duration) || 30;

        const [startH, startM] = startStr.split(":").map(Number);
        const [endH, endM] = endStr.split(":").map(Number);

        let currentMin = startH * 60 + startM;
        const endDayMin = endH * 60 + endM;

        while (currentMin < endDayMin) {
          const h = Math.floor(currentMin / 60)
            .toString()
            .padStart(2, "0");
          const m = (currentMin % 60).toString().padStart(2, "0");
          slots.push(`${h}:${m}`);
          currentMin += duration;
        }
      });
      return [...new Set(slots)].sort();
    }
    return Array.from({ length: 37 }, (_, i) => {
      const hour = Math.floor(i / 2) + 5;
      const min = i % 2 === 0 ? "00" : "30";
      return `${hour.toString().padStart(2, "0")}:${min}`;
    });
  };

  const getNextSlot = (courtInstance, slot) => {
    const slots = getCourtTimeSlots(courtInstance);
    const index = slots.indexOf(slot);
    if (index !== -1 && index + 1 < slots.length) {
      return slots[index + 1];
    }
    const defaultDuration = courtInstance?.schedules?.[0]?.slot_duration || 30;
    const [h, m] = slot.split(":").map(Number);
    let totalMins = h * 60 + m + parseInt(defaultDuration);
    return `${Math.floor(totalMins / 60)
      .toString()
      .padStart(2, "0")}:${(totalMins % 60).toString().padStart(2, "0")}`;
  };

  const groupSlotsIntoSegments = (courtInstance, slotsArray) => {
    if (!slotsArray || slotsArray.length === 0) return [];
    const courtSlots = getCourtTimeSlots(courtInstance);
    const sorted = [...slotsArray].sort(
      (a, b) => courtSlots.indexOf(a) - courtSlots.indexOf(b),
    );
    let segments = [];
    let currentSegment = {
      start_time: sorted[0],
      end_time: getNextSlot(courtInstance, sorted[0]),
    };

    for (let i = 1; i < sorted.length; i++) {
      const slot = sorted[i];
      if (courtSlots.indexOf(slot) === courtSlots.indexOf(sorted[i - 1]) + 1) {
        currentSegment.end_time = getNextSlot(courtInstance, slot);
      } else {
        segments.push(currentSegment);
        currentSegment = {
          start_time: slot,
          end_time: getNextSlot(courtInstance, slot),
        };
      }
    }
    segments.push(currentSegment);
    return segments;
  };

  const handleSlotClick = (court, slot) => {
    if (isSlotPast(slot)) return;

    if (selectedCourt?.id !== court.id) {
      setSelectedCourt(court);
      setSelectedSlots([slot]);
    } else {
      if (selectedSlots.includes(slot)) {
        setSelectedSlots(selectedSlots.filter((s) => s !== slot));
      } else {
        setSelectedSlots([...selectedSlots, slot]);
      }
    }
    // We update bookingData start/end time just for backward compat check if needed,
    // although we will rely on selectedSlots mostly.
    setBookingData({ ...bookingData, start_time: "MULTIPLE" });
  };

  const handleChange = (e) =>
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });

  const isSlotBooked = (court, slot) => {
    if (!court.bookings || court.bookings.length === 0) return false;
    return court.bookings.some((booking) => {
      const start = booking.start_time.substring(0, 5);
      const end = booking.end_time.substring(0, 5);
      return slot >= start && slot < end;
    });
  };

  const isSlotSelected = (court, slot) => {
    return selectedCourt?.id === court.id && selectedSlots.includes(slot);
  };

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const branchRes = await branchService.getById(id);
        setBranch(branchRes.data.data || branchRes.data);
      } catch (error) {
        console.error("Lỗi tải chi nhánh", error);
        dispatch(
          showNotification({
            message: "Không thể tải thông tin chi nhánh",
            severity: "error",
          }),
        );
        navigate("/");
      }
    };
    fetchBranch();
  }, [id, navigate, dispatch]);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const courtsRes = await branchService.getCourts(id, {
          date: bookingData.booking_date,
          day_of_week: new Date(bookingData.booking_date).getDay(),
        });
        setCourts(
          courtsRes.data.items || courtsRes.data.data || courtsRes.data,
        );
      } catch (error) {
        console.error("Lỗi tải danh sách sân", error);
      } finally {
        setLoading(false);
      }
    };
    if (bookingData.booking_date) {
      fetchCourts();
    }
  }, [id, bookingData.booking_date]);

  const timeToMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const isSlotPast = (slot) => {
    if (bookingData.booking_date !== formattedToday) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return timeToMin(slot) <= nowMinutes;
  };

  const calculateHours = () => {
    if (selectedSlots.length === 0 || !selectedCourt) return 0;
    const segments = groupSlotsIntoSegments(selectedCourt, selectedSlots);
    let total = 0;
    segments.forEach((seg) => {
      const start = new Date(`2000-01-01T${seg.start_time}`);
      const end = new Date(`2000-01-01T${seg.end_time}`);
      total += (end - start) / 3600000;
    });
    return total > 0 ? total : 0;
  };

  const calculateTotal = () => {
    if (!selectedCourt || selectedSlots.length === 0) return 0;

    const segments = groupSlotsIntoSegments(selectedCourt, selectedSlots);
    let total = 0;

    segments.forEach((seg) => {
      const startMin = timeToMin(seg.start_time);
      const endMin = timeToMin(seg.end_time);
      let currentMin = startMin;

      while (currentMin < endMin) {
        let slotPrice = selectedCourt.price_per_hour;

        if (
          selectedCourt.court_peak_hours &&
          selectedCourt.court_peak_hours.length > 0
        ) {
          for (let ph of selectedCourt.court_peak_hours) {
            const phStart = timeToMin(ph.from_time.substring(0, 5));
            const phEnd = timeToMin(ph.to_time.substring(0, 5));
            if (currentMin >= phStart && currentMin < phEnd) {
              slotPrice = ph.price_peak_hour;
              break;
            }
          }
        }

        total += slotPrice / 2;
        currentMin += 30;
      }
    });

    return total;
  };

  const checkPromoCode = async () => {
    if (!bookingData.promotion_code) return;
    try {
      const res = await promotionService.checkCode(bookingData.promotion_code);
      const data = res.data;
      if (data.valid || data.success) {
        const total = calculateTotal();
        const applyRes = await promotionService.applyCode(
          bookingData.promotion_code,
          total,
        );
        const aData = applyRes.data;
        if (aData.success) {
          const discount = total - aData.total;
          setPromoResult({
            valid: true,
            total: aData.total,
            discount,
            final_price: aData.total,
          });
          dispatch(
            showNotification({
              message: `Giảm ${new Intl.NumberFormat("vi-VN").format(discount)}đ`,
              severity: "success",
            }),
          );
        } else {
          setPromoResult({
            valid: false,
            message: aData.message || "Mã không hợp lệ",
          });
        }
      } else {
        setPromoResult({
          valid: false,
          message: data.message || "Mã không hợp lệ hoặc đã hết hạn",
        });
      }
    } catch {
      setPromoResult({
        valid: false,
        message: "Mã không hợp lệ hoặc đã hết hạn",
      });
    }
  };

  const handleOpenBooking = (court) => {
    if (!isAuthenticated) return navigate("/login");
    if (
      !selectedCourt ||
      selectedCourt.id !== court.id ||
      !bookingData.start_time
    ) {
      dispatch(
        showNotification({
          message: "Vui lòng chọn thời gian chơi trên bảng giờ",
          severity: "warning",
        }),
      );
      return;
    }
    setOpenBooking(true);
  };

  const handleBooking = async () => {
    if (bookingData.booking_date < formattedToday) {
      return dispatch(
        showNotification({
          message: "Không thể đặt sân trong quá khứ",
          severity: "warning",
        }),
      );
    }
    const hours = calculateHours();
    if (hours <= 0)
      return dispatch(
        showNotification({
          message: "Vui lòng chọn thời gian",
          severity: "warning",
        }),
      );

    try {
      setBookingLoading(true);
      const segments = groupSlotsIntoSegments(selectedCourt, selectedSlots);

      if (bookingData.booking_date === formattedToday) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const hasPastTime = segments.some(
          (seg) => timeToMin(seg.start_time) <= nowMinutes,
        );
        if (hasPastTime) {
          dispatch(
            showNotification({
              message: "Không thể đặt khung giờ đã qua",
              severity: "warning",
            }),
          );
          return;
        }
      }
      const pendingBookings = [];

      for (const seg of segments) {
        const startMin = timeToMin(seg.start_time);
        const endMin = timeToMin(seg.end_time);
        let currentMin = startMin;
        let segTotal = 0;
        while (currentMin < endMin) {
          let slotPrice = selectedCourt.price_per_hour;
          if (
            selectedCourt.court_peak_hours &&
            selectedCourt.court_peak_hours.length > 0
          ) {
            for (let ph of selectedCourt.court_peak_hours) {
              const phStart = timeToMin(ph.from_time.substring(0, 5));
              const phEnd = timeToMin(ph.to_time.substring(0, 5));
              if (currentMin >= phStart && currentMin < phEnd) {
                slotPrice = ph.price_peak_hour;
                break;
              }
            }
          }
          segTotal += slotPrice / 2;
          currentMin += 30;
        }

        const payload = {
          user_id: user.id,
          court_id: selectedCourt.id,
          booking_date: bookingData.booking_date,
          day_of_week: new Date(bookingData.booking_date).getDay(),
          start_time: seg.start_time,
          end_time: seg.end_time,
          total_price: segTotal,
          promotion_code: promoResult?.valid
            ? bookingData.promotion_code
            : null,
        };
        pendingBookings.push(payload);
      }

      if (pendingBookings.length === 0) {
        throw new Error("Không có dữ liệu đặt sân để thanh toán");
      }

      const totalAmount = promoResult?.valid
        ? Number(promoResult.total || 0)
        : Number(calculateTotal() || 0);

      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new Error("Số tiền thanh toán không hợp lệ");
      }

      const paymentRes = await paymentService.createZalopayPayment({
        amount: totalAmount,
      });

      const paymentUrl = paymentRes.data?.payment_url;
      const paymentId = paymentRes.data?.payment_id;
      if (!paymentUrl) {
        throw new Error("Không tạo được link thanh toán ZaloPay");
      }

      localStorage.setItem(
        "pending_zalopay_booking",
        JSON.stringify({
          bookings: pendingBookings,
          created_at: Date.now(),
          amount: totalAmount,
          payment_id: paymentId || null,
        }),
      );

      dispatch(
        showNotification({
          message: "Đang chuyển tới cổng thanh toán ZaloPay...",
          severity: "info",
        }),
      );
      window.location.href = paymentUrl;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Có lỗi xảy ra khi đặt sân";
      dispatch(showNotification({ message: errorMsg, severity: "error" }));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <CircularProgress sx={{ color: "#FFD600" }} />
      </Box>
    );
  }

  if (!branch) return null;

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="lg">
        {/* Branch Info */}
        <Box sx={{ mb: 6 }}>
          {branch.image_url && (
            <Box
              sx={{
                width: "100%",
                height: 400,
                borderRadius: 4,
                overflow: "hidden",
                mb: 4,
              }}>
              <img
                src={
                  branch.image_url.startsWith("http")
                    ? branch.image_url
                    : `http://localhost:8000/storage/${branch.image_url}`
                }
                alt={branch.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </Box>
          )}
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            {branch.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOn sx={{ color: "#FFD600" }} />
              <Typography color="text.secondary">{branch.address}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Phone sx={{ color: "#FFD600" }} />
              <Typography color="text.secondary">
                {branch.phone_number}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ borderColor: "#2a2a2a" }} />
        </Box>

        {/* Global Date Selection & Legend */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { md: "center" },
            justifyContent: "space-between",
            gap: 3,
            bgcolor: "#111",
            p: 3,
            borderRadius: 2,
            border: "1px solid #2a2a2a",
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">Chọn ngày chơi chung:</Typography>
            <TextField
              type="date"
              name="booking_date"
              value={bookingData.booking_date}
              onChange={(e) => {
                handleChange(e);
                setSelectedCourt(null);
                setSelectedSlots([]);
                setBookingData((prev) => ({
                  ...prev,
                  start_time: "",
                  end_time: "",
                }));
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: formattedToday }}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#1e1e1e" } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  backgroundColor: "#1e1e1e",
                  border: "1px solid #333",
                  borderRadius: 4,
                }}></span>{" "}
              Trống
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  backgroundColor: "#FFD600",
                  borderRadius: 4,
                }}></span>{" "}
              Đang chọn
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  backgroundColor: "#ef4444",
                  borderRadius: 4,
                }}></span>{" "}
              Đã có người đặt
            </Typography>
          </Box>
        </Box>

        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          Danh sách sân
        </Typography>

        {courts.length === 0 ? (
          <Typography sx={{ color: "#9a9a9a" }}>
            Chi nhánh này hiện chưa có sân nào.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {courts.map((court) => (
              <Grid xs={12} key={court.id}>
                <Card
                  sx={{
                    bgcolor: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}>
                  <Grid container>
                    <Grid
                      xs={12}
                      md={3}
                      sx={{
                        bgcolor: "#1e1e1e",
                        p: 3,
                        borderRight: { md: "1px solid #2a2a2a" },
                        display: "flex",
                        flexDirection: "column",
                      }}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 1, color: "#FFD600" }}>
                        {court.name}
                      </Typography>
                      <Chip
                        label={
                          court.status === "active" ? "Hoạt động" : "Bảo trì"
                        }
                        size="small"
                        sx={{
                          alignSelf: "flex-start",
                          mb: 2,
                          bgcolor:
                            court.status === "active"
                              ? "rgba(34,197,94,0.2)"
                              : "rgba(245,158,11,0.2)",
                          color:
                            court.status === "active" ? "#22c55e" : "#f59e0b",
                          fontWeight: 600,
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: "auto",
                          mb: 2,
                        }}>
                        <SportsTennis sx={{ color: "#9a9a9a" }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(court.price_per_hour)}
                          /h (Giá gốc)
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          fontWeight: 700,
                          bgcolor: "#FFD600",
                          color: "#000",
                          "&:hover": { bgcolor: "#FFC000" },
                        }}
                        onClick={() => handleOpenBooking(court)}>
                        ĐẶT SÂN NÀY
                      </Button>
                    </Grid>
                    <Grid xs={12} md={9} sx={{ p: 3 }}>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Bảng giờ: Nhấn vào từng ô liền kề để chọn thời gian đặt
                        sân.
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(60px, 1fr))",
                          gap: 1,
                        }}>
                        {getCourtTimeSlots(court).map((slot) => {
                          const isBooked = isSlotBooked(court, slot);
                          const isPast = isSlotPast(slot);
                          const isSelected = isSlotSelected(court, slot);
                          return (
                            <Chip
                              key={slot}
                              label={slot}
                              clickable={!isBooked && !isPast}
                              onClick={() =>
                                !isBooked &&
                                !isPast &&
                                handleSlotClick(court, slot)
                              }
                              sx={{
                                bgcolor: isBooked
                                  ? "#ef4444"
                                  : isPast
                                    ? "#2f2f2f"
                                    : isSelected
                                      ? "#FFD600"
                                      : "#1e1e1e",
                                color: isBooked
                                  ? "#fff"
                                  : isSelected
                                    ? "#000"
                                    : "#fff",
                                fontWeight: isSelected ? 700 : 500,
                                border:
                                  isSelected || isBooked || isPast
                                    ? "none"
                                    : "1px solid #333",
                                "&:hover": {
                                  bgcolor: isBooked
                                    ? "#ef4444"
                                    : isPast
                                      ? "#2f2f2f"
                                      : isSelected
                                        ? "#e6c200"
                                        : "#333",
                                },
                                transition: "all 0.2s",
                                borderRadius: 1,
                                cursor:
                                  isBooked || isPast
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: isBooked || isPast ? 0.8 : 1,
                              }}
                            />
                          );
                        })}
                      </Box>
                      {selectedCourt?.id === court.id &&
                        selectedSlots.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              mt: 2,
                              bgcolor: "rgba(255,214,0,0.1)",
                              p: 1.5,
                              borderRadius: 2,
                              border: "1px solid rgba(255,214,0,0.2)",
                            }}>
                            {groupSlotsIntoSegments(court, selectedSlots).map(
                              (seg, i) => (
                                <Typography
                                  key={i}
                                  variant="body2"
                                  color="#FFD600">
                                  Đã chọn:{" "}
                                  <strong>
                                    {seg.start_time} - {seg.end_time}
                                  </strong>
                                </Typography>
                              ),
                            )}
                          </Box>
                        )}
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Reviews Section */}
        {branch.reviews && branch.reviews.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
              Đánh giá từ người chơi
            </Typography>
            <Grid container spacing={3}>
              {branch.reviews.map((review) => (
                <Grid item xs={12} md={6} lg={4} key={review.id}>
                  <Card
                    sx={{
                      bgcolor: "#111",
                      border: "1px solid #2a2a2a",
                      borderRadius: 4,
                      height: "100%",
                    }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 2,
                        }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: "#FFD600",
                            color: "#000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                          }}>
                          {review.user?.name
                            ? review.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </Box>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}>
                            {review.user?.name || "Người dùng ẩn danh"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#9a9a9a" }}>
                            {new Date(review.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 2,
                          color: "#FFD600",
                        }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            fontSize="small"
                            sx={{
                              color: i < review.rating ? "#FFD600" : "#333",
                            }}
                          />
                        ))}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#ccc",
                          fontStyle: "italic",
                          whiteSpace: "pre-line",
                        }}>
                        "{review.comment || "Không có nhận xét"}"
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* Booking Dialog */}
      <Dialog
        open={openBooking}
        onClose={() => setOpenBooking(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: "1px solid #2a2a2a", pb: 2 }}>
          Xác nhận đặt sân
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedCourt && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                {selectedCourt.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {branch.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Ngày: {bookingData.booking_date}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Giờ đã chọn:
              </Typography>
              {groupSlotsIntoSegments(selectedCourt, selectedSlots).map(
                (seg, i) => (
                  <Typography
                    key={i}
                    variant="body2"
                    color="text.secondary"
                    ml={2}>
                    - {seg.start_time} tới {seg.end_time}
                  </Typography>
                ),
              )}
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid xs={12}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  name="promotion_code"
                  label="Mã giảm giá (nếu có)"
                  value={bookingData.promotion_code}
                  onChange={handleChange}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={checkPromoCode}
                  disabled={!bookingData.promotion_code}>
                  ÁP DỤNG
                </Button>
              </Box>
              {promoResult?.valid === false && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 0.5, display: "block" }}>
                  {promoResult.message}
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "#111",
              borderRadius: 2,
              border: "1px solid #2a2a2a",
            }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="text.secondary">
                Tạm tính (Bao gồm giờ vàng nếu có)
              </Typography>
              <Typography>
                {calculateTotal()
                  ? new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(calculateTotal())
                  : "0 đ"}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="text.secondary">Thời gian</Typography>
              <Typography>{calculateHours()} giờ</Typography>
            </Box>

            {promoResult?.valid && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  color: "#22c55e",
                }}>
                <Typography>Giảm giá</Typography>
                <Typography>
                  -
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(promoResult.discount || 0)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1, borderColor: "#2a2a2a" }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={700}>Tổng cộng</Typography>
              <Typography fontWeight={800} color="#FFD600" fontSize="1.2rem">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  promoResult?.valid ? promoResult.total : calculateTotal(),
                )}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #2a2a2a" }}>
          <Button onClick={() => setOpenBooking(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleBooking}
            variant="contained"
            color="primary"
            disabled={bookingLoading}
            sx={{ px: 4 }}>
            XÁC NHẬN ĐẶT{" "}
            {bookingLoading && (
              <CircularProgress size={20} sx={{ ml: 1, color: "#000" }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
