import apiClient from './client';

export const fetchBookings = async (params = {}) => {
  const response = await apiClient.get('/bookings/outlet/booking/list', { params });
  return response.data;
};

export const fetchBookingById = async (id) => {
  const response = await apiClient.get('/bookings/outlet/booking/list');
  const bookings = response.data?.data?.data?.list?.bookings || [];
  return bookings.find(b => String(b.id) === String(id));
};

export const createBooking = async (payload) => {
  const response = await apiClient.post('/bookings/create', payload);
  return response.data;
};

export const updateBooking = async (id, payload) => {
  const response = await apiClient.post(`/bookings/${id}`, payload);
  return response.data;
};

export const cancelBooking = async (payload) => {
  const response = await apiClient.post('/bookings/item/cancel', payload);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await apiClient.delete(`/bookings/destroy/${id}`);
  return response.data;
};

export const checkInBooking = async (id) => {
  const response = await apiClient.post(`/bookings/${id}/check-in`);
  return response.data;
};

export const checkOutBooking = async (id) => {
  const response = await apiClient.post(`/bookings/${id}/check-out`);
  return response.data;
};
