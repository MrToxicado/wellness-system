import React, { memo, useState } from 'react';
import useBookingStore from '../../store/bookingStore';
import useUIStore from '../../store/uiStore';
import useTherapistStore from '../../store/therapistStore';
import { normalizeStatus, canCancelBooking } from '../../utils/bookingUtils';
import { formatDisplayTime, formatDate } from '../../utils/dateUtils';
import sharedStyles from '../../styles/shared.module.css';
import styles from './BookingPanel.module.css';

const STATUS_CONFIG = {
  confirmed:   { dot: '#93C5FD', label: 'Confirmed',    btnLabel: 'Check-in',  btnStyle: 'dark' },
  check_in:    { dot: '#F9A8D4', label: 'Checked in',   btnLabel: 'Checkout',  btnStyle: 'dark' },
  in_progress: { dot: '#F9A8D4', label: 'Checked in',   btnLabel: 'Checkout',  btnStyle: 'dark' },
  completed:   { dot: '#6EE7B7', label: 'Completed',    btnLabel: 'View Sale', btnStyle: 'gray' },
  cancelled:   { dot: '#D1D5DB', label: 'Cancelled (Normal Cancellation)', btnLabel: null, btnStyle: null },
  pending:     { dot: '#FDE68A', label: 'Pending',      btnLabel: 'Check-in',  btnStyle: 'dark' },
};

