import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
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
import {
  generateGreeting,
  getAppointmentGreeting,
} from '../../../utils/GreetingUtils';
import {
  formatAppointmentDateTime,
  formatTimeSlotDisplay,
  SUPPORTED_TIMEZONES,
  parseDateSafely,
} from '../../../utils/DateTimeUtils';
import {
  handleTimeSlotSelection,
  handleAppointmentClearing,
  handleUserLogout,
  handleTimezoneUpdate,
  handleDateSelection,
  scheduleStoreOpeningNotification,
  setupNotificationSystem,
} from '../../../utils/AppointmentInteractionUtils';

export default function HomeScreen() {
  const [user, setUser] = useMMKVStorage('user', Storage);
  const [timezone, setTimezone] = useMMKVStorage(
    'timezone',
    Storage,
    SUPPORTED_TIMEZONES.NEW_YORK,
  );
  const [pendingDate, setPendingDate] = useState(new Date());
  const [userAppointment, setUserAppointment] = useState(null);

  useEffect(() => {
    const loadUserAppointment = () => {
      const appointment = AppointmentManager.getUserAppointment();
      setUserAppointment(appointment);
    };

    loadUserAppointment();
    // Reduced frequency from 2 seconds to 30 seconds for better performance
    const interval = setInterval(loadUserAppointment, 30000);
    return () => clearInterval(interval);
  }, []);

  const confirmedDate = userAppointment ? userAppointment.date : null;
  const selectedTimeSlot = userAppointment ? userAppointment.timeSlot : null;

  const scheduleNotification = useCallback(async () => {
    const result = await scheduleStoreOpeningNotification(timezone);
    setNotificationInfo(result);
  }, [timezone]);

  useEffect(() => {
    const initializeNotifications = async () => {
      const result = await setupNotificationSystem(timezone, () =>
        scheduleStoreOpeningNotification(timezone),
      );
    };

    initializeNotifications();
  }, [timezone]);

  const greeting = useMemo(() => {
    const appointmentCount = userAppointment ? 1 : 0;
    const result = getAppointmentGreeting(appointmentCount, timezone);
    return result;
  }, [userAppointment, timezone]);

  const handleDateSelect = date => {
    handleDateSelection({newDate: date, onDateChange: setPendingDate});
  };

  const handleTimeSlotSelect = timeSlot => {
    handleTimeSlotSelection({
      timeSlot,
      pendingDate,
      timezone,
      user,
      onAppointmentUpdate: setUserAppointment,
    });
  };

  const handleTimezoneChange = newTimezone => {
    handleTimezoneUpdate({newTimezone, onTimezoneChange: setTimezone});
  };

  const handleClearAppointment = () => {
    handleAppointmentClearing({onAppointmentUpdate: setUserAppointment});
  };

  const handleLogout = () => {
    handleUserLogout({onLogout: () => setUser(null)});
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
              <Text style={styles.welcomeText}>{greeting}</Text>
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
            timezone={userAppointment ? userAppointment.timezone : timezone}
            currentTimezone={timezone}
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
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutBtn: {
    marginTop: 20,
  },
});
