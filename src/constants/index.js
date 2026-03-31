export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CHECKIN: 'check_in',
  IN_PROGRESS: 'in_progress',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  PENDING: 'pending',
};

export const BOOKING_STATUS_COLORS = {
  confirmed: {
    bg: '#DBEAFE',
    border: '#3B82F6',
    text: '#1D4ED8',
    badge: '#3B82F6',
  },
  check_in: {
    bg: '#FCE7F3',
    border: '#EC4899',
    text: '#BE185D',
    badge: '#EC4899',
  },
  in_progress: {
    bg: '#FCE7F3',
    border: '#EC4899',
    text: '#BE185D',
    badge: '#EC4899',
  },
  cancelled: {
    bg: '#F3F4F6',
    border: '#9CA3AF',
    text: '#6B7280',
    badge: '#9CA3AF',
  },
  completed: {
    bg: '#D1FAE5',
    border: '#10B981',
    text: '#065F46',
    badge: '#10B981',
  },
  pending: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
    badge: '#F59E0B',
  },
};

export const THERAPIST_GENDER_COLORS = {
  female: '#EC4899',
  male: '#3B82F6',
  Female: '#EC4899',
  Male: '#3B82F6',
};

export const TIME_SLOT_HEIGHT = 60; // px per hour
export const SLOT_INTERVAL = 15;   // minutes
export const SLOTS_PER_HOUR = 60 / SLOT_INTERVAL; // 4 slots

export const CALENDAR_START_HOUR = 9;
export const CALENDAR_END_HOUR = 22; // eslint-disable-line no-unused-vars
export const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
export const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR;

export const THERAPIST_COLUMN_WIDTH = 160; // px
export const TIME_COLUMN_WIDTH = 60;       // px
