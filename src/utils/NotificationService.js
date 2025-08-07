import {Alert, Platform} from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {addMinutes, getTime, format} from 'date-fns';
import Storage from './Storage';
import {
  createAppointmentBookedNotification,
  createAppointmentReminderNotification,
  createSystemNotification,
  createNativeNotificationPayload,
} from './NotificationUtils';
import {
  getNowInTimezone,
  getNextStoreOpening,
  formatTimeInTimezone,
  SUPPORTED_TIMEZONES,
} from './DateTimeUtils';

// State management for notification service
let isPermissionGranted = false;

const onNotificationReceived = notification => {
  // Handle notification received
};

const onLocalNotificationReceived = notification => {
  // Handle local notification received
};

const initializeNotifications = async () => {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    }).then(permissions => {
      isPermissionGranted = permissions.alert;
    });

    PushNotificationIOS.addEventListener(
      'notification',
      onNotificationReceived,
    );
    PushNotificationIOS.addEventListener(
      'localNotification',
      onLocalNotificationReceived,
    );
  }
};

const requestPermissions = async () => {
  if (Platform.OS === 'ios') {
    const permissions = await PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    });
    isPermissionGranted = permissions.alert;
    return permissions;
  }
  return {alert: false, badge: false, sound: false};
};

const scheduleNotification = (title, message, delayInMinutes = 0) => {
  console.log('🔔 scheduleNotification called:', {
    title,
    message,
    delayInMinutes,
  });

  if (Platform.OS === 'ios') {
    const fireDate = addMinutes(new Date(), delayInMinutes);
    console.log('📱 iOS notification scheduled for:', fireDate.toISOString());

    PushNotificationIOS.scheduleLocalNotification({
      alertTitle: title,
      alertBody: message,
      fireDate: fireDate.toISOString(),
      soundName: 'default',
      category: 'APPOINTMENT_NOTIFICATION',
      userInfo: {
        type: 'scheduled_notification',
        scheduledAt: new Date().toISOString(),
      },
    });
    console.log('✅ iOS notification scheduled successfully');
  } else {
    // Fallback to Alert for non-iOS platforms during development
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'OK',
            onPress: () => console.log('Notification acknowledged'),
            style: 'default',
          },
        ],
        {cancelable: false},
      );
    }, delayInMinutes * 60 * 1000);
  }
};

// Schedule a test notification
const scheduleTestNotification = async () => {
  try {
    scheduleNotification(
      'Test Notification',
      'This is a test notification from your appointment app!',
      0.1, // 6 seconds delay for testing
    );
    return {
      success: true,
      message: 'Test notification scheduled successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to schedule test notification',
      error: error.message,
    };
  }
};

// Show test notification (alias for scheduleTestNotification)
const showTestNotification = async () => {
  return scheduleTestNotification();
};

// Schedule store opening notification (1 hour before store opens)
const scheduleStoreOpeningNotification = async (
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  try {
    console.log(
      '🔔 NotificationService.scheduleStoreOpeningNotification called',
    );
    console.log('🌐 Timezone:', timezone);

    const storeHours = {
      is_open: true,
      start_time: '09:00',
      end_time: '17:00',
    };
    console.log('🏪 Store hours:', storeHours);

    const nextOpening = getNextStoreOpening(storeHours, timezone);
    console.log('⏰ Next opening calculated:', nextOpening);

    if (!nextOpening) {
      console.log('❌ Could not determine next store opening time');
      return {
        success: false,
        message: 'Could not determine next store opening time',
      };
    }

    const now = getNowInTimezone(timezone);
    console.log('🕐 Current time in timezone:', now);

    const notificationTime = addMinutes(nextOpening, -60); // 1 hour before
    console.log('📅 Notification time calculated:', notificationTime);

    const delayInMinutes =
      (getTime(notificationTime) - getTime(now)) / (1000 * 60);
    console.log('⏱️ Delay in minutes:', delayInMinutes);

    if (delayInMinutes > 0) {
      const notification = createSystemNotification(
        `The store will open in 1 hour at ${formatTimeInTimezone(
          nextOpening,
          timezone,
        )}. Get ready to book your appointment!`,
      );
      console.log('📨 Notification created:', notification);

      scheduleNotification(
        notification.title,
        notification.body,
        delayInMinutes,
      );
      console.log('✅ Notification scheduled successfully');

      Storage.setString('lastScheduledNotification', new Date().toISOString());

      return {
        success: true,
        notificationTime: notificationTime.toISOString(),
        storeOpeningTime: nextOpening.toISOString(),
        message: 'Store opening notification scheduled 1 hour before opening',
      };
    } else {
      console.log('⚠️ Notification time has already passed for today');
      return {
        success: false,
        message: 'Notification time has already passed for today',
      };
    }
  } catch (error) {
    console.error('🚨 scheduleStoreOpeningNotification error:', error);
    return {
      success: false,
      message: 'Failed to schedule store opening notification',
      error: error.message,
    };
  }
};

// Schedule appointment reminder
const scheduleAppointmentReminder = async (
  appointmentDate,
  appointmentTime,
) => {
  try {
    const appointmentDateTime = new Date(
      `${appointmentDate} ${appointmentTime}`,
    );
    const reminderTime = addMinutes(appointmentDateTime, -30);
    const now = getNowInTimezone();

    if (reminderTime > now) {
      const delayInMinutes =
        (getTime(reminderTime) - getTime(now)) / (1000 * 60);

      const notification = createAppointmentReminderNotification({
        date: appointmentDate,
        timeSlot: appointmentTime,
      });

      scheduleNotification(
        notification.title,
        notification.body,
        delayInMinutes,
      );

      return {
        success: true,
        reminderTime: reminderTime.toISOString(),
        message: 'Appointment reminder scheduled successfully',
      };
    } else {
      return {
        success: false,
        message: 'Appointment time has already passed',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to schedule appointment reminder',
      error: error.message,
    };
  }
};

// Cancel all notifications
const cancelAllNotifications = () => {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.cancelAllLocalNotifications();
  }
};

// Get pending notifications
const getPendingNotifications = async () => {
  if (Platform.OS === 'ios') {
    return new Promise(resolve => {
      PushNotificationIOS.getPendingNotificationRequests(notifications => {
        resolve(notifications);
      });
    });
  }
  return [];
};

// Cleanup when service is destroyed
const destroy = () => {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.removeEventListener(
      'notification',
      onNotificationReceived,
    );
    PushNotificationIOS.removeEventListener(
      'localNotification',
      onLocalNotificationReceived,
    );
  }
};

// Initialize the notification service
initializeNotifications();

// Export notification service functions
const NotificationService = {
  requestPermissions,
  scheduleNotification,
  scheduleTestNotification,
  showTestNotification,
  scheduleStoreOpeningNotification,
  scheduleAppointmentReminder,
  cancelAllNotifications,
  getPendingNotifications,
  destroy,
  getIsPermissionGranted: () => isPermissionGranted,
};

export default NotificationService;
