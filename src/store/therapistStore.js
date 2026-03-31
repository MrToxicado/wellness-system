import { create } from 'zustand';
import * as therapistApi from '../api/therapistApi';
import logger from '../utils/logger';

// All endpoints return: { data: { success, data: { list: { KEY: [...] } }, message } }
function extractList(data, extraKeys = []) {
  // The "list" wrapper is at data.data.data.list or data.data.list
  const listWrapper = data?.data?.data?.list ?? data?.data?.list ?? data?.list;

  for (const key of extraKeys) {
    // Check inside list wrapper first
    const fromList = listWrapper?.[key];
    if (fromList != null) return Array.isArray(fromList) ? fromList : Object.values(fromList);
    // Also check without wrapper
    const direct = data?.data?.data?.[key] ?? data?.data?.[key] ?? data?.[key];
    if (direct != null) return Array.isArray(direct) ? direct : Object.values(direct);
  }
  // Fallback: find first array in candidates
  const candidates = [data, data?.data, data?.data?.data, data?.data?.data?.data];
  return candidates.find(c => Array.isArray(c)) ?? [];
}

const useTherapistStore = create((set) => ({
  therapists: [],
  therapistsById: {},
  services: [],
  rooms: [],
  clients: [],
  isLoading: false,
  error: null,

  fetchTherapists: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await therapistApi.fetchTherapists(params);
      const therapists = extractList(data, ['staffs']);
      const therapistsById = therapists.reduce((acc, t) => {
        acc[t.therapist_id || t.id] = t;
        return acc;
      }, {});
      set({ therapists, therapistsById, isLoading: false });
      return therapists;
    } catch (error) {
      logger.error('Failed to fetch therapists', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  fetchServices: async (params = {}) => {
    try {
      const data = await therapistApi.fetchServices(params);
      // categories → flat list of services: [{ id, name, category_name, price_rate }]
      const categories = extractList(data, ['category']);
      const services = categories.flatMap(cat =>
        (cat.services || []).map(s => ({
          ...s,
          category_name: cat.name,
        }))
      );
      set({ services });
      return services;
    } catch (error) {
      logger.error('Failed to fetch services', error);
      return [];
    }
  },

  fetchRooms: async (params = {}) => {
    try {
      const data = await therapistApi.fetchRooms(params);
      const rooms = extractList(data, ['rooms', 'room_bookings', 'room', 'data', 'list']);
      set({ rooms });
      return rooms;
    } catch (error) {
      logger.error('Failed to fetch rooms', error);
      return [];
    }
  },

  fetchClients: async (params = {}) => {
    try {
      const data = await therapistApi.fetchClients(params);
      const clients = extractList(data, ['users', 'clients', 'data']);
      set({ clients });
      return clients;
    } catch (error) {
      logger.error('Failed to fetch clients', error);
      return [];
    }
  },

  searchClients: async (query) => {
    try {
      const data = await therapistApi.fetchClients({ search: query });
      return extractList(data, ['users', 'clients']);
    } catch (error) {
      return [];
    }
  },

  createClient: async (payload) => {
    try {
      const data = await therapistApi.createClient(payload);
      const client = data?.data?.data || data?.data || data;
      set((state) => ({ clients: [...state.clients, client] }));
      return { success: true, client };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  loadMockTherapists: (mockTherapists) => {
    const therapistsById = mockTherapists.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
    set({ therapists: mockTherapists, therapistsById });
  },
}));

export default useTherapistStore;
