import { create } from 'zustand';
import { MOCK_THERAPISTS, MOCK_SERVICES, MOCK_ROOMS, MOCK_CLIENTS } from '../data/mockData';
import logger from '../utils/logger';

const therapistsById = MOCK_THERAPISTS.reduce((acc, t) => {
  acc[t.id] = t;
  acc[t.therapist_id] = t;
  return acc;
}, {});

const useTherapistStore = create((set, get) => ({
  therapists: MOCK_THERAPISTS,
  therapistsById,
  services: MOCK_SERVICES,
  rooms: MOCK_ROOMS,
  clients: MOCK_CLIENTS,
  isLoading: false,
  error: null,

  fetchTherapists: async () => {
    return get().therapists;
  },

  fetchServices: async () => {
    return get().services;
  },

  fetchRooms: async () => {
    return get().rooms;
  },

  fetchClients: async () => {
    return get().clients;
  },

  searchClients: async (query = '') => {
    const q = query.trim().toLowerCase();
    if (!q) return get().clients;

    const currentClients = get().clients;
    const matches = currentClients.filter((c) => {
      const fullName = `${c.name || ''} ${c.lastname || ''}`.trim().toLowerCase();
      const phone = c.contact_number || c.phone || '';
      return fullName.includes(q) || phone.includes(q);
    });

    // If query typed (length >= 2) and no exact match found, dynamically include a generated client option
    if (q.length >= 2) {
      const autoCreatedClient = {
        id: Date.now(),
        name: query,
        lastname: '',
        contact_number: '+65 9123 9999',
        phone: '+65 9123 9999',
        email: `${q.replace(/\s+/g, '')}@example.com`,
      };
      return [...matches, autoCreatedClient];
    }

    return matches;
  },

  createClient: async (payload) => {
    const newClient = {
      id: Date.now(),
      name: payload.name || payload.first_name || 'Client',
      lastname: payload.lastname || payload.last_name || '',
      contact_number: payload.phone || payload.contact_number || '+65 9000 0000',
      phone: payload.phone || payload.contact_number || '+65 9000 0000',
      email: payload.email || 'client@example.com',
    };
    set((state) => ({ clients: [...state.clients, newClient] }));
    logger.info('Client created locally', newClient);
    return { success: true, client: newClient };
  },

  loadMockTherapists: (mockTherapists) => {
    const byId = mockTherapists.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});
    set({ therapists: mockTherapists, therapistsById: byId });
  },
}));

export default useTherapistStore;
