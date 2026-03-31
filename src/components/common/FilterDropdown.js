import React, { useState } from 'react';
import styles from './FilterDropdown.module.css';

const BOOKING_STATUSES = [
  { key: 'confirmed',    label: 'Confirmed',           dotColor: '#93C5FD', defaultOn: true },
  { key: 'unconfirmed',  label: 'Unconfirmed',         dotColor: '#FED7AA', defaultOn: true },
  { key: 'check_in',     label: 'Checked In',          dotColor: '#F9A8D4', defaultOn: true },
  { key: 'completed',    label: 'Completed',           dotColor: '#D1D5DB', defaultOn: true },
  { key: 'cancelled',    label: 'Cancelled',           dotColor: '#93C5FD', defaultOn: false },
  { key: 'no_show',      label: 'No Show',             dotColor: '#93C5FD', defaultOn: false },
  { key: 'holding',      label: 'Holding',             dotColor: '#FDE68A', defaultOn: true },
  { key: 'in_progress',  label: 'Check-in (In Progress)', dotColor: '#F9A8D4', defaultOn: true },
];

const FilterDropdown = ({ onClose }) => {
  const [group, setGroup] = useState('all');
  const [statuses, setStatuses] = useState(
    Object.fromEntries(BOOKING_STATUSES.map(s => [s.key, s.defaultOn]))
  );
  const [selectAllTherapists, setSelectAllTherapists] = useState(true);
  const [therapistSearch, setTherapistSearch] = useState('');

  const toggleStatus = (key) => setStatuses(prev => ({ ...prev, [key]: !prev[key] }));

  const SectionTitle = ({ children }) => (
    <div className={styles.sectionTitle}>{children}</div>
  );

  const GroupOption = ({ value, label }) => (
    <div
      onClick={() => setGroup(value)}
      className={styles.groupOption}
    >
      <span className={`${styles.groupOptionText} ${group === value ? styles.groupOptionTextActive : ''}`}>{label}</span>
      {group === value && <div className={styles.groupDot} />}
    </div>
  );

  return (
    <>
      <div onClick={onClose} className={styles.backdrop} />
      <div className={styles.dropdown}>
        {/* Show by group */}
        <SectionTitle>Show by group (Person who is on duty)</SectionTitle>
        <GroupOption value="all" label="All Therapist" />
        <GroupOption value="male" label="Male" />
        <GroupOption value="female" label="Female" />

        <div className={styles.divider} />

        {/* Resources */}
        <SectionTitle>Resources</SectionTitle>
        {['Rooms', 'Sofa', 'Monkey Chair'].map(r => (
          <div key={r} className={styles.resourceItem}>{r}</div>
        ))}

        <div className={styles.divider} />

        {/* Booking Status */}
        <SectionTitle>Booking Status</SectionTitle>
        <div className={styles.statusGrid}>
          {BOOKING_STATUSES.map(s => (
            <div
              key={s.key}
              onClick={() => toggleStatus(s.key)}
              className={styles.statusItem}
            >
              <div className={`${styles.checkbox} ${statuses[s.key] ? styles.checkboxChecked : ''}`}>
                {statuses[s.key] && <span className={styles.checkmark}>✓</span>}
              </div>
              <span className={styles.statusLabel}>{s.label}</span>
              <div className={styles.statusDot} style={{ background: s.dotColor }} />
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        {/* Select Therapist */}
        <div className={styles.therapistHeader}>
          <SectionTitle>Select Therapist</SectionTitle>
          <div className={styles.selectAllRow}>
            <span className={styles.selectAllText}>Select All</span>
            <div
              onClick={() => setSelectAllTherapists(!selectAllTherapists)}
              className={`${styles.checkbox} ${selectAllTherapists ? styles.checkboxChecked : ''}`}
            >
              {selectAllTherapists && <span className={styles.checkmark}>✓</span>}
            </div>
          </div>
        </div>
        <input
          type="text"
          value={therapistSearch}
          onChange={e => setTherapistSearch(e.target.value)}
          placeholder="Search by therapist"
          className={styles.therapistSearch}
        />

        {/* Clear filter */}
        <button
          onClick={onClose}
          className={styles.clearBtn}
        >
          Clear Filter (Return to Default)
        </button>
      </div>
    </>
  );
};

export default FilterDropdown;
