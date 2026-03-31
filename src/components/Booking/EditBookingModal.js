import React, { useCallback, useState, useEffect } from 'react';
import useBookingStore from '../../store/bookingStore';
import useTherapistStore from '../../store/therapistStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { formatDate, formatTime, buildDateTime } from '../../utils/dateUtils';
import logger from '../../utils/logger';
import sharedStyles from '../../styles/shared.module.css';
import styles from './EditBookingModal.module.css';
import createStyles from './CreateBookingModal.module.css';

const EditBookingModal = () => {
  const selectedBooking = useBookingStore(s => s.selectedBooking);
  const updateBooking = useBookingStore(s => s.updateBooking);
  const setSelectedBooking = useBookingStore(s => s.setSelectedBooking);
  const isSaving = useBookingStore(s => s.isSaving);

  const therapists = useTherapistStore(s => s.therapists);
  // eslint-disable-next-line no-unused-vars
  const services = useTherapistStore(s => s.services);
  const rooms = useTherapistStore(s => s.rooms);

  const currentUser = useAuthStore(s => s.user);
  const isOpen = useUIStore(s => s.isEditModalOpen);
  const close = useUIStore(s => s.closeEditModal);
  const showSuccess = useUIStore(s => s.showSuccess);
  const showError = useUIStore(s => s.showError);

  const [form, setForm] = useState({
    therapist_id: '',
    service_id: '',
    date: '',
    start_time: '',
    duration: 60,
    room_id: '',
    source: '',
    notes: '',
    requested_therapist: false,
  });

  useEffect(() => {
    if (selectedBooking && isOpen) {
      setForm({
        therapist_id: selectedBooking.therapist_id || '',
        service_id: selectedBooking.service_id || selectedBooking.services?.[0]?.id || '',
        date: formatDate(selectedBooking.start_time),
        start_time: formatTime(selectedBooking.start_time),
        duration: selectedBooking.duration_minutes || 60,
        room_id: (() => {
          // Try direct room_id match first
          if (selectedBooking.room_id) {
            const direct = rooms.find(r => (r.room_id || r.id) === selectedBooking.room_id);
            if (direct) return selectedBooking.room_id;
          }
          // room_item_id is the bed/item id — find the parent room
          const itemId = selectedBooking.room_item_id || selectedBooking.room_id;
          if (itemId) {
            const parent = rooms.find(r => r.items?.some(i => i.item_id === itemId));
            if (parent) return parent.room_id || parent.id;
          }
          return selectedBooking.room?.id || '';
        })(),
        source: selectedBooking.source || '',
        notes: selectedBooking.notes || '',
        requested_therapist: !!selectedBooking.requested_therapist,
      });
    }
  }, [selectedBooking, isOpen]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = useCallback(async () => {
    if (!selectedBooking) return;
    if (!form.therapist_id) { showError('Please select a therapist'); return; }

    const start = buildDateTime(form.date, form.start_time);
    const endDate = new Date(start);
    endDate.setMinutes(endDate.getMinutes() + Number(form.duration));
    const end = endDate.toISOString();

    // Extract the existing booking_item id so the API knows which item to update
    const itemGroups = selectedBooking.booking_item ?? {};
    const existingItem = Object.values(itemGroups).flat()[0] ?? {};

    const payload = {
      customer: selectedBooking.user_id || selectedBooking.customer,
      updated_by: currentUser?.id,
      therapist_id: Number(form.therapist_id),
      service_id: form.service_id ? Number(form.service_id) : (selectedBooking.service_id || undefined),
      booking_item_id: existingItem.id,
      room_id: form.room_id ? Number(form.room_id) : null,
      room_item_id: form.room_id
        ? rooms.find(r => (r.room_id || r.id) === Number(form.room_id))?.items?.[0]?.item_id ?? null
        : null,
      start_time: start,
      end_time: end,
      duration_minutes: Number(form.duration),
      notes: form.notes,
      source: form.source,
      requested_therapist: form.requested_therapist,
    };

    logger.userAction('edit_booking', { id: selectedBooking.id, ...payload });
    const bookingId = selectedBooking.id;
    const result = await updateBooking(bookingId, payload);
    if (result.success) {
      showSuccess('Booking updated successfully');
      // Patch selectedBooking so BookingPanel reflects changes immediately
      const therapist = therapists.find(t => (t.therapist_id || t.id) === Number(form.therapist_id));
      setSelectedBooking({
        ...selectedBooking,
        therapist_id: Number(form.therapist_id),
        therapist: therapist || selectedBooking.therapist,
        service_id: payload.service_id,
        room_id: payload.room_id,
        room_item_id: payload.room_item_id,
        start_time: payload.start_time,
        end_time: payload.end_time,
        duration_minutes: Number(form.duration),
        notes: form.notes,
        source: form.source,
        requested_therapist: form.requested_therapist,
      });
      close();
    } else {
      showError(result.error || 'Failed to update booking');
    }
  }, [form, selectedBooking, therapists, updateBooking, setSelectedBooking, close, showSuccess, showError]);

  if (!isOpen || !selectedBooking) return null;


  return (
    <>
      <div onClick={close} className={sharedStyles.overlay} />
      <div className={sharedStyles.panel}>
        {/* Header */}
        <div className={sharedStyles.panelHeader}>
          <span className={sharedStyles.panelTitle}>Update Booking</span>
          <button onClick={close} className={sharedStyles.btnCancel}>
            Cancel
          </button>
        </div>

        {/* Outlet info */}
        <div className={sharedStyles.formRow}>
          <input
            type="text"
            defaultValue="Liat Towers"
            readOnly
            className={`${sharedStyles.formInput} ${styles.outletInput}`}
          />
        </div>

        {/* Body */}
        <div className={sharedStyles.panelBody}>
          {/* Date + Time */}
          <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formRow2Col}>
              <div>
                <label className={sharedStyles.formLabel}>On</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={sharedStyles.formInput} />
              </div>
              <div>
                <label className={sharedStyles.formLabel}>At</label>
                <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={sharedStyles.formInput} />
              </div>
            </div>
          </div>

          {/* Client info (read-only) */}
          <div className={sharedStyles.formRow}>
            <div className={createStyles.clientRow}>
              <div className={createStyles.clientAvatarLg}>
                {(selectedBooking.client_name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <div className={createStyles.clientName}>{selectedBooking.client_name}</div>
                <div className={createStyles.clientPhone}>{selectedBooking.client?.phone || ''}</div>
              </div>
            </div>
          </div>

          {/* Service name */}
          <div className={sharedStyles.formRow}>
            <label className={sharedStyles.formLabel}>Service</label>
            <input
              type="text"
              value={selectedBooking.service_name || selectedBooking.services?.[0]?.name || ''}
              readOnly
              className={`${sharedStyles.formInput} ${sharedStyles.formInputReadonly}`}
            />
          </div>

          {/* Therapist */}
          <div className={sharedStyles.formRow}>
            <label className={sharedStyles.formLabel}>Therapist</label>
            <select value={form.therapist_id} onChange={e => set('therapist_id', e.target.value)} className={sharedStyles.formInput}>
              <option value="">Select therapist</option>
              {therapists.map(t => {
                const tid = t.therapist_id || t.id;
                return <option key={tid} value={tid}>{t.alias || t.name}</option>;
              })}
            </select>
            <div className={styles.reqCheckRow}>
              <input type="checkbox" id="req-t-edit" checked={form.requested_therapist} onChange={e => set('requested_therapist', e.target.checked)} className={styles.reqCheckbox} />
              <label htmlFor="req-t-edit" className={styles.reqCheckLabel}>Requested Therapist</label>
            </div>
          </div>

          {/* Duration */}
          <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formRow2Col}>
              <div>
                <label className={sharedStyles.formLabel}>Duration (min)</label>
                <select value={form.duration} onChange={e => set('duration', e.target.value)} className={sharedStyles.formInput}>
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label className={sharedStyles.formLabel}>Room</label>
                <select value={form.room_id} onChange={e => set('room_id', e.target.value)} className={sharedStyles.formInput}>
                  <option value="">Select room</option>
                  {rooms.map(r => <option key={r.room_id || r.id} value={r.room_id || r.id}>{r.room_name || r.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className={sharedStyles.formRow}>
            <label className={sharedStyles.formLabel}>Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} className={sharedStyles.formInput}>
              <option value="">Select source</option>
              {['Walk-in', 'By Phone', 'WhatsApp', 'Website'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className={sharedStyles.formRow}>
            <label className={sharedStyles.formLabel}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className={sharedStyles.formTextarea}
            />
          </div>
        </div>

        {/* Save button */}
        <div className={sharedStyles.panelFooter}>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={sharedStyles.btnPrimary}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditBookingModal;
