import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../../utils/Colors';
import CustomButton from '../../../components/CustomButton';
import Storage from '../../../utils/Storage';
import {useMMKVStorage} from 'react-native-mmkv-storage';
import TimezoneToggle from '../../../components/TimezoneToggle';
import StoreStatus from '../../../components/StoreStatus';
import DatePicker from '../../../components/DatePicker';
import TimeSlots from '../../../components/TimeSlots';
import SelectedAppointment from '../../../components/SelectedAppointment';
import AppointmentStats from '../../../components/AppointmentStats';
import NotificationService from '../../../utils/NotificationService';
import AppointmentManager from '../../../utils/AppointmentManager';

export default function HomeScreen() {
  const [user, setUser] = useMMKVStorage('user', Storage);
  const [timezone, setTimezone] = useMMKVStorage(
    'timezone',
    Storage,
    'America/New_York',
  );
  const [pendingDate, setPendingDate] = useState(new Date());
  const [notificationInfo, setNotificationInfo] = useState(null);
  const [userAppointment, setUserAppointment] = useState(null);

  useEffect(() => {
    const loadUserAppointment = () => {
      const appointment = AppointmentManager.getUserAppointment();
      setUserAppointment(appointment);
    };

    loadUserAppointment();
    const interval = setInterval(loadUserAppointment, 2000);
    return () => clearInterval(interval);
  }, []);

  // Derived state from user appointment
  const confirmedDate = userAppointment ? userAppointment.date : null;
  const selectedTimeSlot = userAppointment ? userAppointment.timeSlot : null;

  const scheduleStoreOpeningNotification = useCallback(async () => {
    try {
      const result = await NotificationService.scheduleStoreOpeningNotification(
        timezone,
      );
      if (result.success) {
        console.log('Store opening notification scheduled successfully');
        setNotificationInfo({
          status: 'scheduled',
          notificationTime: result.notificationTime,
          storeOpeningTime: result.storeOpeningTime,
        });
      } else {
        console.log('Could not schedule notification:', result.message);
        setNotificationInfo({
          status: 'failed',
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      setNotificationInfo({
        status: 'error',
        error: error.message,
      });
    }
  }, [timezone]);

  // Request notification permissions and schedule notification when component mounts
  useEffect(() => {
    const setupNotifications = async () => {
      if (Platform.OS === 'ios') {
        const permissions = await NotificationService.requestPermissions();
        console.log('Notification permissions:', permissions);

        if (permissions.alert) {
          scheduleStoreOpeningNotification();
        } else {
          setNotificationInfo({
            status: 'permission_denied',
            message: 'Notification permissions not granted',
          });
        }
      } else {
        scheduleStoreOpeningNotification();
      }
    };

    setupNotifications();
  }, [scheduleStoreOpeningNotification]);

  // Legacy effect for timezone changes
  useEffect(() => {
    if (notificationInfo?.status === 'scheduled') {
      scheduleStoreOpeningNotification();
    }
  }, [timezone, scheduleStoreOpeningNotification, notificationInfo?.status]);

  const getGreeting = () => {
    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const hour = parseInt(currentTime.split(':')[0]);

    // Get user's name
    const getUserName = () => {
      if (user?.displayName) {
        return user.displayName;
      } else if (user?.name) {
        return user.name;
      } else if (user?.email) {
        // Extract name from email if no display name is available
        return user.email.split('@')[0];
      } else {
        return 'User';
      }
    };

    const userName = getUserName();

    // Get city name based on timezone
    const getCityName = () => {
      if (timezone === 'America/New_York') {
        return 'NYC';
      } else {
        // Get the local timezone and extract city name
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const cityName =
          localTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local';
        return cityName;
      }
    };

    const city = getCityName();

    if (hour >= 5 && hour <= 9) return `Good Morning, ${city}!`;
    if (hour >= 10 && hour <= 11) return `Late Morning Vibes! ${city}`;
    if (hour >= 12 && hour <= 16) return `Good Afternoon, ${city}!`;
    if (hour >= 17 && hour <= 20) return `Good Evening, ${city}!`;
    return `Night Owl in ${city}!`;
  };

  const handleDateSelect = date => {
    setPendingDate(date); // Update pending date for browsing time slots
  };

  const handleTimeSlotSelect = timeSlot => {
    // Check if the time slot is still available
    if (!AppointmentManager.isTimeSlotAvailable(pendingDate, timeSlot)) {
      Alert.alert(
        'Time Slot Unavailable',
        'This time slot has already been booked. Please select a different time.',
        [{text: 'OK', style: 'default'}],
      );
      return;
    }

    // Format time for display
    let timeDisplay = timeSlot;
    if (typeof timeSlot === 'string' && timeSlot.includes(':')) {
      const [hour, minute] = timeSlot.split(':');
      let displayHour = parseInt(hour);
      let ampm = 'AM';

      if (displayHour >= 12) {
        ampm = 'PM';
        if (displayHour > 12) displayHour = displayHour - 12;
      }
      if (displayHour === 0) displayHour = 12;

      timeDisplay = `${displayHour}:${minute} ${ampm} NYC`;
    } else {
      timeDisplay = timeSlot.display || timeSlot;
    }

    // Check if user already has an appointment
    const existingAppointment = AppointmentManager.getUserAppointment();
    const isReplacement = !!existingAppointment;

    const confirmationTitle = isReplacement
      ? 'Replace Appointment'
      : 'Confirm Appointment';
    let confirmationMessage = `Would you like to schedule an appointment for ${pendingDate.toDateString()} at ${timeDisplay}?`;

    if (isReplacement) {
      const existingDate = new Date(existingAppointment.date).toDateString();
      const existingTime = (() => {
        const [hour, minute] = existingAppointment.timeSlot.split(':');
        let displayHour = parseInt(hour);
        let ampm = 'AM';
        if (displayHour >= 12) {
          ampm = 'PM';
          if (displayHour > 12) displayHour = displayHour - 12;
        }
        if (displayHour === 0) displayHour = 12;
        return `${displayHour}:${minute} ${ampm} NYC`;
      })();

      confirmationMessage = `This will replace your existing appointment on ${existingDate} at ${existingTime}.\n\nNew appointment: ${pendingDate.toDateString()} at ${timeDisplay}`;
    }

    // Show confirmation dialog before updating appointment
    Alert.alert(confirmationTitle, confirmationMessage, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: isReplacement ? 'Replace' : 'Confirm',
        style: 'default',
        onPress: () => {
          // Double-check availability before saving
          if (!AppointmentManager.isTimeSlotAvailable(pendingDate, timeSlot)) {
            Alert.alert(
              'Booking Failed',
              'This time slot was just booked by someone else. Please select a different time.',
              [{text: 'OK', style: 'default'}],
            );
            return;
          }

          // Save appointment to AppointmentManager
          const saveResult = AppointmentManager.saveAppointment(
            pendingDate,
            timeSlot,
            timezone,
          );

          if (saveResult.success) {
            // Update local state to reflect the change immediately
            setUserAppointment(saveResult.appointment);

            const successTitle = isReplacement
              ? 'Appointment Replaced'
              : 'Appointment Confirmed';
            const successMessage = isReplacement
              ? `Your appointment has been updated to ${pendingDate.toDateString()} at ${timeDisplay}`
              : `Your appointment has been scheduled for ${pendingDate.toDateString()} at ${timeDisplay}`;

            Alert.alert(successTitle, successMessage);

            // Schedule appointment reminder notification
            const appointmentDate = pendingDate.toISOString().split('T')[0];
            NotificationService.scheduleAppointmentReminder(
              appointmentDate,
              timeSlot,
            );
          } else {
            Alert.alert(
              'Booking Failed',
              `Failed to save appointment: ${saveResult.error}`,
              [{text: 'OK', style: 'default'}],
            );
          }
        },
      },
    ]);
  };

  const handleTimezoneChange = newTimezone => {
    setTimezone(newTimezone);
  };

  const handleClearAppointment = () => {
    Alert.alert(
      'Clear Appointment',
      'Are you sure you want to clear your selected appointment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Clear the user's appointment using AppointmentManager
            const clearResult = AppointmentManager.clearUserAppointment();

            if (clearResult.success) {
              // Update local state to reflect the change
              setUserAppointment(null);

              Alert.alert(
                'Appointment Cleared',
                'Your appointment has been cleared successfully.',
              );
            } else {
              Alert.alert(
                'Clear Failed',
                `Failed to clear appointment: ${clearResult.error}`,
                [{text: 'OK', style: 'default'}],
              );
            }
          },
        },
      ],
    );
  };

  const handleTestNotification = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'iOS Only Feature',
        'Push notifications are only supported on iOS in this app.',
      );
      return;
    }

    const result = await NotificationService.showTestNotification();

    if (result.success) {
      Alert.alert(
        'Test Notification Sent',
        'Check your notification panel to see if notifications are working!',
      );
    } else if (result.needsPermission) {
      Alert.alert('Permission Required', result.message, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Settings',
          onPress: () => {
            // On iOS, you can't directly open Settings, but you can guide the user
            Alert.alert(
              'Enable Notifications',
              'Go to Settings > Test > Notifications and enable "Allow Notifications"',
            );
          },
        },
      ]);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => setUser(null),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.background}
        style={styles.gradient}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.displayName ||
                  user?.name ||
                  user?.email?.split('@')[0] ||
                  'User'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Text style={styles.logoutText}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Timezone Toggle Component */}
          <TimezoneToggle
            timezone={timezone}
            onTimezoneChange={handleTimezoneChange}
          />

          {/* Store Status Component */}
          <StoreStatus timezone={timezone} />

          {/* Appointment Statistics */}
          <AppointmentStats
            onPress={() => {
              Alert.alert(
                'Change Appointment',
                'To change your appointment, simply select a new date and time above. Your existing appointment will be automatically replaced.',
                [{text: 'Got it', style: 'default'}],
              );
            }}
          />

          {/* Selected Appointment Component */}
          <SelectedAppointment
            selectedDate={
              confirmedDate
                ? typeof confirmedDate === 'string'
                  ? new Date(confirmedDate)
                  : confirmedDate
                : null
            }
            selectedTimeSlot={selectedTimeSlot}
            timezone={timezone}
            onClearAppointment={handleClearAppointment}
          />

          {/* Date Picker Component */}
          <DatePicker
            selectedDate={pendingDate}
            onDateSelect={handleDateSelect}
            timezone={timezone}
          />

          {/* Time Slots Component */}
          <TimeSlots
            selectedDate={pendingDate}
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotSelect={handleTimeSlotSelect}
            timezone={timezone}
          />

          {/* Notification Test Section - iOS Only */}
          {Platform.OS === 'ios' && (
            <View style={styles.notificationSection}>
              <Text style={styles.sectionTitle}>🔔 Push Notifications</Text>
              <Text style={styles.sectionDescription}>
                Notifications are automatically scheduled 1 hour before store
                opening.
              </Text>

              {/* Notification Status */}
              {notificationInfo && (
                <View style={styles.notificationStatus}>
                  {notificationInfo.status === 'scheduled' ? (
                    <>
                      <Text style={styles.statusSuccessText}>
                        ✅ Notification Scheduled
                      </Text>
                      <Text style={styles.statusDetailText}>
                        You'll be notified at{' '}
                        {notificationInfo.notificationTime?.toLocaleString()}
                      </Text>
                      <Text style={styles.statusDetailText}>
                        Store opens at{' '}
                        {notificationInfo.storeOpeningTime?.toLocaleString()}
                      </Text>
                    </>
                  ) : notificationInfo.status === 'failed' ? (
                    <Text style={styles.statusFailedText}>
                      ⚠️ {notificationInfo.message}
                    </Text>
                  ) : notificationInfo.status === 'error' ? (
                    <Text style={styles.statusErrorText}>
                      ❌ Error: {notificationInfo.error}
                    </Text>
                  ) : notificationInfo.needsPermission ? (
                    <Text style={styles.statusFailedText}>
                      ⚠️ {notificationInfo.message}
                    </Text>
                  ) : (
                    <Text style={styles.statusErrorText}>
                      ❌ Error: {notificationInfo.error}
                    </Text>
                  )}
                </View>
              )}

              <CustomButton
                title="Test Notification"
                onPress={handleTestNotification}
                style={styles.testNotificationBtn}
              />
            </View>
          )}

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <CustomButton
              title="Logout"
              onPress={handleLogout}
              style={styles.logoutBtn}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 20,
  },
  notificationSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 15,
    shadowColor: Colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  testNotificationBtn: {
    backgroundColor: Colors.secondary,
  },
  notificationStatus: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: Colors.cardBackground || '#f8f9fa',
    borderRadius: 8,
  },
  statusSuccessText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  statusFailedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  statusErrorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  statusDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutBtn: {
    marginTop: 20,
  },
});
