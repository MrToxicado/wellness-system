import { BOOKING_STATUS, BOOKING_STATUS_COLORS, THERAPIST_GENDER_COLORS } from '../constants';

export const getStatusColors = (status) => {
  const normalizedStatus = status?.toLowerCase().replace(' ', '_') || 'pending';
  return BOOKING_STATUS_COLORS[normalizedStatus] || BOOKING_STATUS_COLORS.pending;
};

export const getTherapistColor = (gender) => {
  return THERAPIST_GENDER_COLORS[gender] || '#6B7280';
};

export const normalizeStatus = (status) => {
  if (!status) return BOOKING_STATUS.PENDING;
  const s = status.toLowerCase().replace(/ /g, '_');
  if (s === 'check_in' || s === 'checkin' || s === 'in_progress') return BOOKING_STATUS.CHECKIN;
  if (s === 'confirmed') return BOOKING_STATUS.CONFIRMED;
  if (s === 'cancelled' || s === 'canceled') return BOOKING_STATUS.CANCELLED;
  if (s === 'completed') return BOOKING_STATUS.COMPLETED;
  return s;
};

export const canCancelBooking = (status) => {
  const s = normalizeStatus(status);
  return s === BOOKING_STATUS.CONFIRMED || s === BOOKING_STATUS.PENDING;
};

export const canCheckIn = (status) => {
  const s = normalizeStatus(status);
  return s === BOOKING_STATUS.CONFIRMED;
};

export const canCheckOut = (status) => {
  const s = normalizeStatus(status);
  return s === BOOKING_STATUS.CHECKIN || s === BOOKING_STATUS.IN_PROGRESS;
};

export const canEdit = (status) => {
  const s = normalizeStatus(status);
  return s !== BOOKING_STATUS.CANCELLED && s !== BOOKING_STATUS.COMPLETED;
};

/**
 * Index bookings by therapist for O(1) lookup
 */
export const indexBookingsByTherapist = (bookings) => {
  return bookings.reduce((acc, booking) => {
    const therapistId = booking.therapist_id || booking.therapist?.id;
    if (!therapistId) return acc;
    if (!acc[therapistId]) acc[therapistId] = [];
    acc[therapistId].push(booking);
    return acc;
  }, {});
};

/**
 * Generate mock bookings for performance testing (2000 bookings, 200 therapists)
 */
export const generateMockBookings = (therapists, date, count = 2000) => {
  const bookings = [];
  const statuses = ['confirmed', 'check_in', 'cancelled', 'completed'];
  const services = ['Swedish Massage', 'Deep Tissue', 'Hot Stone', 'Facial', 'Aromatherapy'];

  for (let i = 0; i < count; i++) {
    const therapist = therapists[i % therapists.length];
    const startHour = 9 + Math.floor(Math.random() * 10);
    const startMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
    const endMin = startMin + duration;
    const endHour = startHour + Math.floor(endMin / 60);

    bookings.push({
      id: `mock-${i}`,
      therapist_id: therapist?.therapist_id || therapist?.id,
      therapist: therapist,
      client_name: `Client ${i + 1}`,
      service_name: services[i % services.length],
      status: statuses[i % statuses.length],
      start_time: `${date}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`,
      end_time: `${date}T${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`,
      duration_minutes: duration,
      room: `Room ${(i % 10) + 1}`,
    });
  }

  return bookings;
};
