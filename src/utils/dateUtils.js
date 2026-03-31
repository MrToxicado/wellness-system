import { format, parseISO, addMinutes, differenceInMinutes, startOfDay, isToday, isSameDay } from 'date-fns';
import { CALENDAR_START_HOUR, SLOT_INTERVAL, TIME_SLOT_HEIGHT } from '../constants';

export const formatDate = (date, fmt = 'yyyy-MM-dd') => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return '';
  }
};

export const formatTime = (date, fmt = 'HH:mm') => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return '';
  }
};

export const formatDisplayTime = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'h:mm a');
  } catch {
    return '';
  }
};

/**
 * Convert a time string "HH:mm" to pixel offset from calendar start
 */
export const timeToPixels = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutesFromStart = (hours - CALENDAR_START_HOUR) * 60 + minutes;
  return (totalMinutesFromStart / 60) * TIME_SLOT_HEIGHT;
};

/**
 * Convert pixel position to time string "HH:mm"
 */
export const pixelsToTime = (pixels) => {
  const totalMinutes = (pixels / TIME_SLOT_HEIGHT) * 60;
  const snappedMinutes = Math.round(totalMinutes / SLOT_INTERVAL) * SLOT_INTERVAL;
  const hours = Math.floor(snappedMinutes / 60) + CALENDAR_START_HOUR;
  const mins = snappedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Get booking top position in pixels from start time
 */
export const getBookingTop = (startDateTime) => {
  try {
    const d = typeof startDateTime === 'string' ? parseISO(startDateTime) : startDateTime;
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const totalMinutesFromStart = (hours - CALENDAR_START_HOUR) * 60 + minutes;
    return (totalMinutesFromStart / 60) * TIME_SLOT_HEIGHT;
  } catch {
    return 0;
  }
};

/**
 * Get booking height in pixels from duration
 */
export const getBookingHeight = (startDateTime, endDateTime) => {
  try {
    const start = typeof startDateTime === 'string' ? parseISO(startDateTime) : startDateTime;
    const end = typeof endDateTime === 'string' ? parseISO(endDateTime) : endDateTime;
    const durationMinutes = differenceInMinutes(end, start);
    return Math.max((durationMinutes / 60) * TIME_SLOT_HEIGHT, 20);
  } catch {
    return 30;
  }
};

/**
 * Generate time slots for calendar header
 */
export const generateTimeSlots = (startHour = CALENDAR_START_HOUR, endHour = 22) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL) {
      slots.push({
        hour: h,
        minute: m,
        label: m === 0 ? format(new Date(2000, 0, 1, h, m), 'h:mm a') : `${String(m).padStart(2, '0')}`,
        isHour: m === 0,
        totalMinutes: h * 60 + m,
      });
    }
  }
  return slots;
};

/**
 * Build a datetime string from date + time string
 */
export const buildDateTime = (dateStr, timeStr) => {
  return `${dateStr}T${timeStr}:00`;
};

export const getDurationMinutes = (startDateTime, endDateTime) => {
  try {
    const start = typeof startDateTime === 'string' ? parseISO(startDateTime) : startDateTime;
    const end = typeof endDateTime === 'string' ? parseISO(endDateTime) : endDateTime;
    return differenceInMinutes(end, start);
  } catch {
    return 0;
  }
};

export const addDuration = (dateTimeStr, minutes) => {
  try {
    const d = typeof dateTimeStr === 'string' ? parseISO(dateTimeStr) : dateTimeStr;
    return format(addMinutes(d, minutes), "yyyy-MM-dd'T'HH:mm:ss");
  } catch {
    return dateTimeStr;
  }
};

export { isToday, isSameDay, startOfDay, parseISO, format };
