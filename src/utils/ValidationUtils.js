import {
  isValidDate,
  parseDateSafely,
  getNowInTimezone,
  SUPPORTED_TIMEZONES,
} from './DateTimeUtils';
import {isAfter, isBefore, startOfDay, endOfDay} from 'date-fns';

export const VALIDATION_ERRORS = {
  INVALID_DATE: 'INVALID_DATE',
  PAST_DATE: 'PAST_DATE',
  INVALID_TIME: 'INVALID_TIME',
  PAST_TIME: 'PAST_TIME',
  OUTSIDE_HOURS: 'OUTSIDE_HOURS',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  STORE_CLOSED: 'STORE_CLOSED',
  WEEKEND_BOOKING: 'WEEKEND_BOOKING',
  TOO_FAR_AHEAD: 'TOO_FAR_AHEAD',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
};

export const ERROR_MESSAGES = {
  [VALIDATION_ERRORS.INVALID_DATE]: 'Please select a valid date.',
  [VALIDATION_ERRORS.PAST_DATE]: 'Please select a future date.',
  [VALIDATION_ERRORS.INVALID_TIME]: 'Please select a valid time slot.',
  [VALIDATION_ERRORS.PAST_TIME]: 'Please select a future time slot.',
  [VALIDATION_ERRORS.OUTSIDE_HOURS]:
    'Please select a time within business hours.',
  [VALIDATION_ERRORS.SLOT_UNAVAILABLE]:
    'This time slot is no longer available.',
  [VALIDATION_ERRORS.STORE_CLOSED]: 'Store is closed on the selected date.',
  [VALIDATION_ERRORS.WEEKEND_BOOKING]: 'Weekend bookings are not available.',
  [VALIDATION_ERRORS.TOO_FAR_AHEAD]:
    'Bookings are limited to 30 days in advance.',
  [VALIDATION_ERRORS.REQUIRED_FIELD]: 'This field is required.',
  [VALIDATION_ERRORS.INVALID_FORMAT]: 'Please check the format and try again.',
};

/**
 * Validation result structure
 */
export const createValidationResult = (
  isValid,
  errorType = null,
  message = null,
) => ({
  isValid,
  errorType,
  message: message || (errorType ? ERROR_MESSAGES[errorType] : null),
});

/**
 * Validate appointment date
 */
export const validateAppointmentDate = (date, options = {}) => {
  const {
    timezone = SUPPORTED_TIMEZONES.NEW_YORK,
    maxDaysAhead = 30,
    allowWeekends = true,
  } = options;

  if (!date) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'Please select a date.',
    );
  }

  if (!isValidDate(date)) {
    return createValidationResult(false, VALIDATION_ERRORS.INVALID_DATE);
  }

  const parsedDate = parseDateSafely(date);
  const now = getNowInTimezone(timezone);
  const today = startOfDay(now);
  const selectedDay = startOfDay(parsedDate);

  if (isBefore(selectedDay, today)) {
    return createValidationResult(false, VALIDATION_ERRORS.PAST_DATE);
  }

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  if (isAfter(selectedDay, maxDate)) {
    return createValidationResult(false, VALIDATION_ERRORS.TOO_FAR_AHEAD);
  }

  if (!allowWeekends) {
    const dayOfWeek = parsedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return createValidationResult(false, VALIDATION_ERRORS.WEEKEND_BOOKING);
    }
  }

  return createValidationResult(true);
};

/**
 * Validate time slot
 */
