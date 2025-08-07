import {
  format,
  addDays,
  addMinutes,
  addHours,
  compareAsc,
  eachMinuteOfInterval,
  isAfter,
  isBefore,
  isToday,
  isTomorrow,
  parseISO,
  isValid,
  roundToNearestMinutes,
  setHours,
  setMinutes,
  startOfDay,
  formatDistanceToNow,
  getDay,
  getMonth,
  getDate,
  getHours,
  getMinutes,
} from 'date-fns';
import {enUS} from 'date-fns/locale';

// Time and date management system for appointment scheduling
// Comprehensive timezone handling and business logic utilities

// Application timezone constants
export const SUPPORTED_TIMEZONES = {
  NEW_YORK: 'America/New_York',
  COORDINATED_UNIVERSAL: 'UTC',
  USER_DEVICE: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const DISPLAY_FORMATS = {
  SHORT_DATE: 'MMM d, yyyy',
  NUMERIC_DATE: 'MM/dd/yyyy',
  COMPACT_DATE: 'MMM d',
  TWELVE_HOUR: 'h:mm a',
  TWENTY_FOUR_HOUR: 'HH:mm',
};

export const SLOT_INTERVALS = {
  QUARTER_HOUR: 15,
};

export const PREPARATION_TIME_DEFAULT = 15;

// Timezone-aware time retrieval utilities

// Retrieve current moment in specified timezone
export const getNowInTimezone = (
  targetTimezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  try {
    // Leverage browser/RN timezone API for accurate conversion
    const currentMoment = new Date();
    const timezoneString = currentMoment.toLocaleString('en-US', {
      timeZone: targetTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse timezone-converted string back to Date object
    const [dateSegment, timeSegment] = timezoneString.split(', ');
    const [month, day, year] = dateSegment.split('/');
    const [hour, minute, second] = timeSegment.split(':');

    const timezoneAdjustedDate = new Date(
      parseInt(year),
      parseInt(month) - 1, // Zero-indexed months
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
    );

    console.log('🕐 Timezone conversion details:', {
      targetTimezone,
      localTime: currentMoment.toLocaleString(),
      timezoneString,
      convertedTime: timezoneAdjustedDate.toLocaleString(),
      extractedHour: getHours(timezoneAdjustedDate),
    });

    return timezoneAdjustedDate;
  } catch (error) {
    console.error('Timezone conversion failed:', error);
    // Safe fallback to system time
    return new Date();
  }
};

// Apply specific time to a date object
export const applyTimeToDate = (
  baseDate,
  timeString,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  if (!baseDate || !timeString) return null;

  const [hours, minutes] = String(timeString).split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const adjustedDate = setHours(
    setMinutes(new Date(baseDate), hours === 24 ? 59 : minutes),
    hours === 24 ? 23 : hours,
  );

  return adjustedDate;
};

/**
 * Convert time string to structured time object
 */
export const deconstructTimeString = timeString => {
  if (!timeString) {
    return {hours: 0, minutes: 0};
  }

  const [hours = 0, minutes = 0] = String(timeString).split(':').map(Number);
  return {hours: Number(hours), minutes: Number(minutes)};
};

// Verify if current moment falls within operational hours
export const isWithinOperatingHours = (operationalSchedule, currentTime) => {
  if (
    !operationalSchedule?.start_time ||
    !operationalSchedule?.end_time ||
    !currentTime
  ) {
    return false;
  }

  const startTime = deconstructTimeString(operationalSchedule.start_time);
  const endTime = deconstructTimeString(operationalSchedule.end_time);
  const time =
    typeof currentTime === 'object' && currentTime.hours !== undefined
      ? currentTime
      : deconstructTimeString(
          format(new Date(), DISPLAY_FORMATS.TWENTY_FOUR_HOUR),
        );

  if (time.hours < startTime.hours || time.hours > endTime.hours) {
    return false;
  }

  if (time.hours === startTime.hours && time.minutes < startTime.minutes) {
    return false;
  }

  if (time.hours === endTime.hours && time.minutes > endTime.minutes) {
    return false;
  }

  return true;
};

// Date comparison and validation helpers

// Verify if date represents today in specified timezone
export const isCurrentDay = (date, timezone = SUPPORTED_TIMEZONES.NEW_YORK) => {
  if (!date) return false;

  const targetDate = parseDateSafely(date);
  return targetDate ? isToday(targetDate) : false;
};

// Verify if date represents tomorrow in specified timezone
export const isNextDay = (date, timezone = SUPPORTED_TIMEZONES.NEW_YORK) => {
  if (!date) return false;

  const targetDate = parseDateSafely(date);
  return targetDate ? isTomorrow(targetDate) : false;
};

// Formatting functions

// Format date for display
export const formatDateInTimezone = (
  date,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
  formatStr = DISPLAY_FORMATS.COMPACT_DATE,
) => {
  if (!isValidDate(date)) return null;

  const parsedDate = parseDateSafely(date);
  if (!parsedDate) return null;

  return format(parsedDate, formatStr, {locale: enUS});
};

// Format time for display
export const formatTimeInTimezone = (
  date,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
  format12h = true,
) => {
  if (!isValidDate(date)) return null;

  const parsedDate = parseDateSafely(date);
  if (!parsedDate) return null;

  const formatStr = format12h
    ? DISPLAY_FORMATS.TWELVE_HOUR
    : DISPLAY_FORMATS.TWENTY_FOUR_HOUR;
  return format(parsedDate, formatStr, {locale: enUS});
};

// Validate if something is a valid date
export const isValidDate = date => {
  if (!date) return false;

  if (date instanceof Date) {
    return isValid(date);
  }

  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed);
  }

  return false;
};

// Date parsing with comprehensive validation
export const parseDateSafely = date => {
  if (!date) return null;

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }

  return null;
};

