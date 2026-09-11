import React, { useState, useEffect } from 'react';
import { FormField, Input, Select, Textarea } from '../common/FormField';
import useTherapistStore from '../../store/therapistStore';
import useBookingStore from '../../store/bookingStore';
import { getTherapistColor } from '../../utils/bookingUtils';
import { formatISOLocal } from '../../utils/dateUtils';
import styles from './BookingForm.module.css';

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const defaultForm = {
  client_name: '',
  client_phone: '',
  client_email: '',
  therapist_id: '',
  service_id: '',
  room_id: '',
  date: '',
  start_time: '',
  duration_minutes: 60,
  notes: '',
  request_type: 'standard',
  requested_therapist: false,
};

const validateForm = (data) => {
  const errs = {};
  if (!data.client_name.trim()) errs.client_name = 'Client name is required';
  if (!data.therapist_id) errs.therapist_id = 'Please select a therapist';
  if (!data.date) errs.date = 'Date is required';
  if (!data.start_time) errs.start_time = 'Start time is required';
  if (!data.duration_minutes) errs.duration_minutes = 'Duration is required';
  return errs;
};

const BookingForm = ({ initialData, onSubmit, prefill }) => {
  const [form, setForm] = useState({ ...defaultForm, ...(prefill || {}) });
  const [errors, setErrors] = useState({});

  const therapists = useTherapistStore(s => s.therapists);
  const services = useTherapistStore(s => s.services);
  const rooms = useTherapistStore(s => s.rooms);
  const fetchServices = useTherapistStore(s => s.fetchServices);
  const fetchRooms = useTherapistStore(s => s.fetchRooms);
  const selectedDate = useBookingStore(s => s.selectedDate);

  useEffect(() => {
    fetchServices();
    fetchRooms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialData) {
      setForm({
        client_name: initialData.client_name || initialData.client?.name || '',
        client_phone: initialData.client?.phone || '',
        client_email: initialData.client?.email || '',
        therapist_id: initialData.therapist_id || initialData.therapist?.id || '',
        service_id: initialData.service_id || initialData.services?.[0]?.id || '',
        room_id: initialData.room_id || initialData.room?.id || '',
        date: initialData.start_time ? initialData.start_time.split('T')[0] : selectedDate,
        start_time: initialData.start_time ? initialData.start_time.split('T')[1]?.slice(0, 5) : '',
        duration_minutes: initialData.duration_minutes || 60,
        notes: initialData.notes || '',
        request_type: initialData.request_type || 'standard',
        requested_therapist: initialData.requested_therapist || false,
      });
    } else if (!initialData) {
      setForm(prev => ({ ...prev, date: selectedDate }));
    }
  }, [initialData, selectedDate]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const startDateTime = `${form.date}T${form.start_time}:00`;
    const endDate = new Date(`${form.date}T${form.start_time}:00`);
    endDate.setMinutes(endDate.getMinutes() + Number(form.duration_minutes));
    const endDateTime = formatISOLocal(endDate);

    onSubmit({
      client_name: form.client_name,
      client_phone: form.client_phone,
      client_email: form.client_email,
      therapist_id: form.therapist_id,
      service_id: form.service_id || undefined,
      room_id: form.room_id || undefined,
      start_time: startDateTime,
      end_time: endDateTime,
      duration_minutes: Number(form.duration_minutes),
      notes: form.notes,
      request_type: form.request_type,
      requested_therapist: form.requested_therapist,
    });
  };

  const selectedTherapist = therapists.find(t => String(t.id) === String(form.therapist_id));

  return (
    <form onSubmit={handleSubmit} id="booking-form">
      {/* Client Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Client Information</h4>
        <FormField label="Client Name" required error={errors.client_name}>
          <Input
            value={form.client_name}
            onChange={e => set('client_name', e.target.value)}
            placeholder="Full name"
            error={errors.client_name}
          />
        </FormField>
        <div className={styles.grid2}>
          <FormField label="Phone">
            <Input
              value={form.client_phone}
              onChange={e => set('client_phone', e.target.value)}
              placeholder="+1 234 567 8900"
              type="tel"
            />
          </FormField>
          <FormField label="Email">
            <Input
              value={form.client_email}
              onChange={e => set('client_email', e.target.value)}
              placeholder="email@example.com"
              type="email"
            />
          </FormField>
        </div>
      </div>

      {/* Booking Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Booking Details</h4>

        {/* Therapist */}
        <FormField label="Therapist" required error={errors.therapist_id}>
          <Select
            value={form.therapist_id}
            onChange={e => set('therapist_id', e.target.value)}
            error={errors.therapist_id}
          >
            <option value="">Select therapist...</option>
            {therapists.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.gender || 'N/A'})
              </option>
            ))}
          </Select>
          {selectedTherapist && (
            <div className={styles.therapistPreview}>
              <div
                className={styles.therapistPreviewAvatar}
                style={{ background: getTherapistColor(selectedTherapist.gender) }}
              >
                {selectedTherapist.name[0]}
              </div>
              <span className={styles.therapistPreviewText}>
                {selectedTherapist.gender} • {selectedTherapist.specialization || 'General'}
              </span>
            </div>
          )}
        </FormField>

        {/* Service */}
        <FormField label="Service">
          <Select value={form.service_id} onChange={e => set('service_id', e.target.value)}>
            <option value="">Select service...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.duration ? `(${s.duration} min)` : ''}</option>
            ))}
          </Select>
        </FormField>

        {/* Date & Time */}
        <div className={styles.grid2}>
          <FormField label="Date" required error={errors.date}>
            <Input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              error={errors.date}
            />
          </FormField>
          <FormField label="Start Time" required error={errors.start_time}>
            <Input
              type="time"
              value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
              step="900"
              error={errors.start_time}
            />
          </FormField>
        </div>

        {/* Duration */}
        <FormField label="Duration" required error={errors.duration_minutes}>
          <Select
            value={form.duration_minutes}
            onChange={e => set('duration_minutes', e.target.value)}
            error={errors.duration_minutes}
          >
            {DURATION_OPTIONS.map(d => (
              <option key={d} value={d}>{d} minutes{d === 60 ? ' (1 hour)' : d === 120 ? ' (2 hours)' : ''}</option>
            ))}
          </Select>
        </FormField>

        {/* Room */}
        <div className={styles.grid2}>
          <FormField label="Room">
            <Select value={form.room_id} onChange={e => set('room_id', e.target.value)}>
              <option value="">Select room...</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Request Type">
            <Select value={form.request_type} onChange={e => set('request_type', e.target.value)}>
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
              <option value="couple">Couple</option>
              <option value="group">Group</option>
            </Select>
          </FormField>
        </div>

        {/* Requested Therapist */}
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="requested_therapist"
            checked={form.requested_therapist}
            onChange={e => set('requested_therapist', e.target.checked)}
            className={styles.checkboxInput}
          />
          <label htmlFor="requested_therapist" className={styles.checkboxLabel}>
            Client specifically requested this therapist
          </label>
        </div>
      </div>

      {/* Notes */}
      <FormField label="Notes">
        <Textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Special requests, preferences, health notes..."
          rows={3}
        />
      </FormField>
    </form>
  );
};

export default BookingForm;
