import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../utils/Colors';
import {
  getStoreTimesWithFallback,
  getStoreOverridesWithFallback,
} from '../utils/APIController';

const StoreStatus = ({timezone = 'America/New_York'}) => {
  const [storeTimes, setStoreTimes] = useState([]);
  const [storeOverrides, setStoreOverrides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [timesData, overridesData] = await Promise.all([
        getStoreTimesWithFallback(false, false),
        getStoreOverridesWithFallback(false, false),
      ]);

      setStoreTimes(timesData || []);
      setStoreOverrides(overridesData || []);
    } catch (error) {
      setStoreTimes([]);
      setStoreOverrides([]);
    } finally {
      setLoading(false);
    }
  };

  const isStoreOpen = () => {
    if (loading || storeTimes.length === 0) return false;

    // Get current time in the selected timezone
    const now = new Date();
    const timeInTimezone = now.toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(
      now.toLocaleString('en-US', {timeZone: timezone}),
    ).getDay();

    // Get current date
    const currentDate = new Date(
      now.toLocaleString('en-US', {timeZone: timezone}),
    );
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Check for date-specific overrides first
    const override = storeOverrides.find(
      override =>
        override.day === currentDay && override.month === currentMonth,
    );

    if (override) {
      if (!override.is_open) return false;
      if (
        override.start_time &&
        override.end_time &&
        override.start_time.trim() &&
        override.end_time.trim()
      ) {
        return (
          timeInTimezone >= override.start_time &&
          timeInTimezone <= override.end_time
        );
      }
      return false;
    }

    // Check regular store hours for current day of week
    const todayHours = storeTimes.find(
      storeTime => storeTime.day_of_week === dayOfWeek,
    );

    if (!todayHours || !todayHours.is_open) return false;

    // Check if current time is within store hours (with safety checks)
    if (
      todayHours.start_time &&
      todayHours.end_time &&
      todayHours.start_time.trim() &&
      todayHours.end_time.trim()
    ) {
      return (
        timeInTimezone >= todayHours.start_time &&
        timeInTimezone <= todayHours.end_time
      );
    }

    return false;
  };

  const getTodayHours = () => {
    if (loading || storeTimes.length === 0) return 'Loading...';

    const now = new Date();
    const dayOfWeek = new Date(
      now.toLocaleString('en-US', {timeZone: timezone}),
    ).getDay();

    // Get current date for override check
    const currentDate = new Date(
      now.toLocaleString('en-US', {timeZone: timezone}),
    );
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;

    // Check for date-specific overrides first
    const override = storeOverrides.find(
      override =>
        override.day === currentDay && override.month === currentMonth,
    );

    if (override) {
      if (!override.is_open) return 'Closed (Holiday/Special Day)';
      return `${formatTime(override.start_time)} - ${formatTime(
        override.end_time,
      )} (Special Hours)`;
    }

    // Check regular store hours
    const todayHours = storeTimes.find(
      storeTime => storeTime.day_of_week === dayOfWeek,
    );

    if (!todayHours || !todayHours.is_open) return 'Closed';

    return `${formatTime(todayHours.start_time)} - ${formatTime(
      todayHours.end_time,
    )}`;
  };

  const formatTime = timeString => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    let displayHour = parseInt(hour);
    let ampm = 'AM';

    if (displayHour >= 12) {
      ampm = 'PM';
      if (displayHour > 12) displayHour = displayHour - 12;
    }
    if (displayHour === 0) displayHour = 12;

    return `${displayHour}:${minute} ${ampm}`;
  };

  return (
    <View style={styles.storeSection}>
      <Text style={styles.sectionTitle}>
        Store Status (
        {timezone === 'America/New_York' ? 'NYC Time' : 'Local Time'})
      </Text>
      <View style={styles.storeStatus}>
        <View
          style={[
            styles.statusLight,
            {backgroundColor: isStoreOpen() ? Colors.success : Colors.error},
          ]}
        />
        <Text style={styles.statusText}>
          Store is {isStoreOpen() ? 'Open' : 'Closed'}
        </Text>
      </View>
      <Text style={styles.hoursText}>Today's Hours: {getTodayHours()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  storeSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  storeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default StoreStatus;
