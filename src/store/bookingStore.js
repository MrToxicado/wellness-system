import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { normalizeStatus, indexBookingsByTherapist } from '../utils/bookingUtils';
import { generateSampleBookings, MOCK_SERVICES, MOCK_CLIENTS } from '../data/mockData';
import logger from '../utils/logger';

const todayStr = new Date().toISOString().split('T')[0];

// Load persisted bookings from localStorage or generate defaults
const loadInitialBookings = () => {
  try {
    const saved = localStorage.getItem('wellness_bookings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    /* ignore */
  }
  return generateSampleBookings(todayStr);
};

const initialBookings = loadInitialBookings();

const saveBookingsToStorage = (bookings) => {
  try {
    localStorage.setItem('wellness_bookings', JSON.stringify(bookings));
  } catch (err) {
    /* ignore */
  }
};

const useBookingStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    bookings: initialBookings,
    bookingsById: initialBookings.reduce((acc, b) => { acc[b.id] = b; return acc; }, {}),
    bookingsByTherapist: indexBookingsByTherapist(initialBookings),
    selectedBooking: null,
    isLoading: false,
    isSaving: false,
    error: null,
    selectedDate: todayStr,
    searchQuery: '',
    statusFilter: 'all',

    // Selectors
    getBookingsForTherapist: (therapistId) => {
      return get().bookingsByTherapist[therapistId] || [];
    },

    getFilteredBookings: () => {
      const { bookings, searchQuery, statusFilter } = get();
      let filtered = bookings;

      if (statusFilter !== 'all') {
        filtered = filtered.filter(b => normalizeStatus(b.status) === statusFilter);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
          b.client_name?.toLowerCase().includes(q) ||
          b.therapist?.name?.toLowerCase().includes(q) ||
          b.service_name?.toLowerCase().includes(q) ||
          String(b.id).includes(q)
        );
      }

      return filtered;
    },

    // Rebuild indexes after bookings change
    _rebuildIndexes: (bookings) => {
      const bookingsById = bookings.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
      const bookingsByTherapist = indexBookingsByTherapist(bookings);
      saveBookingsToStorage(bookings);
      return { bookingsById, bookingsByTherapist };
    },

    // Actions
    fetchBookings: async (params = {}) => {
      const targetDate = params.date || get().selectedDate || todayStr;
      set({ isLoading: true, error: null, selectedDate: targetDate });

      let currentBookings = get().bookings;
      // If no bookings exist for the selected date, add sample bookings for that date
      const dateHasBookings = currentBookings.some(b => b.start_time?.startsWith(targetDate));
      if (!dateHasBookings) {
        const sampleForDate = generateSampleBookings(targetDate);
        currentBookings = [...currentBookings, ...sampleForDate];
      }

      const indexes = get()._rebuildIndexes(currentBookings);
      set({ bookings: currentBookings, ...indexes, isLoading: false });
      return currentBookings;
    },

    createBooking: async (payload) => {
      set({ isSaving: true, error: null });

      try {
        const id = Date.now();
        const items = payload.items || [];
        const primaryItem = items[0] || {};

        let clientName = payload.client_name || '';
        if (!clientName && payload.client_id) {
          const matchedClient = MOCK_CLIENTS.find(c => String(c.id) === String(payload.client_id));
          if (matchedClient) {
            clientName = `${matchedClient.name || ''} ${matchedClient.lastname || ''}`.trim();
          }
        }
        if (!clientName) clientName = 'Guest Client';

        const serviceId = primaryItem.service_id || payload.service_id;
        const matchedService = MOCK_SERVICES.find(s => String(s.id) === String(serviceId));
        const serviceName = matchedService?.name || payload.service_name || 'Spa Massage';

        const therapistId = Number(primaryItem.therapist_id || payload.therapist_id || 1);
        const startTime = primaryItem.start_time || payload.start_time || `${get().selectedDate}T09:00:00`;
        const endTime = primaryItem.end_time || payload.end_time || `${get().selectedDate}T10:00:00`;
        const durationMinutes = Number(primaryItem.duration_minutes || payload.duration_minutes || 60);

        const newBooking = {
          id,
          therapist_id: therapistId,
          service_id: serviceId,
          room_id: primaryItem.room_id || payload.room_id || 1,
          client_name: clientName,
          service_name: serviceName,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          status: 'confirmed',
          requested_therapist: !!(primaryItem.requested_therapist || payload.requested_therapist),
          notes: payload.notes || '',
          source: payload.source || 'Walk-in',
        };

        const updatedBookings = [...get().bookings, newBooking];
        const indexes = get()._rebuildIndexes(updatedBookings);

        set({ bookings: updatedBookings, ...indexes, isSaving: false });
        logger.info('Booking created locally', newBooking);
        return { success: true, booking: newBooking };
      } catch (error) {
        set({ isSaving: false, error: error.message || 'Failed to create booking' });
        return { success: false, error: error.message };
      }
    },

    updateBooking: async (id, payload) => {
      set({ isSaving: true, error: null });
      try {
        const bookings = get().bookings.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            therapist_id: payload.therapist_id ? Number(payload.therapist_id) : b.therapist_id,
            service_id: payload.service_id ?? b.service_id,
            room_id: payload.room_id ?? b.room_id,
            start_time: payload.start_time ?? b.start_time,
            end_time: payload.end_time ?? b.end_time,
            duration_minutes: payload.duration_minutes ?? b.duration_minutes,
            notes: payload.notes ?? b.notes,
            source: payload.source ?? b.source,
            requested_therapist: payload.requested_therapist ?? b.requested_therapist,
            client_name: payload.client_name ?? b.client_name,
          };
        });
        const indexes = get()._rebuildIndexes(bookings);
        set({ bookings, ...indexes, isSaving: false });
        logger.info('Booking updated locally', { id, payload });
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message || 'Failed to update booking' });
        return { success: false, error: error.message };
      }
    },

    cancelBooking: async (id) => {
      set({ isSaving: true, error: null });
      try {
        const bookings = get().bookings.filter((b) => b.id !== id);
        const indexes = get()._rebuildIndexes(bookings);
        set({ bookings, ...indexes, isSaving: false, selectedBooking: null });
        logger.info('Booking cancelled locally', id);
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message || 'Failed to cancel booking' });
        return { success: false, error: error.message };
      }
    },

    deleteBooking: async (id) => {
      set({ isSaving: true, error: null });
      try {
        const bookings = get().bookings.filter((b) => b.id !== id);
        const indexes = get()._rebuildIndexes(bookings);
        set({ bookings, ...indexes, isSaving: false, selectedBooking: null });
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message || 'Failed to delete booking' });
        return { success: false, error: error.message };
      }
    },

    checkIn: async (id) => {
      set({ isSaving: true });
      const bookings = get().bookings.map((b) =>
        b.id === id ? { ...b, status: 'check_in' } : b
      );
      const indexes = get()._rebuildIndexes(bookings);
      set({ bookings, ...indexes, isSaving: false });
      return { success: true };
    },

    checkOut: async (id) => {
      set({ isSaving: true });
      const bookings = get().bookings.map((b) =>
        b.id === id ? { ...b, status: 'completed' } : b
      );
      const indexes = get()._rebuildIndexes(bookings);
      set({ bookings, ...indexes, isSaving: false });
      return { success: true };
    },

    // UI state
    setSelectedBooking: (booking) => set({ selectedBooking: booking }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setStatusFilter: (filter) => set({ statusFilter: filter }),
    clearError: () => set({ error: null }),

    addBookingLocally: (booking) => {
      set((state) => {
        const bookings = [...state.bookings, booking];
        return { bookings, ...state._rebuildIndexes(bookings) };
      });
    },

    loadMockData: (mockBookings) => {
      const indexes = get()._rebuildIndexes(mockBookings);
      set({ bookings: mockBookings, ...indexes });
    },
  }))
);

export default useBookingStore;