export const validateTimeSlot = (timeSlot, date, options = {}) => {
  const {
    timezone = SUPPORTED_TIMEZONES.NEW_YORK,
    storeHours = null,
    bookedSlots = [],
  } = options;

  // Check if time slot is provided
  if (!timeSlot) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'Please select a time slot.',
    );
  }

  // Validate time format (HH:mm)
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(timeSlot)) {
    return createValidationResult(false, VALIDATION_ERRORS.INVALID_TIME);
  }

  const parsedDate = parseDateSafely(date);
  if (!parsedDate) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.INVALID_DATE,
      'Invalid date for time slot validation.',
    );
  }

  // Create full datetime for validation
  const [hour, minute] = timeSlot.split(':').map(Number);
  const appointmentDateTime = new Date(parsedDate);
  appointmentDateTime.setHours(hour, minute, 0, 0);

  const now = getNowInTimezone(timezone);

  // Check if time is in the past
  if (isBefore(appointmentDateTime, now)) {
    return createValidationResult(false, VALIDATION_ERRORS.PAST_TIME);
  }

  // Validate against store hours
  if (storeHours && storeHours.is_open) {
    const isWithinHours =
      timeSlot >= storeHours.start_time && timeSlot <= storeHours.end_time;
    if (!isWithinHours) {
      return createValidationResult(false, VALIDATION_ERRORS.OUTSIDE_HOURS);
    }
  } else if (storeHours && !storeHours.is_open) {
    return createValidationResult(false, VALIDATION_ERRORS.STORE_CLOSED);
  }

  // Check if slot is already booked
  if (bookedSlots.includes(timeSlot)) {
    return createValidationResult(false, VALIDATION_ERRORS.SLOT_UNAVAILABLE);
  }

  return createValidationResult(true);
};

/**
 * Validate complete appointment booking
 */
export const validateAppointmentBooking = (appointmentData, options = {}) => {
  const {
    timezone = SUPPORTED_TIMEZONES.NEW_YORK,
    storeHours = null,
    bookedSlots = [],
    maxDaysAhead = 30,
    allowWeekends = true,
  } = options;

  const {date, timeSlot, user} = appointmentData;

  // Validate user data
  if (!user || !user.uid) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'User authentication required.',
    );
  }

  // Validate date
  const dateValidation = validateAppointmentDate(date, {
    timezone,
    maxDaysAhead,
    allowWeekends,
  });

  if (!dateValidation.isValid) {
    return dateValidation;
  }

  // Validate time slot
  const timeValidation = validateTimeSlot(timeSlot, date, {
    timezone,
    storeHours,
    bookedSlots,
  });

  if (!timeValidation.isValid) {
    return timeValidation;
  }

  return createValidationResult(true);
};

/**
 * Validate business hours format
 */
export const validateBusinessHours = businessHours => {
  if (!businessHours || typeof businessHours !== 'object') {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.INVALID_FORMAT,
      'Invalid business hours format.',
    );
  }

  const {is_open, start_time, end_time} = businessHours;

  if (typeof is_open !== 'boolean') {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.INVALID_FORMAT,
      'Invalid business hours status.',
    );
  }

  if (is_open) {
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!start_time || !timePattern.test(start_time)) {
      return createValidationResult(
        false,
        VALIDATION_ERRORS.INVALID_FORMAT,
        'Invalid start time format.',
      );
    }

    if (!end_time || !timePattern.test(end_time)) {
      return createValidationResult(
        false,
        VALIDATION_ERRORS.INVALID_FORMAT,
        'Invalid end time format.',
      );
    }

    if (start_time >= end_time) {
      return createValidationResult(
        false,
        VALIDATION_ERRORS.INVALID_FORMAT,
        'Start time must be before end time.',
      );
    }
  }

  return createValidationResult(true);
};

/**
 * Validate user session
 */
export const validateUserSession = user => {
  if (!user) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'User session required.',
    );
  }

  if (!user.uid) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'User ID is required.',
    );
  }

  if (!user.email) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'User email is required.',
    );
  }

  return createValidationResult(true);
};

/**
 * Validate notification data
 */
export const validateNotificationData = notificationData => {
  const {title, body, date, timeSlot} = notificationData;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'Notification title is required.',
    );
  }

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.REQUIRED_FIELD,
      'Notification body is required.',
    );
  }

  if (date && !isValidDate(date)) {
    return createValidationResult(
      false,
      VALIDATION_ERRORS.INVALID_DATE,
      'Invalid notification date.',
    );
  }

  if (timeSlot) {
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(timeSlot)) {
      return createValidationResult(
        false,
        VALIDATION_ERRORS.INVALID_TIME,
        'Invalid notification time slot.',
      );
    }
  }

  return createValidationResult(true);
};

/**
 * Get validation summary for multiple validations
 */
export const getValidationSummary = validationResults => {
  const errors = validationResults.filter(result => !result.isValid);

  return {
    isValid: errors.length === 0,
    errorCount: errors.length,
    errors: errors.map(error => ({
      type: error.errorType,
      message: error.message,
    })),
    firstError: errors.length > 0 ? errors[0] : null,
  };
};
