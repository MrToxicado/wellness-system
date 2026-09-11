import apiClient from './client';

export const fetchTherapists = async (params = {}) => {
  const response = await apiClient.get('/therapists', { params });
  return response.data;
};

export const fetchTherapistById = async (id) => {
  const response = await apiClient.get('/therapists');
  const list = response.data?.data?.data?.list?.staffs || [];
  return list.find(t => String(t.id) === String(id) || String(t.therapist_id) === String(id));
};

export const fetchServices = async (params = {}) => {
  const response = await apiClient.get('/service-category', { params });
  return response.data;
};

export const fetchRooms = async (params = {}) => {
  const response = await apiClient.get('/room-bookings/outlet/1', { params });
  return response.data;
};

export const fetchClients = async (params = {}) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const createClient = async (payload) => {
  const response = await apiClient.post('/users/create', payload);
  return response.data;
};
