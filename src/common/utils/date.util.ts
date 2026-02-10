import { DateTime } from 'luxon';

/**
 * Date utilities using Luxon for consistent UTC handling
 * All dates are stored in UTC in the database
 */

/**
 * Get current date/time in UTC
 * @returns DateTime object in UTC
 */
export const nowUtc = (): DateTime => {
  return DateTime.utc();
};

/**
 * Get current date/time as JavaScript Date object (in UTC)
 * Use this when Prisma expects a Date object
 * @returns Date object
 */
export const nowUtcDate = (): Date => {
  return nowUtc().toJSDate();
};

/**
 * Parse ISO string to DateTime in UTC
 * @param isoString - ISO 8601 date string
 * @returns DateTime object in UTC
 */
export const parseIsoUtc = (isoString: string): DateTime => {
  return DateTime.fromISO(isoString, { zone: 'utc' });
};

/**
 * Parse ISO string to JavaScript Date (in UTC)
 * Use this when Prisma expects a Date object
 * @param isoString - ISO 8601 date string
 * @returns Date object
 */
export const parseIsoUtcDate = (isoString: string): Date => {
  return parseIsoUtc(isoString).toJSDate();
};

/**
 * Format Date or DateTime to localized string
 * @param date - Date or DateTime object (can be null/undefined)
 * @param locale - Locale string (default: 'es-GT')
 * @param format - Date format options
 * @returns Formatted date string, or empty string if date is null/undefined
 */
export const formatDate = (
  date: Date | DateTime | null | undefined,
  locale: string = 'es-GT',
  format: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
): string => {
  if (!date) return '';
  const dt = date instanceof Date ? DateTime.fromJSDate(date) : date;
  return dt.setLocale(locale).toLocaleString(format);
};

/**
 * Format Date or DateTime to localized date and time string
 * @param date - Date or DateTime object (can be null/undefined)
 * @param locale - Locale string (default: 'es-GT')
 * @returns Formatted date and time string, or empty string if date is null/undefined
 */
export const formatDateTime = (
  date: Date | DateTime | null | undefined,
  locale: string = 'es-GT',
): string => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get current day of week (0 = Sunday, 6 = Saturday)
 * Compatible with JavaScript's getDay()
 * @returns Day of week number
 */
export const getCurrentDayOfWeek = (): number => {
  const dt = nowUtc();
  // Luxon uses 1-7 (Monday-Sunday), convert to 0-6 (Sunday-Saturday)
  return dt.weekday === 7 ? 0 : dt.weekday;
};

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns true if date is in the future
 */
export const isFutureDate = (date: Date | DateTime | string): boolean => {
  let dt: DateTime;

  if (typeof date === 'string') {
    dt = parseIsoUtc(date);
  } else if (date instanceof Date) {
    dt = DateTime.fromJSDate(date, { zone: 'utc' });
  } else {
    dt = date;
  }

  return dt > nowUtc();
};

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns true if date is in the past
 */
export const isPastDate = (date: Date | DateTime | string): boolean => {
  let dt: DateTime;

  if (typeof date === 'string') {
    dt = parseIsoUtc(date);
  } else if (date instanceof Date) {
    dt = DateTime.fromJSDate(date, { zone: 'utc' });
  } else {
    dt = date;
  }

  // Set to start of day for comparison
  const startOfDay = nowUtc().startOf('day');
  return dt < startOfDay;
};

/**
 * Get start of day (00:00:00) for a given date in UTC
 * @param date - Date or DateTime object
 * @returns DateTime at start of day in UTC
 */
export const startOfDayUtc = (date: Date | DateTime): DateTime => {
  const dt = date instanceof Date ? DateTime.fromJSDate(date) : date;
  return dt.setZone('utc').startOf('day');
};

/**
 * Get end of day (23:59:59.999) for a given date in UTC
 * @param date - Date or DateTime object
 * @returns DateTime at end of day in UTC
 */
export const endOfDayUtc = (date: Date | DateTime): DateTime => {
  const dt = date instanceof Date ? DateTime.fromJSDate(date) : date;
  return dt.setZone('utc').endOf('day');
};

/**
 * Parse date string and return end of day as Date object
 * Useful for date range queries (e.g., "to" date should include entire day)
 * @param dateString - Date string in ISO format
 * @returns Date object at end of day
 */
export const parseEndOfDayUtc = (dateString: string): Date => {
  return endOfDayUtc(parseIsoUtc(dateString)).toJSDate();
};

/**
 * Parse date string and return start of day as Date object
 * Useful for date range queries (e.g., "from" date should start at beginning)
 * @param dateString - Date string in ISO format
 * @returns Date object at start of day
 */
export const parseStartOfDayUtc = (dateString: string): Date => {
  return startOfDayUtc(parseIsoUtc(dateString)).toJSDate();
};