// Business logic and scheduling

// Generate available dates based on business hours
export const getNextAvailableDates = ({
  startDate = new Date(),
  timeZone = SUPPORTED_TIMEZONES.NEW_YORK,
  businessHours = [],
  businessHoursOverrides = [],
  datesCount = 7,
  endDate = null,
}) => {
  const dates = [];
  let currentDate = startOfDay(startDate);
  let attempts = 0;
  const maxAttempts = 30; // Prevent infinite loops

  while (dates.length < datesCount && attempts < maxAttempts) {
    attempts++;

    // Check if we've reached the end date
    if (endDate && isAfter(currentDate, endDate)) {
      break;
    }

    // Skip dates in the past
    if (isBefore(currentDate, startOfDay(new Date()))) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    const dayOfWeek = getDay(currentDate);

    // Check if business is open on this day
    const dayBusinessHours = businessHours.filter(
      hours => hours.day === dayOfWeek,
    );

    // Check for business hours overrides
    const dayOverrides = businessHoursOverrides.filter(override => {
      return (
        getMonth(currentDate) + 1 === override.month &&
        getDate(currentDate) === override.day
      );
    });

    // Skip if closed by override or no business hours
    const isClosed = dayOverrides.some(
      override => !override.startTime && !override.endTime,
    );

    if (!isClosed && (dayBusinessHours.length > 0 || dayOverrides.length > 0)) {
      dates.push(new Date(currentDate));
    }

    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

/**
 * Get user-friendly date label (Today, Tomorrow, or formatted date)
 */
export const getDateLabel = (date, timezone = SUPPORTED_TIMEZONES.NEW_YORK) => {
  const parsedDate = parseDateSafely(date);
  if (!parsedDate) return 'Invalid Date';

  if (isToday(parsedDate)) return 'Today';
  if (isTomorrow(parsedDate)) return 'Tomorrow';

  return format(parsedDate, 'EEE, MMM d');
};

// Scheduling engine for availability generation
export const buildAvailabilitySchedule = ({
  currentDate = new Date(),
  prepTimeInMinutes = PREPARATION_TIME_DEFAULT,
  timeZone = SUPPORTED_TIMEZONES.NEW_YORK,
  dates = [],
  businessHours = [],
  businessHoursOverrides = [],
  gapInMinutes = SLOT_INTERVALS.QUARTER_HOUR,
}) => {
  return dates
    .map(date => {
      const dayOfWeek = getDay(date);

      // Get business hours for this day
      const dayBusinessHours = businessHours.filter(
        hours => hours.day === dayOfWeek,
      );

      // Check for overrides
      const dayOverrides = businessHoursOverrides.filter(override => {
        return (
          getMonth(date) + 1 === override.month &&
          getDate(date) === override.day
        );
      });

      const selectedBusinessHours =
        dayOverrides.length > 0 ? dayOverrides : dayBusinessHours;

      const storeTimes = {
        openingTime: null,
        closingTime: null,
        totalShifts: 0,
        remainingShifts: 0,
      };

      const slots = selectedBusinessHours
        .map((businessHour, index) => {
          const shiftStartDate = applyTimeToDate(
            date,
            businessHour.startTime || businessHour.start_time,
            timeZone,
          );
          const shiftEndDate = applyTimeToDate(
            date,
            businessHour.endTime || businessHour.end_time,
            timeZone,
          );

          if (
            !shiftStartDate ||
            !shiftEndDate ||
            !isBefore(shiftStartDate, shiftEndDate)
          ) {
            return null;
          }

          if (index === 0) {
            storeTimes.openingTime = shiftStartDate;
          }

          if (index === selectedBusinessHours.length - 1) {
            storeTimes.closingTime = shiftEndDate;
          }

          storeTimes.totalShifts += 1;

          // Generate time slots using date-fns
          const shiftSlots = eachMinuteOfInterval(
            {
              start: shiftStartDate,
              end: shiftEndDate,
            },
            {
              step: gapInMinutes,
            },
          );

          // Apply prep time logic for current day
          if (isCurrentDay(date, timeZone)) {
            const currentTimeWithPrep = addMinutes(
              Math.max(currentDate, storeTimes.openingTime || shiftStartDate),
              prepTimeInMinutes,
            );

            if (currentTimeWithPrep > shiftEndDate) {
              return null;
            }

            const availableSlots = shiftSlots.filter(slot =>
              isAfter(slot, currentTimeWithPrep),
            );

            if (availableSlots.length > 0) {
              storeTimes.remainingShifts += 1;
              availableSlots.unshift(
                roundToNearestMinutes(currentTimeWithPrep, {
                  nearestTo: gapInMinutes,
                }),
              );
            }

            return availableSlots;
          }

          // For future dates, apply prep time to first slot
          const prepTimeSlot = addMinutes(shiftStartDate, prepTimeInMinutes);

          if (prepTimeSlot > shiftEndDate) {
            return null;
          }

          const futureSlots = shiftSlots.filter(slot =>
            isAfter(slot, prepTimeSlot),
          );

          if (futureSlots.length > 0) {
            storeTimes.remainingShifts += 1;
            futureSlots.unshift(prepTimeSlot);
          }

          return futureSlots;
        })
        .flat()
        .filter(slot => slot !== null)
        .sort(compareAsc);

      const availableSlots = slots.filter(slot => slot >= currentDate);

      return {
        date,
        originalStoreOpeningTime: storeTimes.openingTime,
        originalStoreClosingTime: storeTimes.closingTime,
        remainingShifts: storeTimes.remainingShifts,
        totalShifts: storeTimes.totalShifts,
        openingTime: slots[0],
        closingTime: slots[slots.length - 1],
        firstAvailableSlot: availableSlots[0],
        slots: availableSlots,
      };
    })
    .filter(schedule => schedule.slots.length > 0);
};

// Legacy functions for backward compatibility

// Simple time slot generator
export const createBookingTimeSlots = (
  startTime,
  endTime,
  intervalMinutes = SLOT_INTERVALS.QUARTER_HOUR,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  console.log(`🚀 createBookingTimeSlots called with:`, {
    startTime,
    endTime,
    intervalMinutes,
    timezone,
    note: 'API times are in NYC timezone',
  });

  if (!startTime || !endTime) return [];

  // Parse time strings (HH:mm format)
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const baseDate = new Date();
  const start = setHours(
    setMinutes(new Date(baseDate), startMinute),
    startHour,
  );
  const end = setHours(setMinutes(new Date(baseDate), endMinute), endHour);

  console.log(`🕐 Base times created:`, {
    start: start.toLocaleString(),
    end: end.toLocaleString(),
    startNYC: `${startHour}:${startMinute.toString().padStart(2, '0')}`,
    endNYC: `${endHour}:${endMinute.toString().padStart(2, '0')}`,
  });

  // Use eachMinuteOfInterval for generating slots
  const intervalDates = eachMinuteOfInterval(
    {
      start,
      end,
    },
    {
      step: intervalMinutes,
    },
  );

  // Transform intervals into time slot objects
  const slots = intervalDates
    .filter(date => isBefore(date, end)) // Exclude end time
    .map(date => ({
      time24: format(date, DISPLAY_FORMATS.TWENTY_FOUR_HOUR),
      time12: format(date, DISPLAY_FORMATS.TWELVE_HOUR),
      display: format(date, DISPLAY_FORMATS.TWELVE_HOUR),
      value: format(date, DISPLAY_FORMATS.TWENTY_FOUR_HOUR),
    }));

  console.log(
    `✨ Generated ${slots.length} time slots:`,
    slots.slice(0, 5).map(s => s.value),
    slots.length > 5 ? '...' : '',
  );

  return slots;
};

// Generate upcoming dates
export const generateUpcomingDates = (count = 30, startDate = new Date()) => {
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
};
export const isTimeSlotPast = (
  date,
  timeSlot,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  const parsedDate = parseDateSafely(date);
  if (!parsedDate || !timeSlot) return false;

  try {
    // Parse the time slot (format: "HH:mm")
    const [hour, minute] = timeSlot.split(':').map(Number);

    // Validate hour and minute
    if (
      isNaN(hour) ||
      isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      console.error('isTimeSlotPast: Invalid time format', timeSlot);
      return false;
    }

    // Create the appointment datetime using date-fns
    const slotDateTime = setHours(
      setMinutes(startOfDay(parsedDate), minute),
      hour,
    );

    // Get current time
    const now = getNowInTimezone(timezone);

    // Compare using date-fns
    return isBefore(slotDateTime, now);
  } catch (error) {
    console.error('isTimeSlotPast error:', error, {date, timeSlot, timezone});
    return false;
  }
};

/**
 * Format time slot for display with timezone suffix
 */
export const formatTimeSlotDisplay = (
  timeSlot,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
  showTimezone = true,
  targetTimezone = null,
) => {
  if (!timeSlot) return 'No time selected';

  let formattedTime = timeSlot;

  // Convert time between timezones if needed
  if (targetTimezone && timezone !== targetTimezone) {
    formattedTime = convertTimeBetweenTimezones(
      timeSlot,
      timezone,
      targetTimezone,
    );
  }

  // Convert 24h to 12h format if needed
  if (formattedTime.includes(':') && formattedTime.length <= 5) {
    const [hour, minute] = formattedTime.split(':').map(Number);
    const date = setHours(setMinutes(new Date(), minute), hour);
    formattedTime = format(date, DISPLAY_FORMATS.TWELVE_HOUR);
  }

  if (!showTimezone) return formattedTime;

  // Use target timezone for display if provided
  const displayTimezone = targetTimezone || timezone;
  const suffix =
    displayTimezone === SUPPORTED_TIMEZONES.NEW_YORK
      ? 'NYC'
      : displayTimezone === SUPPORTED_TIMEZONES.UTC
      ? 'UTC'
      : 'Local';
  return `${formattedTime} ${suffix}`;
};

/**
 * Get greeting message based on time and timezone
 */
export const getGreetingMessage = (timezone = SUPPORTED_TIMEZONES.NEW_YORK) => {
  const now = getNowInTimezone(timezone);
  const hour = getHours(now);
  const cityName =
    timezone === SUPPORTED_TIMEZONES.NEW_YORK
      ? 'NYC'
      : getCityFromTimezone(timezone);

  if (hour >= 5 && hour <= 9) return `Good Morning, ${cityName}!`;
  if (hour >= 10 && hour <= 11) return `Late Morning Vibes! ${cityName}`;
  if (hour >= 12 && hour <= 16) return `Good Afternoon, ${cityName}!`;
  if (hour >= 17 && hour <= 20) return `Good Evening, ${cityName}!`;
  return `Night Owl in ${cityName}!`;
};

/**
 * Extract city name from timezone
 */
export const getCityFromTimezone = timezone => {
  if (timezone === SUPPORTED_TIMEZONES.NEW_YORK) return 'NYC';

  try {
    const parts = timezone.split('/');
    const city = parts[parts.length - 1];
    return city.replace(/_/g, ' ');
  } catch {
    return 'Local';
  }
};

// Menu and schedule filtering
export const filterMenusFromSchedule = ({
  schedule = [],
  menus = [],
  timeZone = SUPPORTED_TIMEZONES.NEW_YORK,
}) => {
  return schedule
    .map(daySchedule => ({
      ...daySchedule,
      slots: daySchedule.slots.filter(slot => {
        const slotTime = {
          hours: getHours(slot),
          minutes: getMinutes(slot),
          dayOfWeek: getDay(slot),
        };

        // If no menus exist, show all slots by default
        if (!menus.length) {
          return true;
        }

        // Check if any menu is configured for this time slot
        return menus.some(menu => {
          const daySchedule = menu.times?.[slotTime.dayOfWeek];
          if (!daySchedule) {
            return false;
          }

          // If menu is configured for all day, show the slot
          if (daySchedule.all_day) {
            return true;
          }

          // Only show slot if it falls within the configured time range
          return isWithinOperatingHours(daySchedule, slotTime);
        });
      }),
    }))
    .filter(daySchedule => daySchedule.slots.length > 0);
};

// Location scheduling
export const generateLocationFulfillmentSchedule = ({
  startDate = new Date(),
  currentDate = new Date(),
  prepTimeInMinutes = PREPARATION_TIME_DEFAULT,
  location,
  fulfillmentPreference = 'pickup',
  businessHoursOverrides = [],
  gapInMinutes = SLOT_INTERVALS.QUARTER_HOUR,
  daysCount = 7,
  endDate = null,
}) => {
  // Mock business hours - in real implementation this would come from location data
  const mockBusinessHours = [
    {day: 1, startTime: '09:00', endTime: '18:00'}, // Monday
    {day: 2, startTime: '09:00', endTime: '18:00'}, // Tuesday
    {day: 3, startTime: '09:00', endTime: '18:00'}, // Wednesday
    {day: 4, startTime: '09:00', endTime: '18:00'}, // Thursday
    {day: 5, startTime: '09:00', endTime: '18:00'}, // Friday
    {day: 6, startTime: '10:00', endTime: '16:00'}, // Saturday
  ];

  const dates = getNextAvailableDates({
    startDate: startDate || currentDate,
    businessHours: mockBusinessHours,
    businessHoursOverrides:
      businessHoursOverrides?.[location?.location_id] || [],
    timeZone: location?.timezone || SUPPORTED_TIMEZONES.NEW_YORK,
    datesCount: daysCount,
    endDate,
  });

  const schedule = buildAvailabilitySchedule({
    currentDate: roundToNearestMinutes(currentDate, {nearestTo: gapInMinutes}),
    prepTimeInMinutes,
    timeZone: location?.timezone || SUPPORTED_TIMEZONES.NEW_YORK,
    dates,
    businessHours: mockBusinessHours,
    businessHoursOverrides:
      businessHoursOverrides?.[location?.location_id] || [],
    gapInMinutes,
  });

  return schedule;
};

// Get user's device timezone
export const getDeviceTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Time conversion between timezones
export const convertTimeBetweenTimezones = (time, fromTimezone, toTimezone) => {
  if (!time || !fromTimezone || !toTimezone) {
    console.log('convertTimeBetweenTimezones: Missing parameters', {
      time,
      fromTimezone,
      toTimezone,
    });
    return time;
  }
  if (fromTimezone === toTimezone) return time;

  try {
    // Parse the time string (format: "HH:mm")
    if (typeof time !== 'string' || !time.includes(':')) {
      console.error(
        'convertTimeBetweenTimezones: Invalid time format, expected HH:mm',
        time,
      );
      return time;
    }

    const [hour, minute] = time.split(':').map(Number);

    // Validate hour and minute
    if (
      isNaN(hour) ||
      isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      console.error('convertTimeBetweenTimezones: Invalid time values', {
        time,
        hour,
        minute,
      });
      return time;
    }

    // Create a date object for today with the specified time using date-fns
    const today = new Date();
    const timeDate = setHours(setMinutes(startOfDay(today), minute), hour);

    // Validate the created date
    if (!isValid(timeDate)) {
      console.error(
        'convertTimeBetweenTimezones: Invalid date created',
        timeDate,
      );
      return time;
    }

    // Get timezone offsets (in hours)
    const sourceOffset = getTimezoneOffsetHours(fromTimezone);
    const targetOffset = getTimezoneOffsetHours(toTimezone);

    // Calculate the time difference in hours
    const offsetDiffHours = sourceOffset - targetOffset;

    // Apply the timezone difference using date-fns
    const convertedDate = addHours(timeDate, offsetDiffHours);

    // Validate the converted date
    if (!isValid(convertedDate)) {
      console.error(
        'convertTimeBetweenTimezones: Invalid converted date',
        convertedDate,
      );
      return time;
    }

    // Format back to HH:mm using date-fns
    return format(convertedDate, DISPLAY_FORMATS.TWENTY_FOUR_HOUR);
  } catch (error) {
    console.error('Timezone conversion error:', error, {
      time,
      fromTimezone,
      toTimezone,
    });
    return time; // Return original time if conversion fails
  }
};

// Get timezone offset in hours from UTC
const getTimezoneOffsetHours = timezone => {
  try {
    if (
      timezone === SUPPORTED_TIMEZONES.NEW_YORK ||
      timezone === 'America/New_York'
    ) {
      // NYC is UTC-5 (EST) or UTC-4 (EDT) depending on DST
      // For simplicity in this React Native app, we'll use a fixed calculation
      // In production, you'd use a proper timezone library
      const now = new Date();
      const month = getMonth(now);
      const date = getDate(now);

      // Rough DST calculation for US Eastern Time
      // DST typically runs from second Sunday in March to first Sunday in November
      const isDST = month > 2 && month < 10; // April to October (rough approximation)
      return isDST ? -4 : -5; // EDT is UTC-4, EST is UTC-5
    } else if (
      timezone === SUPPORTED_TIMEZONES.COORDINATED_UNIVERSAL ||
      timezone === 'UTC'
    ) {
      return 0; // UTC has no offset
    } else if (timezone === SUPPORTED_TIMEZONES.USER_DEVICE) {
      // Get local timezone offset using native Date
      const now = new Date();
      return -now.getTimezoneOffset() / 60; // getTimezoneOffset returns negative values for positive offsets
    } else {
      // Default to UTC for unknown timezones
      return 0;
    }
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0; // Return 0 if unable to determine offset
  }
};

// Calculate time until a target time
export const getTimeUntil = (
  targetTime,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  if (!targetTime) return null;

  const now = getNowInTimezone(timezone);
  const [hour, minute] = targetTime.split(':').map(Number);

  const target = setHours(setMinutes(new Date(now), minute), hour);

  // If target time has passed today, set it for tomorrow
  if (isBefore(target, now)) {
    target = addDays(target, 1);
  }

  return formatDistanceToNow(target, {addSuffix: true, locale: enUS});
};

// Check if store is open right now
export const isStoreCurrentlyOpen = (
  storeHours,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  if (!storeHours || !storeHours.is_open) return false;

  const now = new Date();
  const currentTime = format(now, DISPLAY_FORMATS.TWENTY_FOUR_HOUR);

  return (
    currentTime >= storeHours.start_time && currentTime <= storeHours.end_time
  );
};

// Get when the store opens next
export const getNextStoreOpening = (
  storeHours,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  if (!storeHours || !storeHours.start_time) return null;

  const now = new Date();
  const [hour, minute] = storeHours.start_time.split(':').map(Number);

  let nextOpening = setHours(setMinutes(new Date(now), minute), hour);

  // If opening time has passed today, set it for tomorrow
  if (isBefore(nextOpening, now)) {
    nextOpening = addDays(nextOpening, 1);
  }

  return nextOpening;
};

// Format appointment for display
export const formatAppointmentDateTime = (
  date,
  timeSlot,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
  targetTimezone = null,
) => {
  const parsedDate = parseDateSafely(date);
  if (!parsedDate || !timeSlot) return 'Invalid appointment time';

  const dateStr = getDateLabel(parsedDate, targetTimezone || timezone);
  const timeStr = formatTimeSlotDisplay(
    timeSlot,
    timezone,
    true,
    targetTimezone,
  );

  return `${dateStr} at ${timeStr}`;
};