const BookingPanel = memo(() => {
  const [showMenu, setShowMenu] = useState(false);
  const selectedBooking = useBookingStore(s => s.selectedBooking);
  const checkIn = useBookingStore(s => s.checkIn);
  const checkOut = useBookingStore(s => s.checkOut);
  const isSaving = useBookingStore(s => s.isSaving);

  const isPanelOpen = useUIStore(s => s.isPanelOpen);
  const closePanel = useUIStore(s => s.closePanel);
  const openEditModal = useUIStore(s => s.openEditModal);
  const openCancelModal = useUIStore(s => s.openCancelModal);
  const showSuccess = useUIStore(s => s.showSuccess);
  const showError = useUIStore(s => s.showError);

  const booking = selectedBooking;
  const therapistsById = useTherapistStore(s => s.therapistsById);

  if (!isPanelOpen || !booking) return null;

  const therapist = therapistsById[booking?.therapist_id] || booking?.therapist;
  const therapistName = therapist?.name || therapist?.alias || (booking?.therapist_id ? `Therapist #${booking.therapist_id}` : 'Unassigned');
  const status = normalizeStatus(booking?.status);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;

  const handleCheckIn = async () => {
    const r = await checkIn(booking.id);
    if (r.success) showSuccess('Checked in successfully');
    else showError(r.error || 'Check-in failed');
  };

  const handleCheckOut = async () => {
    const r = await checkOut(booking.id);
    if (r.success) showSuccess('Completed successfully');
    else showError(r.error || 'Checkout failed');
  };

  const clientName = booking.client_name || booking.client?.name || '—';
  const clientPhone = booking.client?.phone || booking.phone || '';
  const initials = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const services = booking.services?.length ? booking.services : (booking.service_name ? [{ name: booking.service_name }] : []);

  const DetailLabel = ({ children }) => (
    <span className={styles.detailLabel}>{children}</span>
  );

  return (
    <>
      {/* Click-away */}
      <div onClick={closePanel} className={styles.clickAway} />

      <div className={`${sharedStyles.panel} ${styles.panelElevated}`}>
        {/* Panel header */}
        <div className={sharedStyles.panelHeader}>
          <span className={sharedStyles.panelTitle}>Appointment</span>
          <div className={styles.headerIcons}>
            <div className={styles.menuWrapper}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={styles.menuBtn}
              >•••</button>
              {showMenu && (
                <div className={styles.menuDropdown}>
                  <button
                    onClick={() => { setShowMenu(false); openCancelModal(); }}
                    className={styles.menuItem}
                  >Cancel / Delete</button>
                </div>
              )}
            </div>
            <button
              onClick={() => { openEditModal(); }}
              className={styles.editBtn}
            >✏</button>
            <button
              onClick={closePanel}
              className={styles.closeBtn}
            >×</button>
          </div>
        </div>

        {/* Status + Action */}
        <div className={styles.statusRow}>
          <div className={styles.statusLeft}>
            <div className={styles.statusDot} style={{ background: cfg.dot }} />
            <span className={styles.statusLabel}>{cfg.label}</span>
          </div>
          {cfg.btnLabel && cfg.btnStyle === 'dark' && (
            <button
              onClick={status === 'confirmed' || status === 'pending' ? handleCheckIn : handleCheckOut}
              disabled={isSaving}
              className={styles.actionBtnDark}
            >{cfg.btnLabel}</button>
          )}
          {cfg.btnLabel && cfg.btnStyle === 'gray' && (
            <button className={styles.actionBtnGray}>{cfg.btnLabel}</button>
          )}
        </div>

        {/* Date/Time row */}
        <div className={styles.dateTimeRow}>
          <div className={styles.dateTimeCell}>
            <div className={styles.dateTimeLabel}>On</div>
            <div className={styles.dateTimeValue}>
              {formatDate(booking.start_time, 'EEE, MMM d')}
            </div>
          </div>
          <div className={styles.dateTimeDivider} />
          <div className={styles.dateTimeCell}>
            <div className={styles.dateTimeLabel}>At</div>
            <div className={styles.dateTimeValue}>
              {formatDisplayTime(booking.start_time)}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className={sharedStyles.panelBody}>
          {/* Client section */}
          <div className={styles.clientSection}>
            <div className={styles.clientRow}>
              {/* Avatar */}
              <div className={styles.clientAvatar}>
                {initials}
                <div className={styles.membershipBadge} />
              </div>
              <div className={styles.clientInfo}>
                <div className={styles.clientPhone}>
                  {clientPhone && `${clientPhone} `}
                  {booking.client?.member_id && <span className={styles.memberId}>(#{booking.client.member_id})</span>}
                </div>
                <div className={styles.clientNameText}>{clientName}</div>
                <div className={styles.clientSince}>
                  {booking.client?.since ? `Client since ${booking.client.since}` : 'Client'}
                </div>
                {clientPhone && <div className={styles.clientPhoneExtra}>Phone: {clientPhone}</div>}
              </div>
            </div>
            {/* Membership toggle */}
            <div className={styles.membershipRow}>
              <span className={styles.membershipLabel}>Apply membership discount:</span>
              <div className={styles.toggle}>
                <div className={styles.toggleThumb} />
              </div>
            </div>
          </div>

          {/* Services */}
          {services.map((svc, idx) => (
            <div key={idx} className={styles.serviceSection}>
              <div className={styles.serviceName}>
                {svc.name || 'Service'}
              </div>
              <div className={styles.serviceDetailRow}>
                <DetailLabel>With:</DetailLabel>
                {therapist && (
                  <div
                    className={styles.therapistAvatar}
                    style={{
                      background: (therapist.gender || '').toLowerCase() === 'male' ? '#3B82F6' : '#EC4899',
                    }}
                  >
                    {(therapist.name || '')[0]}
                  </div>
                )}
                <span className={styles.therapistName}>
                  {therapistName}
                </span>
                <span className={styles.requestedRow}>
                  <input type="checkbox" readOnly checked={!!booking.requested_therapist} className={styles.requestedCheckbox} />
                  <span className={styles.requestedLabel}>Requested Therapist</span>
                </span>
              </div>
              <div className={styles.durationRow}>
                <span className={styles.durationText}>
                  <DetailLabel>For:</DetailLabel>{booking.duration_minutes || svc.duration || '—'} min
                </span>
                <span className={styles.durationText}>
                  <DetailLabel>At:</DetailLabel>{formatDisplayTime(booking.start_time)}
                </span>
              </div>
              {(booking.room || svc.room) && (
                <div className={`${styles.durationText} ${styles.roomRow}`}>
                  <DetailLabel>Using:</DetailLabel>{booking.room?.name || booking.room || svc.room}
                </div>
              )}
              {(booking.request_type || svc.request) && (
                <div className={styles.durationText}>
                  <DetailLabel>Select request(s)</DetailLabel>{booking.request_type || svc.request}
                </div>
              )}
            </div>
          ))}

          {/* Notes */}
          {booking.notes && (
            <div className={styles.notesBox}>
              <p className={styles.notesText}>
                {booking.notes}
              </p>
            </div>
          )}

          {/* Booking Details */}
          <div className={styles.bookingDetailsSection}>
            <div className={styles.bookingDetailsTitle}>Booking Details</div>
            {[
              ['Booked on', booking.created_at ? formatDate(booking.created_at, 'EEE, MMM d') + ' at ' + formatDisplayTime(booking.created_at) : null],
              ['Booked by', booking.created_by || null],
              ['Updated on', booking.updated_at ? formatDate(booking.updated_at, 'EEE, MMM d') + ' at ' + formatDisplayTime(booking.updated_at) : null],
              ['Updated by', booking.updated_by || null],
              ['Cancelled on', booking.cancelled_at ? formatDate(booking.cancelled_at, 'EEE, MMM d') + ' at ' + formatDisplayTime(booking.cancelled_at) : null],
              ['Cancelled by', booking.cancelled_by || null],
              ['Source', booking.source || null],
            ].filter(([, val]) => val).map(([label, val]) => (
              <div key={label} className={styles.detailRow}>
                <span className={styles.detailKey}>{label}:</span>
                <span className={styles.detailVal}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});

BookingPanel.displayName = 'BookingPanel';
export default BookingPanel;
