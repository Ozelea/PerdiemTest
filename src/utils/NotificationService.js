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

let isPermissionGranted = false;

const onNotificationReceived = notification => {};

const onLocalNotificationReceived = notification => {};

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
  if (Platform.OS === 'ios') {
    const fireDate = addMinutes(new Date(), delayInMinutes);

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
  } else {
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'OK',
            onPress: () => {},
            style: 'default',
          },
        ],
        {cancelable: false},
      );
    }, delayInMinutes * 60 * 1000);
  }
};

const scheduleTestNotification = async () => {
  try {
    scheduleNotification(
      'Test Notification',
      'This is a test notification from your appointment app!',
      0.1,
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

const showTestNotification = async () => {
  return scheduleTestNotification();
};

const scheduleStoreOpeningNotification = async (
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
) => {
  try {
    const storeHours = {
      is_open: true,
      start_time: '09:00',
      end_time: '17:00',
    };

    const nextOpening = getNextStoreOpening(storeHours, timezone);

    if (!nextOpening) {
      return {
        success: false,
        message: 'Could not determine next store opening time',
      };
    }

    const now = getNowInTimezone(timezone);

    const notificationTime = addMinutes(nextOpening, -60);

    const delayInMinutes =
      (getTime(notificationTime) - getTime(now)) / (1000 * 60);

    if (delayInMinutes > 0) {
      const notification = createSystemNotification(
        `The store will open in 1 hour at ${formatTimeInTimezone(
          nextOpening,
          timezone,
        )}. Get ready to book your appointment!`,
      );

      scheduleNotification(
        notification.title,
        notification.body,
        delayInMinutes,
      );

      Storage.setString('lastScheduledNotification', new Date().toISOString());

      return {
        success: true,
        notificationTime: notificationTime.toISOString(),
        storeOpeningTime: nextOpening.toISOString(),
        message: 'Store opening notification scheduled 1 hour before opening',
      };
    } else {
      return {
        success: false,
        message: 'Notification time has already passed for today',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to schedule store opening notification',
      error: error.message,
    };
  }
};

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

const cancelAllNotifications = () => {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.cancelAllLocalNotifications();
  }
};

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

initializeNotifications();

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
