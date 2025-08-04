import {Alert, Platform} from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import Storage from './Storage';

class NotificationService {
  constructor() {
    this.isPermissionGranted = false;
    this.initializeNotifications();
  }

  async initializeNotifications() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      }).then(permissions => {
        this.isPermissionGranted = permissions.alert;
      });

      PushNotificationIOS.addEventListener(
        'notification',
        this.onNotificationReceived,
      );
      PushNotificationIOS.addEventListener(
        'localNotification',
        this.onLocalNotificationReceived,
      );
    }
  }

  onNotificationReceived = notification => {
    // Handle notification received
  };

  onLocalNotificationReceived = notification => {
    // Handle local notification received
  };

  async requestPermissions() {
    if (Platform.OS === 'ios') {
      const permissions = await PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });
      this.isPermissionGranted = permissions.alert;
      return permissions;
    }
    return {alert: false, badge: false, sound: false};
  }

  scheduleNotification(title, message, delayInMinutes = 0) {
    if (Platform.OS === 'ios') {
      const fireDate = new Date(Date.now() + delayInMinutes * 60 * 1000);

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
  }

  // Schedule a test notification
  async scheduleTestNotification() {
    try {
      this.scheduleNotification(
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
  }

  // Show test notification (alias for scheduleTestNotification)
  async showTestNotification() {
    return this.scheduleTestNotification();
  }

  // Schedule store opening notification (1 hour before store opens)
  async scheduleStoreOpeningNotification(timezone = 'America/New_York') {
    try {
      // Calculate time until 1 hour before next store opening (8 AM for 9 AM opening)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8 AM (1 hour before 9 AM opening)

      const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60);

      if (delayInMinutes > 0) {
        this.scheduleNotification(
          'Store Opening Soon!',
          'The store will open in 1 hour at 9 AM. Get ready to book your appointment!',
          delayInMinutes,
        );

        // Store the scheduled notification in MMKV
        Storage.setString(
          'lastScheduledNotification',
          new Date().toISOString(),
        );

        const storeOpeningTime = new Date(tomorrow);
        storeOpeningTime.setHours(9, 0, 0, 0); // Actual store opening at 9 AM

        return {
          success: true,
          notificationTime: new Date(
            now.getTime() + delayInMinutes * 60 * 1000,
          ).toISOString(),
          storeOpeningTime: storeOpeningTime.toISOString(),
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
  }

  // Schedule appointment reminder
  async scheduleAppointmentReminder(appointmentDate, appointmentTime) {
    try {
      const appointmentDateTime = new Date(
        `${appointmentDate} ${appointmentTime}`,
      );
      const reminderTime = new Date(
        appointmentDateTime.getTime() - 30 * 60 * 1000,
      ); // 30 minutes before
      const now = new Date();

      if (reminderTime > now) {
        const delayInMinutes =
          (reminderTime.getTime() - now.getTime()) / (1000 * 60);

        this.scheduleNotification(
          'Appointment Reminder',
          `Your appointment is in 30 minutes at ${appointmentTime}. Don't forget!`,
          delayInMinutes,
        );

        console.log(
          `Appointment reminder scheduled for ${delayInMinutes} minutes from now`,
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
      console.error('Error scheduling appointment reminder:', error);
      return {
        success: false,
        message: 'Failed to schedule appointment reminder',
        error: error.message,
      };
    }
  }

  // Cancel all notifications
  cancelAllNotifications() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.cancelAllLocalNotifications();
      console.log('All system notifications cancelled');
    } else {
      console.log('Notifications cleared (non-iOS platform)');
    }
  }

  // Get pending notifications
  async getPendingNotifications() {
    if (Platform.OS === 'ios') {
      return new Promise(resolve => {
        PushNotificationIOS.getPendingNotificationRequests(notifications => {
          resolve(notifications);
        });
      });
    }
    return [];
  }

  // Cleanup when service is destroyed
  destroy() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeEventListener(
        'notification',
        this.onNotificationReceived,
      );
      PushNotificationIOS.removeEventListener(
        'localNotification',
        this.onLocalNotificationReceived,
      );
    }
  }
}

export default new NotificationService();
