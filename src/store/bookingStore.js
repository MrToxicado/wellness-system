import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as bookingApi from '../api/bookingApi';
import { normalizeStatus, indexBookingsByTherapist } from '../utils/bookingUtils';
import { generateSampleBookings } from '../data/mockData';
import logger from '../utils/logger';

const todayStr = new Date().toISOString().split('T')[0];
const defaultInitial = generateSampleBookings(todayStr);

const useBookingStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    bookings: defaultInitial,
    bookingsById: defaultInitial.reduce((acc, b) => { acc[b.id] = b; return acc; }, {}),
    bookingsByTherapist: indexBookingsByTherapist(defaultInitial),
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
      return { bookingsById, bookingsByTherapist };
    },

    // Actions
    fetchBookings: async (params = {}) => {
      const targetDate = params.date || get().selectedDate || todayStr;
      set({ isLoading: true, error: null, selectedDate: targetDate });

      try {
        const data = await bookingApi.fetchBookings({ date: targetDate, ...params });
        const list = data?.data?.data?.list;
        const bookingsRaw = list?.bookings ?? list?.booking ?? data?.data?.data ?? [];
        const rawList = Array.isArray(bookingsRaw) ? bookingsRaw : Object.values(bookingsRaw);

        if (rawList && rawList.length > 0) {
          const bookings = rawList.filter(b => {
            const s = (b.status || '').toLowerCase();
            return s !== 'cancelled' && s !== 'canceled';
          }).map(b => {
            const itemGroups = b.booking_item ?? {};
            const item = Object.values(itemGroups).flat()[0] ?? {};
            const startISO = item.service_at ? item.service_at.replace(' ', 'T') : b.start_time || '';
            let endISO = b.end_time || '';
            if (startISO && item.duration) {
              const d = new Date(startISO);
              d.setMinutes(d.getMinutes() + Number(item.duration));
              endISO = d.toISOString();
            }
            const roomItem = item.room_items?.[0];
            return {
              ...b,
              therapist_id: item.therapist_id ?? b.therapist_id,
              service_id: item.service_id ?? b.service_id,
              room_item_id: roomItem?.room_id || b.room_id || 1,
              room_id: b.room_id || 1,
              client_name: b.customer_name ?? b.client_name ?? '',
              service_name: item.service ?? item.service_name ?? b.service_name ?? 'Spa Massage',
              start_time: startISO,
              end_time: endISO,
              duration_minutes: item.duration ?? b.duration_minutes ?? 60,
              requested_therapist: item.requested_person === 1 || item.requested_person === '1' || !!b.requested_therapist,
            };
          });

          const indexes = get()._rebuildIndexes(bookings);
          set({ bookings, ...indexes, isLoading: false });
          return bookings;
        }
      } catch (error) {
        logger.error('Failed to fetch bookings from Python server', error);
      }

      const indexes = get()._rebuildIndexes(get().bookings);
      set({ isLoading: false, ...indexes });
      return get().bookings;
    },

    createBooking: async (payload) => {
      set({ isSaving: true, error: null });
      try {
        await bookingApi.createBooking(payload);
        set({ isSaving: false });
        await get().fetchBookings();
        return { success: true };
      } catch (error) {
        logger.error('Failed to create booking on Python backend', error);
        set({ isSaving: false });
        return { success: false, error: error.message };
      }
    },

    updateBooking: async (id, payload) => {
      set({ isSaving: true, error: null });
      try {
        await bookingApi.updateBooking(id, payload);
        set((state) => {
          const bookings = state.bookings.map(b => {
            if (b.id !== id) return b;
            return {
              ...b,
              therapist_id: payload.therapist_id ?? b.therapist_id,
              service_id: payload.service_id ?? b.service_id,
              room_id: payload.room_id ?? b.room_id,
              start_time: payload.start_time ?? b.start_time,
              end_time: payload.end_time ?? b.end_time,
              duration_minutes: payload.duration_minutes ?? b.duration_minutes,
              notes: payload.notes ?? b.notes,
              source: payload.source ?? b.source,
            };
          });
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false };
        });
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message });
        return { success: false, error: error.message };
      }
    },

    cancelBooking: async (id) => {
      set({ isSaving: true, error: null });
      try {
        await bookingApi.cancelBooking({ booking_id: id, id });
        set((state) => {
          const bookings = state.bookings.filter(b => b.id !== id);
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false, selectedBooking: null };
        });
        return { success: true };
      } catch (error) {
        set({ isSaving: false });
        return { success: false, error: error.message };
      }
    },

    deleteBooking: async (id) => {
      set({ isSaving: true, error: null });
      try {
        await bookingApi.deleteBooking(id);
        set((state) => {
          const bookings = state.bookings.filter(b => b.id !== id);
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false, selectedBooking: null };
        });
        return { success: true };
      } catch (error) {
        set({ isSaving: false });
        return { success: false, error: error.message };
      }
    },

    checkIn: async (id) => {
      set({ isSaving: true });
      try {
        await bookingApi.checkInBooking(id);
        set((state) => {
          const bookings = state.bookings.map(b => b.id === id ? { ...b, status: 'check_in' } : b);
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false };
        });
        return { success: true };
      } catch (error) {
        set({ isSaving: false });
        return { success: false };
      }
    },

    checkOut: async (id) => {
      set({ isSaving: true });
      try {
        await bookingApi.checkOutBooking(id);
        set((state) => {
          const bookings = state.bookings.map(b => b.id === id ? { ...b, status: 'completed' } : b);
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false };
        });
        return { success: true };
      } catch (error) {
        set({ isSaving: false });
        return { success: false };
      }
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
