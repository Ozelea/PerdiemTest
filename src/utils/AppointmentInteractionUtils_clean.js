import {Alert, Platform} from 'react-native';
import AppointmentManager from './AppointmentManager';
import NotificationService from './NotificationService';
import {clearAuthToken} from './APIController';
import {
  formatTimeSlotDisplay,
  formatAppointmentDateTime,
} from './DateTimeUtils';
import axios from 'axios';
import Storage from './Storage';

const handleAppointmentClearing = ({onAppointmentUpdate}) => {
  Alert.alert(
    'Clear Appointment',
    'Are you sure you want to clear your current appointment?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          try {
            AppointmentManager.clearUserAppointment();
            if (
              onAppointmentUpdate &&
              typeof onAppointmentUpdate === 'function'
            ) {
              onAppointmentUpdate(null);
            }
            Alert.alert('Success', 'Your appointment has been cleared.');
          } catch (error) {
            Alert.alert(
              'Error',
              'Failed to clear appointment. Please try again.',
            );
          }
        },
      },
    ],
  );
};

export const handleUserLogout = ({onLogout}) => {
  Alert.alert('Logout', 'Are you sure you want to logout?', [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: () => {
        try {
          AppointmentManager.clearUserAppointment();

          clearAuthToken();

          if (onLogout && typeof onLogout === 'function') {
            onLogout();
          }
        } catch (error) {
          clearAuthToken();
          if (onLogout && typeof onLogout === 'function') {
            onLogout();
          }
        }
      },
    },
  ]);
};

export const handleTestNotificationFlow = async () => {
  try {
    const result = await NotificationService.scheduleTestNotification();

    if (result.success) {
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message || 'Failed to schedule notification');
    }

    return result;
  } catch (error) {
    const errorMessage = 'Failed to schedule test notification';
    Alert.alert('Error', errorMessage);
    return {
      success: false,
      message: errorMessage,
      error: error.message,
    };
  }
};

export const processAppointmentBooking = async ({
  selectedDate,
  selectedTimeSlot,
  timezone,
  onAppointmentUpdate,
  onNavigateToConfirmation,
}) => {
  try {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select both date and time slot.');
      return {success: false, message: 'Missing date or time slot'};
    }

    const appointmentData = {
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      timezone: timezone,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const savedAppointment = await AppointmentManager.saveUserAppointment(
      appointmentData,
    );

    if (savedAppointment) {
      if (onAppointmentUpdate) {
        onAppointmentUpdate(savedAppointment);
      }

      if (onNavigateToConfirmation) {
        onNavigateToConfirmation({
          appointment: savedAppointment,
        });
      }

      return {
        success: true,
        appointment: savedAppointment,
        message: 'Appointment booked successfully',
      };
    } else {
      Alert.alert('Error', 'Failed to save appointment. Please try again.');
      return {
        success: false,
        message: 'Failed to save appointment',
      };
    }
  } catch (error) {
    Alert.alert('Error', 'Something went wrong. Please try again.');
    return {
      success: false,
      message: 'Appointment booking failed',
      error: error.message,
    };
  }
};

export const handleTimeSlotSelection = async ({
  selectedTimeSlot,
  selectedDate,
  timezone,
  onAppointmentUpdate,
  onNavigateToConfirmation,
}) => {
  try {
    const existingAppointment = await AppointmentManager.getUserAppointment();

    if (existingAppointment) {
      Alert.alert(
        'Change Appointment',
        `You already have an appointment on ${formatAppointmentDateTime(
          existingAppointment.date,
          existingAppointment.timeSlot,
          timezone,
        )}. Do you want to change it?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Change',
            style: 'destructive',
            onPress: async () => {
              await processAppointmentBooking({
                selectedDate,
                selectedTimeSlot,
                timezone,
                onAppointmentUpdate,
                onNavigateToConfirmation,
              });
            },
          },
        ],
      );
    } else {
      await processAppointmentBooking({
        selectedDate,
        selectedTimeSlot,
        timezone,
        onAppointmentUpdate,
        onNavigateToConfirmation,
      });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to select time slot. Please try again.');
  }
};

export const handleDateSelection = ({newDate, onDateChange}) => {
  try {
    if (onDateChange && typeof onDateChange === 'function') {
      onDateChange(newDate);
    }
  } catch (error) {
    // Handle error silently
  }
};

export const handleTimezoneUpdate = ({newTimezone, onTimezoneChange}) => {
  try {
    if (onTimezoneChange && typeof onTimezoneChange === 'function') {
      onTimezoneChange(newTimezone);
    }
  } catch (error) {
    // Handle error silently
  }
};

export const scheduleStoreOpeningNotification = async timezone => {
  try {
    if (Platform.OS === 'ios') {
      return await NotificationService.scheduleStoreOpeningNotification(
        timezone,
      );
    }
    return {
      status: 'not_supported',
      message: 'Notifications not supported on this platform',
    };
  } catch (error) {
    return {status: 'error', error: error.message};
  }
};

export const setupNotificationSystem = async (timezone, scheduleCallback) => {
  try {
    if (Platform.OS === 'ios') {
      // Request permissions first
      await NotificationService.requestPermissions();
      // Then execute the schedule callback
      if (scheduleCallback && typeof scheduleCallback === 'function') {
        return await scheduleCallback();
      }
      return {
        status: 'success',
        message: 'Notification system initialized',
      };
    }
    return {
      status: 'not_supported',
      message: 'Notifications not supported on this platform',
    };
  } catch (error) {
    return {status: 'error', error: error.message};
  }
};

export {
  handleTimeSlotSelection,
  handleAppointmentClearing,
  handleUserLogout,
  handleTestNotificationFlow,
  processAppointmentBooking,
  handleDateSelection,
  handleTimezoneUpdate,
  scheduleStoreOpeningNotification,
  setupNotificationSystem,
};
