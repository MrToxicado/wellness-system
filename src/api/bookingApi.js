import { generateSampleBookings } from '../data/mockData';

export const fetchBookings = async (params = {}) => {
  const date = params.date || new Date().toISOString().split('T')[0];
  return generateSampleBookings(date);
};

export const fetchBookingById = async (id) => {
  const bookings = generateSampleBookings();
  return bookings.find(b => String(b.id) === String(id));
};

export const createBooking = async (payload) => {
  return { success: true, id: Date.now(), payload };
};

export const updateBooking = async (id, payload) => {
  return { success: true, id, payload };
};

export const cancelBooking = async (payload) => {
  return { success: true, payload };
};

export const deleteBooking = async (id) => {
  return { success: true, id };
};

export const checkInBooking = async (id) => {
  return { success: true, id };
};

export const checkOutBooking = async (id) => {
  return { success: true, id };
};
