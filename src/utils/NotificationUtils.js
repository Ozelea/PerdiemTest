import {
  formatAppointmentDateTime,
  formatTimeSlotDisplay,
} from './DateTimeUtils';
import {validateNotificationData} from './ValidationUtils';

/**
 * Professional notification utility system
 * Handles notification creation, formatting, and management
 */

// Notification types
export const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  STORE_HOURS_UPDATE: 'STORE_HOURS_UPDATE',
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE',
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

// Notification templates
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.APPOINTMENT_BOOKED]: {
    title: 'Appointment Confirmed',
    body: 'Your appointment has been successfully booked for {datetime}.',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: {
    title: 'Appointment Reminder',
    body: 'Your appointment is scheduled for {datetime}. See you soon!',
    priority: NOTIFICATION_PRIORITIES.HIGH,
  },
  [NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: {
    title: 'Appointment Cancelled',
    body: 'Your appointment for {datetime} has been cancelled.',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  [NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED]: {
    title: 'Appointment Rescheduled',
    body: 'Your appointment has been moved to {datetime}.',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  [NOTIFICATION_TYPES.STORE_HOURS_UPDATE]: {
    title: 'Store Hours Updated',
    body: 'Store hours have been updated. Please check the latest schedule.',
    priority: NOTIFICATION_PRIORITIES.LOW,
  },
  [NOTIFICATION_TYPES.SYSTEM_MESSAGE]: {
    title: 'System Update',
    body: '{message}',
    priority: NOTIFICATION_PRIORITIES.LOW,
  },
};

/**
 * Create notification data structure
 */
export const createNotification = (type, data = {}) => {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const {date, timeSlot, customMessage, customTitle, priority, timezone} = data;

  let title = customTitle || template.title;
  let body = customMessage || template.body;
  const notificationPriority = priority || template.priority;

  // Replace placeholders
  if (date && timeSlot) {
    const datetime = formatAppointmentDateTime(date, timeSlot, timezone);
    body = body.replace('{datetime}', datetime);
  }

  if (customMessage && type === NOTIFICATION_TYPES.SYSTEM_MESSAGE) {
    body = body.replace('{message}', customMessage);
  }

  const notification = {
    id: generateNotificationId(),
    type,
    title,
    body,
    priority: notificationPriority,
    timestamp: new Date().toISOString(),
    data: {
      date,
      timeSlot,
      timezone,
      ...data,
    },
  };

  // Validate notification data
  const validation = validateNotificationData(notification);
  if (!validation.isValid) {
    throw new Error(`Invalid notification data: ${validation.message}`);
  }

  return notification;
};

/**
 * Generate unique notification ID
 */
const generateNotificationId = () => {
  return `notification_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
};

/**
 * Create appointment booked notification
 */
export const createAppointmentBookedNotification = (
  appointmentData,
  timezone,
) => {
  const {date, timeSlot} = appointmentData;

  return createNotification(NOTIFICATION_TYPES.APPOINTMENT_BOOKED, {
    date,
    timeSlot,
    timezone,
    appointmentId: appointmentData.id,
  });
};

/**
 * Create appointment reminder notification
 */
export const createAppointmentReminderNotification = (
  appointmentData,
  timezone,
) => {
  const {date, timeSlot} = appointmentData;

  return createNotification(NOTIFICATION_TYPES.APPOINTMENT_REMINDER, {
    date,
    timeSlot,
    timezone,
    appointmentId: appointmentData.id,
    priority: NOTIFICATION_PRIORITIES.HIGH,
  });
};

/**
 * Create appointment cancelled notification
 */
export const createAppointmentCancelledNotification = (
  appointmentData,
  timezone,
) => {
  const {date, timeSlot} = appointmentData;

  return createNotification(NOTIFICATION_TYPES.APPOINTMENT_CANCELLED, {
    date,
    timeSlot,
    timezone,
    appointmentId: appointmentData.id,
  });
};

/**
 * Create appointment rescheduled notification
 */
export const createAppointmentRescheduledNotification = (
  appointmentData,
  timezone,
) => {
  const {date, timeSlot} = appointmentData;

  return createNotification(NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED, {
    date,
    timeSlot,
    timezone,
    appointmentId: appointmentData.id,
  });
};

/**
 * Create system message notification
 */
export const createSystemNotification = (
  message,
  priority = NOTIFICATION_PRIORITIES.LOW,
) => {
  return createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, {
    customMessage: message,
    priority,
  });
};

/**
 * Format notification for display
 */
export const formatNotificationForDisplay = notification => {
  if (!notification) return null;

  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    priority: notification.priority,
    timestamp: notification.timestamp,
    type: notification.type,
    isRead: false,
  };
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = type => {
  switch (type) {
    case NOTIFICATION_TYPES.APPOINTMENT_BOOKED:
      return '✅';
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
      return '⏰';
    case NOTIFICATION_TYPES.APPOINTMENT_CANCELLED:
      return '❌';
    case NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED:
      return '🔄';
    case NOTIFICATION_TYPES.STORE_HOURS_UPDATE:
      return '🏪';
    case NOTIFICATION_TYPES.SYSTEM_MESSAGE:
      return 'ℹ️';
    default:
      return '📱';
  }
};

/**
 * Get notification color based on priority
 */
export const getNotificationColor = priority => {
  switch (priority) {
    case NOTIFICATION_PRIORITIES.URGENT:
      return '#FF4444';
    case NOTIFICATION_PRIORITIES.HIGH:
      return '#FF8800';
    case NOTIFICATION_PRIORITIES.MEDIUM:
      return '#4A90E2';
    case NOTIFICATION_PRIORITIES.LOW:
      return '#888888';
    default:
      return '#4A90E2';
  }
};

/**
 * Determine if notification should be shown immediately
 */
export const shouldShowImmediately = notification => {
  if (!notification) return false;

  const highPriorityTypes = [
    NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
  ];

  const urgentPriorities = [
    NOTIFICATION_PRIORITIES.URGENT,
    NOTIFICATION_PRIORITIES.HIGH,
  ];

  return (
    highPriorityTypes.includes(notification.type) ||
    urgentPriorities.includes(notification.priority)
  );
};

/**
 * Create notification payload for native notifications
 */
export const createNativeNotificationPayload = notification => {
  return {
    title: notification.title,
    body: notification.body,
    data: {
      notificationId: notification.id,
      type: notification.type,
      appointmentId: notification.data?.appointmentId,
    },
    priority: notification.priority,
  };
};

/**
 * Schedule notification for future delivery
 */
export const scheduleNotification = (notification, scheduleTime) => {
  return {
    ...notification,
    scheduledFor: scheduleTime.toISOString(),
    isScheduled: true,
  };
};

/**
 * Batch create multiple notifications
 */
export const createNotificationBatch = notifications => {
  return notifications.map(({type, data}) => createNotification(type, data));
};
