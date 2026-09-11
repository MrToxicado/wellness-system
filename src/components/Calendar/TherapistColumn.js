import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import BookingBlock from './BookingBlock';
import {
  THERAPIST_COLUMN_WIDTH,
  TIME_SLOT_HEIGHT,
  TOTAL_HOURS,
  CALENDAR_START_HOUR,
  SLOT_INTERVAL,
} from '../../constants';
import styles from './TherapistColumn.module.css';

const TOTAL_HEIGHT = TOTAL_HOURS * TIME_SLOT_HEIGHT;

const TherapistColumn = memo(({ therapist, bookings = [], onBookingClick, onSlotClick, columnIndex }) => {
  if (!therapist) return null;
  const gender = (therapist.gender || '').toLowerCase();
  const avatarColor = gender === 'male' ? '#3B82F6' : '#EC4899';

  const tid = therapist.therapist_id || therapist.id;
  const { setNodeRef, isOver } = useDroppable({
    id: `therapist-${tid}`,
    data: { therapistId: tid },
  });

  const handleColumnClick = (e) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const totalMinutesFromStart = (clickY / TIME_SLOT_HEIGHT) * 60;
    const snappedMinutes = Math.round(totalMinutesFromStart / SLOT_INTERVAL) * SLOT_INTERVAL;
    const hours = Math.floor(snappedMinutes / 60) + CALENDAR_START_HOUR;
    const mins = snappedMinutes % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    onSlotClick?.(therapist, timeStr);
  };

  return (
    <div className={styles.column} style={{ width: `${THERAPIST_COLUMN_WIDTH}px` }}>
      {/* Therapist header */}
      <div className={styles.header}>
        {/* Numbered avatar */}
        <div className={styles.avatar} style={{ background: avatarColor }}>
          {columnIndex || '?'}
        </div>
        {/* Name + gender stacked */}
        <div className={styles.nameStack}>
          <div className={styles.therapistName}>
            {therapist.alias || therapist.name}
          </div>
          <div className={styles.therapistGender}>
            {gender === 'male' ? 'Male' : 'Female'}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        onClick={handleColumnClick}
        className={styles.dropZone}
        style={{
          height: `${TOTAL_HEIGHT}px`,
          background: isOver ? 'rgba(59,130,246,0.04)' : '#FAFAFA',
        }}
      >
        {/* Hour lines */}
        {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
          <div key={i} className={styles.hourLine} style={{
            top: `${i * TIME_SLOT_HEIGHT}px`,
            borderTop: i === 0 ? 'none' : '1px solid #E5E7EB',
          }} />
        ))}
        {/* Half-hour dashed lines */}
        {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
          <div key={`h-${i}`} className={styles.halfHourLine} style={{
            top: `${i * TIME_SLOT_HEIGHT + TIME_SLOT_HEIGHT / 2}px`,
          }} />
        ))}

        {bookings.map(booking => (
          <BookingBlock key={booking.id} booking={booking} onClick={onBookingClick} />
        ))}
      </div>
    </div>
  );
});

TherapistColumn.displayName = 'TherapistColumn';
export default TherapistColumn;
