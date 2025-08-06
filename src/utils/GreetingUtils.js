import {getCurrentTimeInTimezone, TIME_ZONES} from './DateTimeUtils';

/**
 * Professional greeting system with dynamic messaging
 * Provides context-aware greetings based on time and user state
 */

// Greeting templates
const GREETING_TEMPLATES = {
  morning: {
    primary: 'Good Morning',
    casual: 'Rise and Shine',
    business: 'Good Morning',
    energetic: 'Morning Vibes',
  },
  lateMorning: {
    primary: 'Late Morning',
    casual: 'Hey There',
    business: 'Good Morning',
    energetic: 'Late Morning Vibes',
  },
  afternoon: {
    primary: 'Good Afternoon',
    casual: 'Hey',
    business: 'Good Afternoon',
    energetic: 'Afternoon Energy',
  },
  evening: {
    primary: 'Good Evening',
    casual: 'Evening',
    business: 'Good Evening',
    energetic: 'Evening Vibes',
  },
  night: {
    primary: 'Good Night',
    casual: 'Night Owl',
    business: 'Good Evening',
    energetic: 'Night Energy',
  },
};

/**
 * Get time period based on hour
 */
const getTimePeriod = hour => {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 12) return 'lateMorning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Generate personalized greeting
 */
export const generateGreeting = (options = {}) => {
  const {
    timezone = TIME_ZONES.NYC,
    style = 'primary',
    includeName = false,
    userName = null,
    includeLocation = true,
    customLocation = null,
  } = options;

  const now = getCurrentTimeInTimezone(timezone);
  const hour = now.getHours();
  const period = getTimePeriod(hour);

  let greeting =
    GREETING_TEMPLATES[period][style] || GREETING_TEMPLATES[period].primary;

  // Add user name if provided
  if (includeName && userName) {
    greeting = `${greeting}, ${userName}`;
  }

  // Add location context
  if (includeLocation) {
    const location = customLocation || getCityDisplayName(timezone);
    greeting = `${greeting}${includeName && userName ? '' : ','} ${location}!`;
  } else {
    greeting = `${greeting}!`;
  }

  return greeting;
};

/**
 * Get display name for location based on timezone
 */
const getCityDisplayName = timezone => {
  switch (timezone) {
    case TIME_ZONES.NYC:
      return 'NYC';
    case TIME_ZONES.UTC:
      return 'UTC';
    default:
      try {
        const parts = timezone.split('/');
        const city = parts[parts.length - 1];
        return city.replace(/_/g, ' ');
      } catch {
        return 'Local';
      }
  }
};

/**
 * Get contextual greeting for appointment booking
 */
export const getAppointmentGreeting = (
  appointmentCount = 0,
  timezone = TIME_ZONES.NYC,
) => {
  const baseGreeting = generateGreeting({
    timezone,
    style: 'business',
    includeLocation: true,
  });

  if (appointmentCount === 0) {
    return `${baseGreeting} Ready to book your first appointment?`;
  }

  if (appointmentCount === 1) {
    return `${baseGreeting} You have 1 appointment scheduled.`;
  }

  return `${baseGreeting} You have ${appointmentCount} appointments scheduled.`;
};

/**
 * Get greeting based on user action context
 */
export const getContextualGreeting = (context, timezone = TIME_ZONES.NYC) => {
  const baseGreeting = generateGreeting({
    timezone,
    style: 'primary',
    includeLocation: true,
  });

  switch (context) {
    case 'login':
      return `${baseGreeting} Welcome back!`;
    case 'booking':
      return `${baseGreeting} Let's book your appointment.`;
    case 'reschedule':
      return `${baseGreeting} Need to reschedule?`;
    case 'cancel':
      return `${baseGreeting} Managing your appointments.`;
    default:
      return baseGreeting;
  }
};

/**
 * Get time-sensitive motivational message
 */
export const getMotivationalMessage = (timezone = TIME_ZONES.NYC) => {
  const now = getCurrentTimeInTimezone(timezone);
  const hour = now.getHours();

  if (hour >= 5 && hour < 10) {
    return 'Perfect time to start your day with an appointment!';
  }

  if (hour >= 10 && hour < 12) {
    return 'Great timing for a mid-morning appointment!';
  }

  if (hour >= 12 && hour < 17) {
    return 'Afternoon appointments are available!';
  }

  if (hour >= 17 && hour < 21) {
    return 'Evening slots are perfect after work!';
  }

  return 'Night appointments for night owls!';
};

/**
 * Get urgency-based messaging for appointments
 */
export const getUrgencyMessage = hoursUntilAppointment => {
  if (hoursUntilAppointment <= 1) {
    return 'Your appointment is coming up soon!';
  }

  if (hoursUntilAppointment <= 4) {
    return 'Your appointment is in a few hours.';
  }

  if (hoursUntilAppointment <= 24) {
    return 'Your appointment is tomorrow.';
  }

  return 'Your upcoming appointment.';
};
