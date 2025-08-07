import {Alert, Platform} from 'react-native';
import AppointmentManager from './AppointmentManager';
import NotificationService from './NotificationService';
import {clearAuthToken} from './APIController';
import {
  formatTimeSlotDisplay,
  formatAppointmentDateTime,
} from './DateTimeUtils';

// Handle appointment clearing
export const handleAppointmentClearing = ({onAppointmentUpdate}) => {
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
            console.error('Error clearing appointment:', error);
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

// Handle user logout
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
          // Clear any existing appointment
          AppointmentManager.clearUserAppointment();

          // Clear authentication token
          clearAuthToken();

          // Call the logout callback
          if (onLogout && typeof onLogout === 'function') {
            onLogout();
          }
        } catch (error) {
          console.error('Error during logout:', error);
          // Still proceed with logout even if clearing appointment fails
          clearAuthToken(); // Ensure token is cleared even on error
          if (onLogout && typeof onLogout === 'function') {
            onLogout();
          }
        }
      },
    },
  ]);
};

// Handle test notification flow
export const handleTestNotificationFlow = async () => {
  try {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Supported', 'Notifications are only supported on iOS');
      return;
    }

    const result = await NotificationService.showTestNotification();

    if (result.success) {
      Alert.alert('Success', 'Test notification sent!');
    } else {
      Alert.alert(
        'Failed',
        result.message || 'Failed to send test notification',
      );
    }
  } catch (error) {
    console.error('Test notification error:', error);
    Alert.alert('Error', 'Failed to send test notification');
  }
};

// Process appointment booking with validation
const processAppointmentBooking = async ({
  timeSlot,
  pendingDate,
  timezone,
  user,
  onAppointmentUpdate,
}) => {
  try {
    if (!timeSlot || !pendingDate || !timezone || !user) {
      throw new Error('Missing required booking information');
    }

    // Create appointment data
    const appointmentData = {
      date: pendingDate,
      timeSlot: timeSlot,
      timezone: timezone,
      user: {
        id: user.uid || user.id,
        email: user.email,
        name: user.displayName || user.name,
      },
      bookedAt: new Date(),
    };

    // Save the appointment
    const result = AppointmentManager.saveAppointment(
      pendingDate,
      timeSlot,
      timezone,
    );

    if (result.success) {
      // Update the UI
      if (onAppointmentUpdate && typeof onAppointmentUpdate === 'function') {
        onAppointmentUpdate(result.appointment);
      }

      const formattedDateTime = formatAppointmentDateTime(
        pendingDate,
        timeSlot,
        timezone,
      );
      Alert.alert(
        'Appointment Booked!',
        `Your appointment has been scheduled for ${formattedDateTime}`,
        [{text: 'OK', style: 'default'}],
      );

      return {success: true, appointment: result.appointment};
    } else {
      throw new Error('Failed to save appointment');
    }
  } catch (error) {
    console.error('Appointment booking error:', error);
    Alert.alert(
      'Booking Failed',
      error.message || 'Failed to book appointment. Please try again.',
      [{text: 'OK', style: 'default'}],
    );
    return {success: false, error: error.message};
  }
};

// Handle time slot selection
export const handleTimeSlotSelection = async ({
  timeSlot,
  pendingDate,
  timezone,
  user,
  onAppointmentUpdate,
}) => {
  try {
    // Check if user already has an appointment
    const existingAppointment = AppointmentManager.getUserAppointment();

    if (existingAppointment) {
      // Show confirmation dialog for changing appointment
      Alert.alert(
        'Change Appointment',
        `You already have an appointment on ${formatAppointmentDateTime(
          existingAppointment.date,
          existingAppointment.timeSlot,
          existingAppointment.timezone,
        )}. Would you like to change it to ${formatTimeSlotDisplay(
          timeSlot,
          timezone,
        )}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Change',
            style: 'default',
            onPress: async () => {
              await processAppointmentBooking({
                timeSlot,
                pendingDate,
                timezone,
                user,
                onAppointmentUpdate,
              });
            },
          },
        ],
      );
    } else {
      // No existing appointment, proceed with booking
      await processAppointmentBooking({
        timeSlot,
        pendingDate,
        timezone,
        user,
        onAppointmentUpdate,
      });
    }
  } catch (error) {
    console.error('Time slot selection error:', error);
    Alert.alert(
      'Error',
      'Failed to process time slot selection. Please try again.',
      [{text: 'OK', style: 'default'}],
    );
  }
};

// Handle date selection
export const handleDateSelection = ({newDate, onDateChange}) => {
  try {
    if (onDateChange && typeof onDateChange === 'function') {
      onDateChange(newDate);
    }
  } catch (error) {
    console.error('Date selection error:', error);
  }
};

// Handle timezone update
export const handleTimezoneUpdate = ({newTimezone, onTimezoneChange}) => {
  try {
    if (onTimezoneChange && typeof onTimezoneChange === 'function') {
      onTimezoneChange(newTimezone);
    }
  } catch (error) {
    console.error('Timezone update error:', error);
  }
};

// Store opening notification scheduling
export const scheduleStoreOpeningNotification = async timezone => {
  try {
    console.log(
      '🔔 scheduleStoreOpeningNotification called with timezone:',
      timezone,
    );

    if (Platform.OS === 'ios') {
      const result = await NotificationService.scheduleStoreOpeningNotification(
        timezone,
      );
      console.log('📱 NotificationService result:', result);
      return result;
    }
    console.log('⚠️ Platform not supported for notifications:', Platform.OS);
    return {
      status: 'not_supported',
      message: 'Notifications not supported on this platform',
    };
  } catch (error) {
    console.error('🚨 Store opening notification error:', error);
    return {status: 'error', error: error.message};
  }
};

// Notification system setup
export const setupNotificationSystem = async (timezone, scheduleCallback) => {
  try {
    console.log('🔧 setupNotificationSystem called with timezone:', timezone);

    if (Platform.OS === 'ios') {
      // Initialize notifications (already done in constructor)
      // Execute callback if provided
      if (scheduleCallback && typeof scheduleCallback === 'function') {
        console.log('🔄 Executing schedule callback...');
        await scheduleCallback(timezone);
      }
      console.log('✅ Notification system initialized successfully');
      return {
        status: 'success',
        message: 'Notification system initialized successfully',
      };
    }
    console.log('⚠️ Platform not supported for notifications:', Platform.OS);
    return {
      status: 'not_supported',
      message: 'Notifications not supported on this platform',
    };
  } catch (error) {
    console.error('🚨 Notification system setup error:', error);
    return {status: 'error', error: error.message};
  }
};
