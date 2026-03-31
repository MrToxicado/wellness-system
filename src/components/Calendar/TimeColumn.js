import React, { memo } from 'react';
import { TIME_SLOT_HEIGHT, TOTAL_HOURS, CALENDAR_START_HOUR } from '../../constants';
import styles from './TimeColumn.module.css';

const TIME_COL_WIDTH = 80;

const TimeColumn = memo(() => {
  return (
    <div className={styles.container}>
      {/* Header cell */}
      <div className={styles.header}>
        <span className={styles.headerLabel}>Time</span>
      </div>

      {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
        const hour = CALENDAR_START_HOUR + i;
        const isPM = hour >= 12;
        const displayHour = hour > 12 ? hour - 12 : hour;
        const label = `${String(displayHour).padStart(2, '0')}:00 ${isPM ? 'PM' : 'AM'}`;
        return (
          <div key={hour} className={styles.slot} style={{ height: `${TIME_SLOT_HEIGHT}px` }}>
            <span className={styles.slotLabel}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

TimeColumn.displayName = 'TimeColumn';
export default TimeColumn;
