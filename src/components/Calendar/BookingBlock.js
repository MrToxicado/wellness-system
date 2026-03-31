import React, { memo, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { getBookingTop, getBookingHeight } from '../../utils/dateUtils';
import { normalizeStatus } from '../../utils/bookingUtils';
import styles from './BookingBlock.module.css';

const STATUS_STYLES = {
  confirmed:    { bg: '#DBEAFE', leftBorder: '#3B82F6', textColor: '#1D4ED8', label: 'Confirmed' },
  check_in:     { bg: '#FBCFE8', leftBorder: '#EC4899', textColor: '#BE185D', label: 'Checked In' },
  in_progress:  { bg: '#FBCFE8', leftBorder: '#EC4899', textColor: '#BE185D', label: 'In Progress' },
  completed:    { bg: '#D1FAE5', leftBorder: '#10B981', textColor: '#065F46', label: 'Completed' },
  cancelled:    { bg: '#F3F4F6', leftBorder: '#9CA3AF', textColor: '#6B7280', label: 'Cancelled' },
  pending:      { bg: '#FEF3C7', leftBorder: '#F59E0B', textColor: '#92400E', label: 'Pending' },
};

// Small colored indicator dots shown at the bottom of each block
const INDICATOR_COLORS = ['#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

// Badge for T (requested therapist) and R (requested room)
const Badge = ({ label, color }) => (
  <div className={styles.badge} style={{ background: color }}>
    {label}
  </div>
);

const BookingBlock = memo(({ booking, onClick }) => {
  const status = normalizeStatus(booking.status);
  const style = STATUS_STYLES[status] || STATUS_STYLES.confirmed;

  const top = getBookingTop(booking.start_time);
  const height = getBookingHeight(booking.start_time, booking.end_time);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
    disabled: status === 'cancelled',
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDragging) onClick(booking);
  }, [booking, onClick, isDragging]);

  const isTiny = height < 28;
  const isSmall = height < 52;

  const serviceName = booking.service_name || booking.services?.[0]?.name || '';
  const phone = booking.client?.phone || booking.phone || '';
  const clientName = booking.client_name || booking.client?.name || '';
  const hasRequestedTherapist = !!booking.requested_therapist;
  const hasRoom = !!booking.room_item_id;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={styles.block}
      style={{
        top: `${top + 1}px`,
        height: `${Math.max(height - 2, 20)}px`,
        background: style.bg,
        borderLeft: `3px solid ${style.leftBorder}`,
        padding: isTiny ? '2px 4px' : '4px 6px',
        cursor: status === 'cancelled' ? 'default' : 'grab',
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {isTiny ? (
        <div className={styles.tinyRow}>
          {hasRequestedTherapist && <Badge label="T" color="#6366F1" />}
          {hasRoom && <Badge label="R" color="#0891B2" />}
          <span className={styles.tinyLabel} style={{ color: style.textColor }}>
            {clientName || serviceName}
          </span>
        </div>
      ) : (
        <>
          <div className={styles.contentTop}>
            {/* Service name row with T/R badges */}
            <div className={styles.serviceRow}>
              {hasRequestedTherapist && <Badge label="T" color="#6366F1" />}
              {hasRoom && <Badge label="R" color="#0891B2" />}
              {serviceName && (
                <div className={styles.serviceName} style={{ color: style.textColor }}>
                  {serviceName}
                </div>
              )}
            </div>
            {!isSmall && phone && (
              <div className={styles.phone}>
                {phone}
              </div>
            )}
            {!isSmall && clientName && (
              <div className={styles.clientName}>
                {clientName}
              </div>
            )}
            {isSmall && !isTiny && clientName && (
              <div className={styles.clientNameSmall}>
                {clientName}
              </div>
            )}
          </div>

          {/* Bottom indicator dots */}
          {!isSmall && (
            <div className={styles.indicators}>
              {INDICATOR_COLORS.slice(0, 4).map((color, i) => (
                <div key={i} className={styles.dot} style={{ background: color }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

BookingBlock.displayName = 'BookingBlock';
export default BookingBlock;
