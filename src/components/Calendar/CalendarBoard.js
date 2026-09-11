import React, { memo, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import TimeColumn from './TimeColumn';
import TherapistColumn from './TherapistColumn';
// BookingBlock is rendered inside TherapistColumn
import useBookingStore from '../../store/bookingStore';
import useUIStore from '../../store/uiStore';
import { parseISO, formatISOLocal } from '../../utils/dateUtils';
import {
  THERAPIST_COLUMN_WIDTH,
  TIME_SLOT_HEIGHT,
  TOTAL_HOURS,
} from '../../constants';
import styles from './CalendarBoard.module.css';

const TOTAL_HEIGHT = TOTAL_HOURS * TIME_SLOT_HEIGHT;

const CalendarBoard = memo(({ therapists, onBookingClick, onSlotClick }) => {
  const bookingsByTherapist = useBookingStore(s => s.bookingsByTherapist);
  const updateBooking = useBookingStore(s => s.updateBooking);
  // eslint-disable-next-line no-unused-vars
  const selectedDate = useBookingStore(s => s.selectedDate);
  const setDragging = useUIStore(s => s.setDragging);

  const containerRef = useRef(null);
  const [activeBooking, setActiveBooking] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Virtual columns for therapists (handles 200+ therapists)
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: therapists.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => THERAPIST_COLUMN_WIDTH,
    overscan: 3,
  });

  const virtualItems = columnVirtualizer.getVirtualItems();
  const totalWidth = columnVirtualizer.getTotalSize();

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const booking = active.data.current?.booking;
    setActiveBooking(booking);
    setDragging(true, active.id);
  }, [setDragging]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over, delta } = event;
    setActiveBooking(null);
    setDragging(false, null);

    if (!over) return;

    const booking = active.data.current?.booking;
    const targetTherapistId = over.data.current?.therapistId;
    if (!booking) return;

    // Calculate new time based on delta Y
    const minutesDelta = Math.round((delta.y / TIME_SLOT_HEIGHT) * 60 / 15) * 15;

    if (minutesDelta === 0 && (!targetTherapistId || targetTherapistId === booking.therapist_id)) {
      return;
    }

    const startStr = String(booking.start_time).replace(' ', 'T');
    const endStr = booking.end_time ? String(booking.end_time).replace(' ', 'T') : startStr;
    const startDate = parseISO(startStr);
    const endDate = parseISO(endStr);
    startDate.setMinutes(startDate.getMinutes() + minutesDelta);
    endDate.setMinutes(endDate.getMinutes() + minutesDelta);

    const newPayload = {
      start_time: formatISOLocal(startDate),
      end_time: formatISOLocal(endDate),
    };

    if (targetTherapistId && targetTherapistId !== booking.therapist_id) {
      newPayload.therapist_id = targetTherapistId;
    }

    await updateBooking(booking.id, newPayload);
  }, [updateBooking, setDragging]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.root}>
        {/* Sticky time column */}
        <TimeColumn />

        {/* Scrollable therapist columns */}
        <div
          ref={containerRef}
          className={styles.scrollContainer}
        >
          <div
            className={styles.innerGrid}
            style={{
              width: `${totalWidth}px`,
              minHeight: `${TOTAL_HEIGHT + 56}px`,
            }}
          >
            {/* Therapist columns (virtualized) */}
            <div className={styles.columnsRow}>
              {virtualItems.map((virtualColumn) => {
                const therapist = therapists[virtualColumn.index];
                if (!therapist) return null;
                const tid = therapist.therapist_id || therapist.id;
                const bookings = bookingsByTherapist[tid] || [];

                return (
                  <div
                    key={virtualColumn.key}
                    className={styles.virtualCol}
                    style={{
                      left: `${virtualColumn.start}px`,
                      width: `${virtualColumn.size}px`,
                    }}
                  >
                    <TherapistColumn
                      therapist={therapist}
                      bookings={bookings}
                      onBookingClick={onBookingClick}
                      onSlotClick={onSlotClick}
                      columnIndex={virtualColumn.index + 1}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeBooking && (
          <div
            className={styles.dragOverlay}
            style={{ width: `${THERAPIST_COLUMN_WIDTH - 8}px` }}
          >
            {activeBooking.client_name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
});

CalendarBoard.displayName = 'CalendarBoard';

export default CalendarBoard;
