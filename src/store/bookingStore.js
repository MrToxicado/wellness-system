import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as bookingApi from '../api/bookingApi';
import { normalizeStatus, indexBookingsByTherapist } from '../utils/bookingUtils';
import logger from '../utils/logger';

const useBookingStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    bookings: [],
    bookingsById: {},           // Map<id, booking> for O(1) access
    bookingsByTherapist: {},    // Map<therapistId, booking[]> for calendar
    selectedBooking: null,
    isLoading: false,
    isSaving: false,
    error: null,
    selectedDate: new Date().toISOString().split('T')[0],
    searchQuery: '',
    statusFilter: 'all',

    // Selectors (derived)
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
      const { selectedDate } = get();
      set({ isLoading: true, error: null });
      try {
        const data = await bookingApi.fetchBookings({ date: selectedDate, ...params });
        // Response: { data: { success, data: { list: { bookings: [...] } }, message } }
        const list = data?.data?.data?.list;
        const bookingsRaw = list?.bookings ?? list?.booking ?? data?.data?.data?.data ?? data?.data?.data ?? [];
        const rawList = Array.isArray(bookingsRaw) ? bookingsRaw : Object.values(bookingsRaw);
        // Normalize: booking_item is { "CustomerName": [...items] }, flatten for calendar
        // Filter out cancelled bookings so they don't appear on the calendar
        const bookings = rawList.filter(b => {
          const s = (b.status || '').toLowerCase();
          return s !== 'cancelled' && s !== 'canceled';
        }).map(b => {
          const itemGroups = b.booking_item ?? {};
          const item = Object.values(itemGroups).flat()[0] ?? {};
          // service_at: "2026-03-26 09:45:00" → ISO "2026-03-26T09:45:00"
          const startISO = item.service_at ? item.service_at.replace(' ', 'T') : '';
          let endISO = '';
          if (startISO && item.duration) {
            const d = new Date(startISO);
            d.setMinutes(d.getMinutes() + Number(item.duration));
            endISO = d.toISOString();
          } else if (startISO && item.end_time) {
            endISO = `${startISO.substring(0, 10)}T${item.end_time}`;
          }
          const roomItem = item.room_items?.[0];
          return {
            ...b,
            therapist_id: item.therapist_id ?? b.therapist_id,
            service_id: item.service_id ?? b.service_id,
            // Rooms are always assigned by the system (mandatory in spa); use room_items[0]
            room_item_id: roomItem?.room_id || null,
            room_id: b.room_id,
            client_name: b.customer_name ?? b.client_name ?? '',
            service_name: item.service ?? item.service_name ?? b.service_name ?? '',
            start_time: startISO,
            end_time: endISO,
            duration_minutes: item.duration ?? b.duration_minutes,
            // requested_person in booking_item maps to our requested_therapist flag
            requested_therapist: item.requested_person === 1 || item.requested_person === '1' || !!b.requested_therapist,
          };
        });
        const indexes = get()._rebuildIndexes(bookings);
        set({ bookings, ...indexes, isLoading: false });
        logger.info('Bookings fetched', { count: bookings.length });
      } catch (error) {
        logger.error('Failed to fetch bookings', error);
        if (error.status === 401) {
          set({ isLoading: false });
        } else {
          set({ isLoading: false, error: error.message || 'Failed to load bookings' });
        }
      }
    },

    createBooking: async (payload) => {
      set({ isSaving: true, error: null });
      try {
        const data = await bookingApi.createBooking(payload);
        set({ isSaving: false });
        // Re-fetch to get the fully normalized booking from the server
        await get().fetchBookings();
        logger.bookingCreated(data);
        return { success: true };
      } catch (error) {
        logger.error('Failed to create booking', error);
        set({ isSaving: false, error: error.message || 'Failed to create booking' });
        return { success: false, error: error.message };
      }
    },

    updateBooking: async (id, payload) => {
      set({ isSaving: true, error: null });
      try {
        // Merge existing booking data so partial payloads (e.g. drag-drop) still satisfy API requirements
        const existing = get().bookingsById[id] ?? {};
        const itemGroups = existing.booking_item ?? {};
        const existingItem = Object.values(itemGroups).flat()[0] ?? {};
        const fullPayload = {
          customer: existing.user_id || existing.customer,
          updated_by: existing.updated_by || existing.created_by,
          service_id: existing.service_id,
          booking_item_id: existingItem.id,
          room_item_id: existing.room_item_id,
          room_id: existing.room_id,
          duration_minutes: existing.duration_minutes,
          notes: existing.notes || existing.note || '',
          source: existing.source || 'Walk-in',
          requested_therapist: existing.requested_therapist,
          ...payload,
        };
        await bookingApi.updateBooking(id, fullPayload);
        // Immediately patch the local booking so calendar re-indexes correctly
        set((state) => {
          const bookings = state.bookings.map(b => {
            if (b.id !== id) return b;
            return {
              ...b,
              therapist_id: payload.therapist_id ?? b.therapist_id,
              service_id: payload.service_id ?? b.service_id,
              // Use 'in' check so explicitly-cleared fields (null) override, but absent keys (drag-drop) keep old value
              room_id: 'room_id' in payload ? payload.room_id : b.room_id,
              room_item_id: 'room_item_id' in payload ? payload.room_item_id : b.room_item_id,
              start_time: payload.start_time ?? b.start_time,
              end_time: payload.end_time ?? b.end_time,
              duration_minutes: payload.duration_minutes ?? b.duration_minutes,
              notes: payload.notes ?? b.notes,
              source: payload.source ?? b.source,
              requested_therapist: payload.requested_therapist ?? b.requested_therapist,
            };
          });
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false };
        });
        logger.bookingUpdated(id, payload);
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message || 'Failed to update booking' });
        logger.error('Failed to update booking', error);
        return { success: false, error: error.message };
      }
    },

    cancelBooking: async (id, bookingItemId, reason = '') => {
      set({ isSaving: true, error: null });
      try {
        await bookingApi.cancelBooking({
          booking_id: id,
          id,
          booking_item_id: bookingItemId,
          reason,
          cancel_reason: reason,
        });

        set((state) => {
          const bookings = state.bookings.filter(b => b.id !== id);
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false, selectedBooking: null };
        });

        logger.bookingCancelled(id);
        return { success: true };
      } catch (error) {
        logger.error('Failed to cancel booking', error);
        set({ isSaving: false, error: error.message || 'Failed to cancel booking' });
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
        logger.error('Failed to delete booking', error);
        set({ isSaving: false, error: error.message || 'Failed to delete booking' });
        return { success: false, error: error.message };
      }
    },

    checkIn: async (id) => {
      set({ isSaving: true });
      try {
        await bookingApi.checkInBooking(id);
        set((state) => {
          const bookings = state.bookings.map(b =>
            b.id === id ? { ...b, status: 'check_in' } : b
          );
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false };
        });
        logger.bookingCheckedIn(id);
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message });
        return { success: false, error: error.message };
      }
    },

    checkOut: async (id) => {
      set({ isSaving: true });
      try {
        await bookingApi.checkOutBooking(id);
        set((state) => {
          const bookings = state.bookings.map(b =>
            b.id === id ? { ...b, status: 'completed' } : b
          );
          return { bookings, ...state._rebuildIndexes(bookings), isSaving: false };
        });
        return { success: true };
      } catch (error) {
        set({ isSaving: false, error: error.message });
        return { success: false, error: error.message };
      }
    },

    // UI state
    setSelectedBooking: (booking) => set({ selectedBooking: booking }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setStatusFilter: (filter) => set({ statusFilter: filter }),
    clearError: () => set({ error: null }),

    // Add booking locally (for optimistic updates / mock data)
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
