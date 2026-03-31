import apiClient from './client';

export const fetchTherapists = async (params = {}) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await apiClient.get('/therapists', {
    params: {
      availability: 1,
      outlet: 1,
      service_at: today,
      status: 1,
      pagination: 0,
      panel: 'outlet',
      outlet_type: 2,
      leave: 0,
      ...params,
    },
  });
  return response.data;
};

export const fetchTherapistById = async (id) => {
  const response = await apiClient.get(`/therapists/${id}`);
  return response.data;
};

export const fetchServices = async (params = {}) => {
  const response = await apiClient.get('/service-category', {
    params: {
      outlet_type: 2,
      outlet: 1,
      pagination: 0,
      panel: 'outlet',
      ...params,
    },
  });
  return response.data;
};

export const fetchRooms = async (params = {}) => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const today = `${dd}-${mm}-${yyyy}`; // d-m-Y format required
  const response = await apiClient.get('/room-bookings/outlet/1', {
    params: {
      date: today,
      panel: 'outlet',
      duration: 60,
      ...params,
    },
  });
  return response.data;
};

export const fetchClients = async (params = {}) => {
  const response = await apiClient.get('/users', {
    params: {
      pagination: 1,
      ...params,
    },
  });
  return response.data;
};

export const createClient = async (payload) => {
  const response = await apiClient.post('/users/create', payload);
  return response.data;
};
