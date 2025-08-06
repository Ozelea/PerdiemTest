import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {getDay, getDate, getMonth} from 'date-fns';
import Colors from '../utils/Colors';
import {
  getStoreTimesWithFallback,
  getStoreOverridesWithFallback,
} from '../utils/APIController';
import {
  isStoreCurrentlyOpen,
  getNextStoreOpening,
  formatTimeInTimezone,
  TIME_ZONES,
} from '../utils/DateTimeUtils';

const StoreStatus = ({timezone = TIME_ZONES.NYC}) => {
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

  const getStoreHoursForToday = () => {
    if (loading || storeTimes.length === 0) return null;

    const now = new Date();
    const dayOfWeek = getDay(now);
    const currentDay = getDate(now);
    const currentMonth = getMonth(now) + 1;

    // Check for overrides first
    const override = storeOverrides.find(
      override =>
        override.day === currentDay && override.month === currentMonth,
    );

    if (override) {
      return {
        is_open: override.is_open,
        start_time: override.start_time,
        end_time: override.end_time,
        is_override: true,
      };
    }

    // Regular hours
    const todayHours = storeTimes.find(
      storeTime => storeTime.day_of_week === dayOfWeek,
    );

    if (!todayHours) {
      return {is_open: false, start_time: null, end_time: null};
    }

    return {
      is_open: todayHours.is_open,
      start_time: todayHours.start_time,
      end_time: todayHours.end_time,
      is_override: false,
    };
  };

  const storeHours = getStoreHoursForToday();
  const isOpen = storeHours
    ? isStoreCurrentlyOpen(storeHours, timezone)
    : false;

  const getHoursDisplay = () => {
    if (loading) return 'Loading...';
    if (!storeHours || !storeHours.is_open) {
      return storeHours?.is_override
        ? 'Closed (Holiday/Special Day)'
        : 'Closed';
    }

    const startTime = formatTimeInTimezone(
      new Date(`2000-01-01T${storeHours.start_time}:00`),
      timezone,
    );
    const endTime = formatTimeInTimezone(
      new Date(`2000-01-01T${storeHours.end_time}:00`),
      timezone,
    );

    const suffix = storeHours.is_override ? ' (Special Hours)' : '';
    return `${startTime} - ${endTime}${suffix}`;
  };

  return (
    <View style={styles.storeSection}>
      <Text style={styles.sectionTitle}>
        Store Status ({timezone === TIME_ZONES.NYC ? 'NYC Time' : 'Local Time'})
      </Text>
      <View style={styles.storeStatus}>
        <View
          style={[
            styles.statusLight,
            {backgroundColor: isOpen ? Colors.success : Colors.error},
          ]}
        />
        <Text style={styles.statusText}>
          Store is {isOpen ? 'Open' : 'Closed'}
        </Text>
      </View>
      <Text style={styles.hoursText}>Today's Hours: {getHoursDisplay()}</Text>
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
