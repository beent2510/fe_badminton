import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  Divider,
  Button,
  Rating,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import {
  LocationOn,
  SportsTennis,
  AccessTime,
  Star,
  CheckCircle,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { showNotification } from "../../store/notificationSlice";
import courtService from "../../services/courtService";
import bookingService from "../../services/bookingService";
import paymentService from "../../services/paymentService";
import promotionService from "../../services/promotionService";
import blockedSlotService from "../../services/blockedSlotService";

export default function CourtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  // Booking state
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    booking_date: new Date().toISOString().split("T")[0],
    start_time: "18:00",
    end_time: "20:00",
    promotion_code: "",
    booking_type: "adhoc",
    booking_purpose: "regular",
    booking_mode: "single",
    series_end_date: "",
    interval_unit: "week",
    interval_value: 1,
    payment_method: "zalopay",
    use_deposit: false,
  });
  const [promoResult, setPromoResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

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

  const isSlotBooked = (slot) => {
    const bookings = court?.bookings || [];
    const hasBooking = bookings.some((booking) => {
      const start = booking.start_time.substring(0, 5);
      const end = booking.end_time.substring(0, 5);
      return slot >= start && slot < end;
    });
    if (hasBooking) return true;
    const items = court?.booking_items || court?.bookingItems || [];
    return items.some((item) => {
      const start = item.start_time.substring(0, 5);
      const end = item.end_time.substring(0, 5);
      return slot >= start && slot < end;
    });
  };

  const handleSlotClick = (slot) => {
    if (isSlotBooked(slot) || isSlotPast(slot) || isSlotBlocked(slot)) return;

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
    setBookingData({ ...bookingData, start_time: "MULTIPLE" });
  };

  const isSlotSelected = (slot) => {
    return selectedSlots.includes(slot);
  };

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        setLoading(true);
        const res = await courtService.getById(id, {
          date: bookingData.booking_date,
          day_of_week: new Date(bookingData.booking_date).getDay(),
        });
        setCourt(res.data.data || res.data);
      } catch {
        dispatch(
          showNotification({
            message: "Không thể tải thông tin sân",
            severity: "error",
          }),
        );
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    if (bookingData.booking_date) {
      fetchCourt();
    }
  }, [id, bookingData.booking_date, navigate, dispatch]);

  useEffect(() => {
    const fetchBlockedSlots = async () => {
      try {
        const res = await blockedSlotService.getAll({
          date: bookingData.booking_date,
        });
        setBlockedSlots(res.data || []);
      } catch {
        setBlockedSlots([]);
      }
    };
    if (bookingData.booking_date) {
      fetchBlockedSlots();
    }
  }, [bookingData.booking_date]);

  useEffect(() => {
    if (
      bookingData.booking_mode === "recurring" &&
      bookingData.payment_method !== "cash"
    ) {
      setBookingData((prev) => ({ ...prev, payment_method: "cash" }));
    }
  }, [bookingData.booking_mode, bookingData.payment_method]);

  useEffect(() => {
    if (bookingData.booking_type === "fixed" && !bookingData.use_deposit) {
      setBookingData((prev) => ({ ...prev, use_deposit: true }));
    }
  }, [bookingData.booking_type, bookingData.use_deposit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "booking_date") {
      setBookingData({
        ...bookingData,
        booking_date: value,
        start_time: "",
        end_time: "",
      });
      setSelectedSlots([]);
    } else {
      setBookingData({ ...bookingData, [name]: value });
    }
  };

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

  const isSlotBlocked = (slot) => {
    return blockedSlots.some((blocked) => {
      const start = blocked.start_time?.substring(0, 5);
      const end = blocked.end_time?.substring(0, 5);
      if (!start || !end) return false;
      return slot >= start && slot < end;
    });
  };

  const calculateHours = () => {
    if (selectedSlots.length === 0 || !court) return 0;
    const segments = groupSlotsIntoSegments(court, selectedSlots);
    let total = 0;
    segments.forEach((seg) => {
      const start = new Date(`2000-01-01T${seg.start_time}`);
      const end = new Date(`2000-01-01T${seg.end_time}`);
      total += (end - start) / 3600000;
    });
    return total > 0 ? total : 0;
  };

  const calculateBaseTotal = () => {
    if (!court || selectedSlots.length === 0) return 0;

    const segments = groupSlotsIntoSegments(court, selectedSlots);
    let total = 0;

    segments.forEach((seg) => {
      const startMin = timeToMin(seg.start_time);
      const endMin = timeToMin(seg.end_time);
      let currentMin = startMin;

      while (currentMin < endMin) {
        let slotPrice = court.price_per_hour;

        if (court.court_peak_hours && court.court_peak_hours.length > 0) {
          for (let ph of court.court_peak_hours) {
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

  const calculateFixedDiscount = () => {
    if (bookingData.booking_type !== "fixed") return 0;
    return calculateBaseTotal() * 0.1;
  };

  const calculateTotal = () => {
    return Math.max(0, calculateBaseTotal() - calculateFixedDiscount());
  };

  const checkPromoCode = async () => {
    if (!bookingData.promotion_code) return;
    try {
      const res = await promotionService.checkCode(bookingData.promotion_code);
      const data = res.data;
      if (data.valid || data.success) {
        const total = calculateTotal();
        const totalHours = calculateHours();
        const hasPeakOverlap = selectedSlots.some((slot) => {
          if (!court?.court_peak_hours) return false;
          return court.court_peak_hours.some((ph) => {
            const phStart = ph.from_time.substring(0, 5);
            const phEnd = ph.to_time.substring(0, 5);
            return slot >= phStart && slot < phEnd;
          });
        });
        const applyRes = await promotionService.applyCode(
          bookingData.promotion_code,
          total,
          {
            total_hours: totalHours,
            courts_count: 1,
            has_peak_overlap: hasPeakOverlap,
            booking_purpose: bookingData.booking_purpose,
          },
        );
        const aData = applyRes.data;
        if (aData.success) {
          const discount = total - aData.total;
          setPromoResult({
            valid: true,
            total: aData.total,
            discount,
            final_price: aData.total,
            promotion: aData.promotion,
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

  const handleBooking = async () => {
    if (!isAuthenticated) return navigate("/login");
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

    if (
      bookingData.booking_mode === "recurring" &&
      !bookingData.series_end_date
    ) {
      return dispatch(
        showNotification({
          message: "Vui lòng chọn ngày kết thúc cho đặt định kỳ",
          severity: "warning",
        }),
      );
    }

    if (
      bookingData.booking_mode === "recurring" &&
      bookingData.payment_method !== "cash"
    ) {
      return dispatch(
        showNotification({
          message: "Đặt định kỳ hiện chỉ hỗ trợ thanh toán tiền mặt",
          severity: "warning",
        }),
      );
    }

    try {
      setBookingLoading(true);
      const segments = groupSlotsIntoSegments(court, selectedSlots);

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

      const items = [];
      for (const seg of segments) {
        const startMin = timeToMin(seg.start_time);
        const endMin = timeToMin(seg.end_time);
        let currentMin = startMin;
        let segTotal = 0;
        while (currentMin < endMin) {
          let slotPrice = court.price_per_hour;
          if (court.court_peak_hours && court.court_peak_hours.length > 0) {
            for (let ph of court.court_peak_hours) {
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

        items.push({
          court_id: court.id,
          booking_date: bookingData.booking_date,
          day_of_week: new Date(bookingData.booking_date).getDay(),
          start_time: seg.start_time,
          end_time: seg.end_time,
          total_price: segTotal,
        });
      }

      const totalAmount = promoResult?.valid
        ? Number(promoResult.total || 0)
        : Number(calculateTotal() || 0);

      const depositPercent = 30;
      const chargeAmount = bookingData.use_deposit
        ? Math.round((totalAmount * depositPercent) / 100)
        : totalAmount;

      const payload = {
        items,
        booking_type: bookingData.booking_type,
        booking_purpose: bookingData.booking_purpose,
        booking_mode: bookingData.booking_mode,
        series_start_date: bookingData.booking_date,
        series_end_date:
          bookingData.series_end_date || bookingData.booking_date,
        interval_unit: bookingData.interval_unit,
        interval_value: bookingData.interval_value,
        promotion_code: promoResult?.valid ? bookingData.promotion_code : null,
        payment_method: bookingData.payment_method,
        use_deposit: bookingData.use_deposit,
        deposit_percent: depositPercent,
      };

      if (bookingData.payment_method === "cash") {
        await bookingService.bookGroup(payload);
        dispatch(
          showNotification({
            message: "Đặt sân thành công (thanh toán tiền mặt)",
            severity: "success",
          }),
        );
        setOpenBooking(false);
        setSelectedSlots([]);
        setBookingData({
          ...bookingData,
          start_time: "",
          end_time: "",
          promotion_code: "",
        });
        setPromoResult(null);
        return;
      }

      const paymentRes = await paymentService.createZalopayPayment({
        amount: chargeAmount,
      });

      const paymentUrl = paymentRes.data?.payment_url;
      const paymentId = paymentRes.data?.payment_id;
      if (!paymentUrl) {
        throw new Error("Không tạo được link thanh toán ZaloPay");
      }

      localStorage.setItem(
        "pending_zalopay_booking",
        JSON.stringify({
          booking_group: payload,
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
      // Optional: navigate to my-bookings
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
        }}
      >
        <CircularProgress sx={{ color: "#FFD600" }} />
      </Box>
    );
  }

  if (!court) return null;

  return (
    <Box sx={{ pb: 8, pt: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid xs={12} md={8}>
            <Box
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                mb: 3,
                position: "relative",
              }}
            >
              <CardMedia
                component="img"
                height="400"
                image={
                  court.image_url
                    ? court.image_url.startsWith("http")
                      ? court.image_url
                      : `http://localhost:8000/storage/${court.image_url}`
                    : `https://placehold.co/800x400/1e1e1e/FFD600?text=${encodeURIComponent(court.name)}`
                }
                alt={court.name}
                onError={(e) => {
                  e.target.src = `https://placehold.co/800x400/1e1e1e/FFD600?text=${encodeURIComponent(court.name)}`;
                }}
              />
              <Chip
                label={court.status === "active" ? "Đang hoạt động" : "Bảo trì"}
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  bgcolor: court.status === "active" ? "#22c55e" : "#f59e0b",
                  color: "#fff",
                  fontWeight: 600,
                }}
              />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              {court.name}
            </Typography>

            <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOn sx={{ color: "#FFD600" }} />
                <Typography color="text.secondary">
                  {court.branch?.name} - {court.branch?.address}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Star sx={{ color: "#FFD600" }} />
                <Typography>
                  4.8 <span style={{ color: "#666" }}>(120 đánh giá)</span>
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: "#2a2a2a", my: 3 }} />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Mô tả sân
            </Typography>
            <Typography
              sx={{
                color: "#9a9a9a",
                lineHeight: 1.8,
                whiteSpace: "pre-line",
              }}
            >
              {court.description ||
                "Sân cầu lông đạt tiêu chuẩn thi đấu quốc tế với thảm trải cao cấp, ánh sáng chống chói và không gian rộng rãi thoáng mát. Phù hợp cho cả việc tập luyện và tổ chức các giải đấu quy mô nhỏ đến vừa."}
            </Typography>

            <Divider sx={{ borderColor: "#2a2a2a", my: 3 }} />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Tiện ích
            </Typography>
            <Grid container spacing={2}>
              {[
                "Wifi miễn phí",
                "Chỗ để xe rộng rãi",
                "Khu vực nghỉ ngơi",
                "Nước suối lạnh",
                "Băng gạc y tế",
              ].map((item) => (
                <Grid xs={6} sm={4} key={item}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle sx={{ color: "#22c55e", fontSize: 20 }} />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Booking Widget Sidebar */}
          <Grid xs={12} md={4}>
            <Box sx={{ position: "sticky", top: 100 }}>
              <Card
                sx={{
                  p: 3,
                  background: "linear-gradient(145deg, #161616, #111)",
                  border: "1px solid #2a2a2a",
                  borderRadius: 4,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, mb: 1, color: "#FFD600" }}
                >
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(court.price_per_hour)}
                  <span
                    style={{
                      fontSize: "1rem",
                      color: "#9a9a9a",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    / giờ (Giá gốc)
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                  Bao gồm thuế và phí
                </Typography>

                <Divider sx={{ borderColor: "#2a2a2a", mb: 3 }} />

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => setOpenBooking(true)}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    bgcolor: "#FFD600",
                    color: "#000",
                    "&:hover": { bgcolor: "#FFC000" },
                  }}
                >
                  ĐẶT SÂN NGAY
                </Button>

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "#9a9a9a",
                    }}
                  >
                    <CheckCircle sx={{ color: "#FFD600", fontSize: 16 }} /> Xác
                    nhận tức thì
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "#9a9a9a",
                    }}
                  >
                    <CheckCircle sx={{ color: "#FFD600", fontSize: 16 }} /> Hỗ
                    trợ huỷ linh hoạt
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Booking Dialog */}
      <Dialog
        open={openBooking}
        onClose={() => setOpenBooking(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: "1px solid #2a2a2a", pb: 2 }}
        >
          Xác nhận đặt sân
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              {court.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {court.branch?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Giờ đã chọn:
            </Typography>
            {groupSlotsIntoSegments(court, selectedSlots).map((seg, i) => (
              <Typography key={i} variant="body2" color="text.secondary" ml={2}>
                - {seg.start_time} tới {seg.end_time}
              </Typography>
            ))}
          </Box>

          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="booking_type"
                label="Loại đặt sân"
                value={bookingData.booking_type}
                onChange={handleChange}
              >
                <MenuItem value="adhoc">Vãng lai</MenuItem>
                <MenuItem value="fixed">Cố định</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="booking_purpose"
                label="Mục đích"
                value={bookingData.booking_purpose}
                onChange={handleChange}
              >
                <MenuItem value="regular">Thông thường</MenuItem>
                <MenuItem value="tournament">Tổ chức giải</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="booking_mode"
                label="Hình thức"
                value={bookingData.booking_mode}
                onChange={handleChange}
              >
                <MenuItem value="single">Đặt 1 lần</MenuItem>
                <MenuItem value="recurring">Đặt định kỳ</MenuItem>
              </TextField>
            </Grid>
            {bookingData.booking_mode === "recurring" && (
              <>
                <Grid xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    name="interval_unit"
                    label="Chu kỳ"
                    value={bookingData.interval_unit}
                    onChange={handleChange}
                  >
                    <MenuItem value="week">Theo tuần</MenuItem>
                    <MenuItem value="month">Theo tháng</MenuItem>
                    <MenuItem value="quarter">Theo quý</MenuItem>
                    <MenuItem value="year">Theo năm</MenuItem>
                  </TextField>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    type="date"
                    fullWidth
                    name="series_end_date"
                    label="Ngày kết thúc"
                    value={bookingData.series_end_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: bookingData.booking_date }}
                  />
                </Grid>
              </>
            )}
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="payment_method"
                label="Thanh toán"
                value={bookingData.payment_method}
                onChange={handleChange}
              >
                <MenuItem value="zalopay">ZaloPay</MenuItem>
                <MenuItem value="cash">Tiền mặt</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="use_deposit"
                label="Đặt cọc"
                value={bookingData.use_deposit ? 1 : 0}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    use_deposit: Boolean(Number(e.target.value)),
                  })
                }
              >
                <MenuItem value={0}>Không đặt cọc</MenuItem>
                <MenuItem value={1}>Đặt cọc 30%</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                type="date"
                name="booking_date"
                label="Ngày chơi"
                value={bookingData.booking_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formattedToday }}
              />
            </Grid>
            <Grid xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                  mt: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Bảng giờ: Nhấn vào từng ô liền kề để chọn thời gian đặt sân
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #333",
                        borderRadius: 2,
                      }}
                    ></span>{" "}
                    Trống
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: "#FFD600",
                        borderRadius: 2,
                      }}
                    ></span>{" "}
                    Đang chọn
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: "#ef4444",
                        borderRadius: 2,
                      }}
                    ></span>{" "}
                    Đã đặt
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: "#2f2f2f",
                        borderRadius: 2,
                      }}
                    ></span>{" "}
                    Đã qua giờ
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: "#3b3b3b",
                        borderRadius: 2,
                      }}
                    ></span>{" "}
                    Khung giờ cấm
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 1,
                }}
              >
                {getCourtTimeSlots(court).map((slot) => {
                  const isBooked = isSlotBooked(slot);
                  const isPast = isSlotPast(slot);
                  const isSelected = isSlotSelected(slot);
                  const isBlocked = isSlotBlocked(slot);
                  return (
                    <Chip
                      key={slot}
                      label={slot}
                      clickable={!isBooked && !isPast && !isBlocked}
                      onClick={() =>
                        !isBooked &&
                        !isPast &&
                        !isBlocked &&
                        handleSlotClick(slot)
                      }
                      sx={{
                        width: "100%",
                        bgcolor: isBooked
                          ? "#ef4444"
                          : isBlocked
                            ? "#3b3b3b"
                            : isPast
                              ? "#2f2f2f"
                              : isSelected
                                ? "#FFD600"
                                : "#1e1e1e",
                        color: isBooked
                          ? "#fff"
                          : isBlocked
                            ? "#e5e5e5"
                            : isSelected
                              ? "#000"
                              : "#fff",
                        fontWeight: isSelected ? 700 : 500,
                        border:
                          isSelected || isBooked || isPast || isBlocked
                            ? "none"
                            : "1px solid #333",
                        "&:hover": {
                          bgcolor: isBooked
                            ? "#ef4444"
                            : isBlocked
                              ? "#3b3b3b"
                              : isPast
                                ? "#2f2f2f"
                                : isSelected
                                  ? "#e6c200"
                                  : "#333",
                        },
                        transition: "all 0.2s",
                        cursor:
                          isBooked || isPast || isBlocked
                            ? "not-allowed"
                            : "pointer",
                        opacity: isBooked || isPast || isBlocked ? 0.8 : 1,
                      }}
                    />
                  );
                })}
              </Box>
              {selectedSlots.length > 0 && (
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
                  }}
                >
                  {groupSlotsIntoSegments(court, selectedSlots).map(
                    (seg, i) => (
                      <Typography key={i} variant="body2" color="#FFD600">
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
                  disabled={!bookingData.promotion_code}
                >
                  ÁP DỤNG
                </Button>
              </Box>
              {promoResult?.valid === false && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 0.5, display: "block" }}
                >
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
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
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
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography color="text.secondary">Thời gian</Typography>
              <Typography>{calculateHours()} giờ</Typography>
            </Box>

            {bookingData.booking_type === "fixed" && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  color: "#22c55e",
                }}
              >
                <Typography>Giảm cố định (10%)</Typography>
                <Typography>
                  -
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(calculateFixedDiscount())}
                </Typography>
              </Box>
            )}

            {promoResult?.valid && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  color: "#22c55e",
                }}
              >
                <Typography>Giảm giá</Typography>
                <Typography>
                  -
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(calculateTotal() - promoResult.total)}
                </Typography>
              </Box>
            )}

            {promoResult?.promotion?.discount_type === "percentage" && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  color: "#22c55e",
                }}
              >
                <Typography>Giảm giá (%)</Typography>
                <Typography>{promoResult.promotion.discount_value}%</Typography>
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
            {bookingData.use_deposit && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                  color: "#f59e0b",
                }}
              >
                <Typography>Đặt cọc (30%)</Typography>
                <Typography>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(
                    (promoResult?.valid
                      ? promoResult.total
                      : calculateTotal()) * 0.3,
                  )}
                </Typography>
              </Box>
            )}
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
            sx={{ px: 4 }}
          >
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
