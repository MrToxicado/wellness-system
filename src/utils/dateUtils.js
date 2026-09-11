import { format, parseISO, addMinutes, differenceInMinutes, startOfDay, isToday, isSameDay } from 'date-fns';
import { CALENDAR_START_HOUR, SLOT_INTERVAL, TIME_SLOT_HEIGHT } from '../constants';

export const formatISOLocal = (d) => {
  if (!d) return '';
  const str = typeof d === 'string' ? d.replace(' ', 'T') : '';
  const dt = typeof d === 'string' ? parseISO(str) : d;
  if (isNaN(dt.getTime())) return typeof d === 'string' ? d : '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  const ss = String(dt.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
};

export const formatDate = (date, fmt = 'yyyy-MM-dd') => {
  try {
    if (!date) return '';
    const str = String(date).replace(' ', 'T');
    if (str.length >= 10 && fmt === 'yyyy-MM-dd') return str.substring(0, 10);
    const d = typeof date === 'string' ? parseISO(str) : date;
    return format(d, fmt);
  } catch {
    return '';
  }
};

export const formatTime = (date, fmt = 'HH:mm') => {
  try {
    if (!date) return '';
    const str = String(date).replace(' ', 'T');
    const timeMatch = str.match(/T(\d{2}):(\d{2})/);
    if (timeMatch && fmt === 'HH:mm') {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }
    const d = parseISO(str);
    return format(d, fmt);
  } catch {
    return '';
  }
};

export const formatDisplayTime = (date) => {
  try {
    if (!date) return '';
    const str = String(date).replace(' ', 'T');
    const timeMatch = str.match(/T(\d{2}):(\d{2})/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    const d = parseISO(str);
    return format(d, 'h:mm a');
  } catch {
    return '';
  }
};

/**
 * Convert a time string "HH:mm" to pixel offset from calendar start
 */
export const timeToPixels = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutesFromStart = (hours - CALENDAR_START_HOUR) * 60 + (minutes || 0);
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
    if (!startDateTime) return 0;
    const str = String(startDateTime).replace(' ', 'T');
    const timeMatch = str.match(/T(\d{2}):(\d{2})/);
    let hours, minutes;
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    } else {
      const d = parseISO(str);
      hours = d.getHours();
      minutes = d.getMinutes();
    }
    if (isNaN(hours) || isNaN(minutes)) return 0;
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
    if (!startDateTime || !endDateTime) return 60;
    const startStr = String(startDateTime).replace(' ', 'T');
    const endStr = String(endDateTime).replace(' ', 'T');
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    const durationMinutes = differenceInMinutes(end, start);
    return Math.max((durationMinutes / 60) * TIME_SLOT_HEIGHT, 20);
  } catch {
    return TIME_SLOT_HEIGHT;
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
    const start = typeof startDateTime === 'string' ? parseISO(startDateTime.replace(' ', 'T')) : startDateTime;
    const end = typeof endDateTime === 'string' ? parseISO(endDateTime.replace(' ', 'T')) : endDateTime;
    return differenceInMinutes(end, start);
  } catch {
    return 0;
  }
};

export const addDuration = (dateTimeStr, minutes) => {
  try {
    const str = String(dateTimeStr).replace(' ', 'T');
    const d = parseISO(str);
    return formatISOLocal(addMinutes(d, minutes));
  } catch {
    return dateTimeStr;
  }
};

export { isToday, isSameDay, startOfDay, parseISO, format };
