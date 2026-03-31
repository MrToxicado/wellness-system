import apiClient from './client';

export const fetchBookings = async (params = {}) => {
  const { date, ...rest } = params;
  // API expects DD-MM-YYYY / DD-MM-YYYY
  const d = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const [y, m, day] = d.split('-');
  const formatted = `${day}-${m}-${y}`;
  const daterange = `${formatted} / ${formatted}`;
  const response = await apiClient.get('/bookings/outlet/booking/list', {
    params: {
      pagination: 1,
      daterange,
      outlet: 1,
      panel: 'outlet',
      view_type: 'calendar',
      ...rest,
    },
  });
  return response.data;
};

export const fetchBookingById = async (id) => {
  const response = await apiClient.get(`/bookings/booking-details/${id}`);
  return response.data;
};

const toTimeStr = (isoOrDate) => {
  const dt = new Date(isoOrDate);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

const toServiceAt = (isoOrDate) => {
  const dt = new Date(isoOrDate);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy} ${toTimeStr(dt)}`;
};

export const createBooking = async (payload) => {
  const { customer, client_id, created_by, notes, source, client_name = '', items = [] } = payload;

  // Format items array for the API
  const formattedItems = items.map((item, idx) => {
    const startStr = toTimeStr(item.start_time);
    const endStr = toTimeStr(item.end_time);
    return {
      service: item.service_id || null,
      start_time: startStr,
      end_time: endStr,
      duration: item.duration_minutes || 60,
      therapist: item.therapist_id,
      requested_person: item.requested_therapist ? 1 : 0,
      price: '0.00',
      quantity: '1',
      service_request: '',
      commission: null,
      customer_name: client_name,
      primary: idx === 0 ? 1 : 0,
      item_number: idx + 1,
      ...(item.room_item_id ? {
        room_segments: [{
          room_id: item.room_item_id,
          item_type: 'single-bed',
          meta_service: null,
          start_time: startStr,
          end_time: endStr,
          duration: item.duration_minutes || 60,
          priority: 1,
        }],
      } : {}),
    };
  });

  const formData = new FormData();
  formData.append('company', '1');
  formData.append('outlet', '1');
  formData.append('outlet_type', '2');
  formData.append('booking_type', '1');
  formData.append('customer', customer || client_id || '');
  formData.append('created_by', created_by || '');
  formData.append('items', JSON.stringify(formattedItems));
  formData.append('currency', 'SGD');
  formData.append('source', source || 'Walk-in');
  formData.append('payment_type', 'payatstore');
  formData.append('service_at', items[0]?.start_time ? toServiceAt(items[0].start_time) : '');
  formData.append('note', notes || '');
  formData.append('membership', '0');
  formData.append('panel', 'outlet');
  formData.append('type', 'manual');

  const response = await apiClient.post('/bookings/create', formData);
  return response.data;
};

export const updateBooking = async (id, payload) => {
  const {
    customer, updated_by, therapist_id, service_id, booking_item_id, room_item_id,
    start_time, end_time, duration_minutes, notes, source,
    requested_therapist, price,
  } = payload;

  let service_at = '';
  if (start_time) {
    service_at = toServiceAt(start_time);
  }

  const endDt = end_time ? new Date(end_time) : null;
  const endStr = endDt ? toTimeStr(endDt) : '00:00';
  const startStr = start_time ? toTimeStr(new Date(start_time)) : '00:00';

  const items = JSON.stringify([{
    id: booking_item_id || undefined,
    service: service_id || null,
    start_time: startStr,
    end_time: endStr,
    duration: duration_minutes || 60,
    therapist: therapist_id,
    requested_person: requested_therapist ? 1 : 0,
    price: price || '0.00',
    quantity: '1',
    service_request: '',
    commission: null,
    primary: 1,
    item_number: 1,
    ...(room_item_id ? {
      room_segments: [{
        room_id: room_item_id,
        item_type: 'single-bed',
        meta_service: null,
        start_time: startStr,
        end_time: endStr,
        duration: duration_minutes || 60,
        priority: 1,
      }],
    } : {}),
  }]);

  const formData = new FormData();
  formData.append('company', '1');
  formData.append('outlet', '1');
  formData.append('outlet_type', '2');
  formData.append('booking_type', '1');
  formData.append('panel', 'outlet');
  formData.append('customer', customer || '');
  formData.append('updated_by', updated_by || '');
  formData.append('membership', '0');
  formData.append('items', items);
  formData.append('service_at', service_at);
  formData.append('note', notes || '');
  if (source) formData.append('source', source);

  const response = await apiClient.post(`/bookings/${id}`, formData);
  return response.data;
};

export const cancelBooking = async (payload) => {
  const formData = new FormData();
  formData.append('booking_id', payload.booking_id || '');
  formData.append('id', payload.id || payload.booking_id || '');
  if (payload.booking_item_id) formData.append('booking_item_id', payload.booking_item_id);
  if (payload.reason) formData.append('reason', payload.reason);
  if (payload.cancel_reason) formData.append('cancel_reason', payload.cancel_reason);
  formData.append('outlet', '1');
  formData.append('panel', 'outlet');
  const response = await apiClient.post('/bookings/item/cancel', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await apiClient.delete(`/bookings/destroy/${id}`);
  return response.data;
};

export const checkInBooking = async (id, payload = {}) => {
  const response = await apiClient.post(`/bookings/${id}/check-in`, payload);
  return response.data;
};

export const checkOutBooking = async (id, payload = {}) => {
  const response = await apiClient.post(`/bookings/${id}/check-out`, payload);
  return response.data;
};
