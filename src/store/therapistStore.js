import { create } from 'zustand';
import * as therapistApi from '../api/therapistApi';
import { MOCK_THERAPISTS, MOCK_SERVICES, MOCK_ROOMS, MOCK_CLIENTS } from '../data/mockData';
import logger from '../utils/logger';

function extractList(data, extraKeys = []) {
  const listWrapper = data?.data?.data?.list ?? data?.data?.list ?? data?.list;

  for (const key of extraKeys) {
    const fromList = listWrapper?.[key];
    if (fromList != null) return Array.isArray(fromList) ? fromList : Object.values(fromList);
    const direct = data?.data?.data?.[key] ?? data?.data?.[key] ?? data?.[key];
    if (direct != null) return Array.isArray(direct) ? direct : Object.values(direct);
  }
  const candidates = [data, data?.data, data?.data?.data, data?.data?.data?.data];
  return candidates.find(c => Array.isArray(c)) ?? [];
}

const defaultTherapistsById = MOCK_THERAPISTS.reduce((acc, t) => {
  acc[t.id] = t;
  acc[t.therapist_id] = t;
  return acc;
}, {});

const useTherapistStore = create((set, get) => ({
  therapists: MOCK_THERAPISTS,
  therapistsById: defaultTherapistsById,
  services: MOCK_SERVICES,
  rooms: MOCK_ROOMS,
  clients: MOCK_CLIENTS,
  isLoading: false,
  error: null,

  fetchTherapists: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await therapistApi.fetchTherapists(params);
      const therapists = extractList(data, ['staffs']);
      if (therapists && therapists.length > 0) {
        const therapistsById = therapists.reduce((acc, t) => {
          acc[t.therapist_id || t.id] = t;
          return acc;
        }, {});
        set({ therapists, therapistsById, isLoading: false });
        return therapists;
      }
    } catch (error) {
      logger.error('Failed to fetch therapists from Python backend', error);
    }
    set({ isLoading: false });
    return get().therapists;
  },

  fetchServices: async (params = {}) => {
    try {
      const data = await therapistApi.fetchServices(params);
      const categories = extractList(data, ['category']);
      if (categories && categories.length > 0) {
        const services = categories.flatMap(cat =>
          (cat.services || []).map(s => ({
            ...s,
            category_name: cat.name,
          }))
        );
        set({ services });
        return services;
      }
    } catch (error) {
      logger.error('Failed to fetch services from Python backend', error);
    }
    return get().services;
  },

  fetchRooms: async (params = {}) => {
    try {
      const data = await therapistApi.fetchRooms(params);
      const rooms = extractList(data, ['rooms']);
      if (rooms && rooms.length > 0) {
        set({ rooms });
        return rooms;
      }
    } catch (error) {
      logger.error('Failed to fetch rooms from Python backend', error);
    }
    return get().rooms;
  },

  fetchClients: async (params = {}) => {
    try {
      const data = await therapistApi.fetchClients(params);
      const clients = extractList(data, ['users']);
      if (clients && clients.length > 0) {
        set({ clients });
        return clients;
      }
    } catch (error) {
      logger.error('Failed to fetch clients from Python backend', error);
    }
    return get().clients;
  },

  searchClients: async (query = '') => {
    try {
      const data = await therapistApi.fetchClients({ search: query });
      const clients = extractList(data, ['users']);
      if (clients && clients.length > 0) return clients;
    } catch (error) {
      /* fallback */
    }
    const q = query.trim().toLowerCase();
    return get().clients.filter(c => `${c.name || ''} ${c.lastname || ''}`.toLowerCase().includes(q));
  },

  createClient: async (payload) => {
    try {
      const data = await therapistApi.createClient(payload);
      const client = data?.data?.data || data?.data || data;
      set((state) => ({ clients: [...state.clients, client] }));
      return { success: true, client };
    } catch (error) {
      const fallbackClient = { id: Date.now(), name: payload.name || 'Client', phone: payload.phone || '' };
      set((state) => ({ clients: [...state.clients, fallbackClient] }));
      return { success: true, client: fallbackClient };
    }
  },
}));

export default useTherapistStore;
