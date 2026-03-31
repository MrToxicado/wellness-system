import React, { useCallback, useEffect, useState } from 'react';
import useBookingStore from '../../store/bookingStore';
import useTherapistStore from '../../store/therapistStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { buildDateTime } from '../../utils/dateUtils';
import logger from '../../utils/logger';
import sharedStyles from '../../styles/shared.module.css';
import styles from './CreateBookingModal.module.css';

const DEFAULT_SERVICE = { therapist_id: '', service_id: '', duration: 60, room_id: '', requested_therapist: false };

const CreateBookingModal = () => {
  const createBooking = useBookingStore(s => s.createBooking);
  const isSaving = useBookingStore(s => s.isSaving);
  const selectedDate = useBookingStore(s => s.selectedDate);

  const therapists = useTherapistStore(s => s.therapists);
  const services = useTherapistStore(s => s.services);
  const rooms = useTherapistStore(s => s.rooms);
  const clients = useTherapistStore(s => s.clients);

  const currentUser = useAuthStore(s => s.user);
  const isOpen = useUIStore(s => s.isCreateModalOpen);
  const close = useUIStore(s => s.closeCreateModal);
  const prefill = useUIStore(s => s.createPrefill);
  const showSuccess = useUIStore(s => s.showSuccess);
  const showError = useUIStore(s => s.showError);

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState({
    date: selectedDate,
    start_time: '09:00',
    source: '',
    notes: '',
  });
  const [serviceRows, setServiceRows] = useState([{ ...DEFAULT_SERVICE }]);

  // Reset whenever the panel opens so prefill values are applied fresh
  useEffect(() => {
    if (isOpen) {
      setForm({
        date: prefill?.date || selectedDate,
        start_time: prefill?.start_time || '09:00',
        source: '',
        notes: '',
      });
      setServiceRows([{ ...DEFAULT_SERVICE, therapist_id: prefill?.therapist_id || '' }]);
      setSelectedClient(null);
      setClientSearch('');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredClients = clientSearch.length >= 2
    ? clients.filter(c => {
        const fullName = `${c.name || ''} ${c.lastname || ''}`.trim().toLowerCase();
        const phone = c.contact_number || c.phone || '';
        return fullName.includes(clientSearch.toLowerCase()) || phone.includes(clientSearch);
      }).slice(0, 8)
    : [];

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const setServiceField = (idx, key, val) =>
    setServiceRows(prev => prev.map((s, i) => i === idx ? { ...s, [key]: val } : s));

  const addService = () => setServiceRows(prev => [...prev, { ...DEFAULT_SERVICE }]);

  const removeService = (idx) => setServiceRows(prev => prev.filter((_, i) => i !== idx));

  // Compute the start time of each service row by chaining durations
  const computedStartTimes = (() => {
    const base = buildDateTime(form.date, form.start_time);
    let cursor = new Date(base);
    return serviceRows.map((svc) => {
      const start = new Date(cursor);
      cursor = new Date(cursor);
      cursor.setMinutes(cursor.getMinutes() + Number(svc.duration));
      return start;
    });
  })();

  const handleSubmit = useCallback(async () => {
    if (!selectedClient) {
      showError('Please search and select a client from the dropdown');
      return;
    }
    if (!form.start_time) { showError('Please select a start time'); return; }
    if (serviceRows.some(s => !s.therapist_id)) {
      showError('Please select a therapist for each service');
      return;
    }

    const items = serviceRows.map((svc, idx) => {
      const start = computedStartTimes[idx];
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + Number(svc.duration));
      return {
        therapist_id: Number(svc.therapist_id),
        service_id: svc.service_id ? Number(svc.service_id) : undefined,
        room_id: svc.room_id ? Number(svc.room_id) : undefined,
        room_item_id: svc.room_id
          ? rooms.find(r => (r.room_id || r.id) === Number(svc.room_id))?.items?.[0]?.item_id
          : undefined,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: Number(svc.duration),
        requested_therapist: svc.requested_therapist,
      };
    });

    const payload = {
      customer: selectedClient?.id,
      client_id: selectedClient?.id,
      client_name: `${selectedClient?.name || ''} ${selectedClient?.lastname || ''}`.trim() || selectedClient?.alias || '',
      created_by: currentUser?.id,
      notes: form.notes,
      source: form.source,
      items,
    };

    logger.userAction('create_booking', { clientId: selectedClient?.id, serviceCount: items.length });
    const result = await createBooking(payload);
    if (result.success) {
      showSuccess('Booking created successfully');
      close();
    } else {
      showError(result.error || 'Failed to create booking');
    }
  }, [form, serviceRows, selectedClient, computedStartTimes, rooms, createBooking, close, showSuccess, showError, currentUser]);

  if (!isOpen) return null;

  const formatTime = (date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <>
      <div onClick={close} className={sharedStyles.overlay} />
      <div className={sharedStyles.panel}>
        {/* Header */}
        <div className={sharedStyles.panelHeader}>
          <span className={sharedStyles.panelTitle}>New Booking</span>
          <button onClick={close} className={sharedStyles.btnCancel}>Cancel</button>
        </div>

        {/* Body */}
        <div className={sharedStyles.panelBody}>
          {/* Outlet */}
          <div className={styles.outletRow}>
            <span className={styles.outletLabel}>Outlet: </span>
            <span className={styles.outletName}>Liat Towers</span>
          </div>

          {/* Date + Time */}
          <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formRow2Col}>
              <div>
                <label className={sharedStyles.formLabel}>On</label>
                <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} className={sharedStyles.formInput} />
              </div>
              <div>
                <label className={sharedStyles.formLabel}>At</label>
                <input type="time" value={form.start_time} onChange={e => setField('start_time', e.target.value)} className={sharedStyles.formInput} />
              </div>
            </div>
          </div>

          {/* Client search */}
          <div className={`${sharedStyles.formRow} ${styles.searchWrapper}`}>
            {selectedClient ? (
              <div className={styles.clientRow}>
                <div className={styles.clientAvatarLg}>
                  {(selectedClient.name || '')[0]?.toUpperCase()}
                </div>
                <div>
                  <div className={styles.clientName}>{`${selectedClient.name || ''} ${selectedClient.lastname || ''}`.trim() || selectedClient.email}</div>
                  <div className={styles.clientPhone}>{selectedClient.contact_number || selectedClient.phone}</div>
                </div>
                <button onClick={() => setSelectedClient(null)} className={styles.clearClientBtn}>×</button>
              </div>
            ) : (
              <div className={styles.searchWrapper}>
                <div className={styles.searchInputRow}>
                  <div className={styles.searchField}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      placeholder="Search or create client"
                      className={`${sharedStyles.formInput} ${styles.searchInput}`}
                    />
                  </div>
                  <button className={styles.addBtn}>+</button>
                </div>
                {filteredClients.length > 0 && (
                  <div className={styles.clientDropdown}>
                    {filteredClients.map(c => (
                      <div
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                        className={styles.clientOption}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div className={styles.clientOptionName}>{`${c.name || ''} ${c.lastname || ''}`.trim() || c.email}</div>
                        <div className={styles.clientOptionPhone}>{c.contact_number || c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service rows */}
          {serviceRows.map((svc, idx) => (
            <div key={idx} className={styles.serviceSection}>
              <div className={styles.serviceHeader}>
                <span className={styles.serviceLabel}>
                  {serviceRows.length > 1 ? `Service ${idx + 1}` : 'Service'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {idx > 0 && (
                    <span className={styles.serviceStartTime}>
                      Starts {formatTime(computedStartTimes[idx])}
                    </span>
                  )}
                  {idx > 0 && (
                    <button onClick={() => removeService(idx)} className={styles.removeServiceBtn}>×</button>
                  )}
                </div>
              </div>

              {/* Therapist */}
              <div className={sharedStyles.formRow}>
                <label className={sharedStyles.formLabel}>Therapist</label>
                <select
                  value={svc.therapist_id}
                  onChange={e => setServiceField(idx, 'therapist_id', e.target.value)}
                  className={sharedStyles.formInput}
                >
                  <option value="">Select therapist</option>
                  {therapists.map(t => {
                    const tid = t.therapist_id || t.id;
                    return <option key={tid} value={tid}>{t.alias || t.name}</option>;
                  })}
                </select>
                <div className={styles.reqCheckRow}>
                  <input
                    type="checkbox"
                    id={`req-therapist-${idx}`}
                    checked={svc.requested_therapist}
                    onChange={e => setServiceField(idx, 'requested_therapist', e.target.checked)}
                    className={styles.reqCheckbox}
                  />
                  <label htmlFor={`req-therapist-${idx}`} className={styles.reqCheckLabel}>Requested Therapist</label>
                </div>
              </div>

              {/* Service + Duration */}
              <div className={sharedStyles.formRow}>
                <div className={sharedStyles.formRow2Col}>
                  <div className={styles.serviceField}>
                    <label className={sharedStyles.formLabel}>Service</label>
                    <select
                      value={svc.service_id}
                      onChange={e => setServiceField(idx, 'service_id', e.target.value)}
                      className={sharedStyles.formInput}
                    >
                      <option value="">Select service</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.durationField}>
                    <label className={sharedStyles.formLabel}>Duration (min)</label>
                    <select
                      value={svc.duration}
                      onChange={e => setServiceField(idx, 'duration', e.target.value)}
                      className={sharedStyles.formInput}
                    >
                      {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Room */}
              <div className={sharedStyles.formRow}>
                <label className={sharedStyles.formLabel}>Room</label>
                <select
                  value={svc.room_id}
                  onChange={e => setServiceField(idx, 'room_id', e.target.value)}
                  className={sharedStyles.formInput}
                >
                  <option value="">Select room</option>
                  {rooms.map(r => <option key={r.room_id || r.id} value={r.room_id || r.id}>{r.room_name || r.name}</option>)}
                </select>
              </div>
            </div>
          ))}

          {/* Source */}
          <div className={sharedStyles.formRow}>
            <label className={sharedStyles.formLabel}>Select Source</label>
            <select value={form.source} onChange={e => setField('source', e.target.value)} className={sharedStyles.formInput}>
              <option value="">Select source</option>
              {['Walk-in', 'By Phone', 'WhatsApp', 'Website'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className={sharedStyles.formRow}>
            <label className={sharedStyles.formLabel}>Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className={sharedStyles.formTextarea}
            />
          </div>

          {/* Add service / pax links */}
          <div className={styles.addLinks}>
            <button onClick={addService} className={styles.addLink}>
              ⊕ Add service
            </button>
            <button className={styles.addLink}>
              ⊕ Add pax
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={sharedStyles.panelFooter}>
          <button onClick={handleSubmit} disabled={isSaving} className={sharedStyles.btnPrimary}>
            {isSaving ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateBookingModal;
