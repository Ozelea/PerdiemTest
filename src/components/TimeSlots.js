import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Colors from '../utils/Colors';
import {
  getStoreTimesWithFallback,
  getStoreOverridesWithFallback,
} from '../utils/APIController';
import AppointmentManager from '../utils/AppointmentManager';

const TimeSlots = ({
  selectedDate,
  selectedTimeSlot,
  onTimeSlotSelect,
  timezone,
}) => {
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

  const getStoreHoursForDate = date => {
    if (!date || storeTimes.length === 0) return null;

    const dayOfWeek = date.getDay();
    const selectedDay = date.getDate();
    const selectedMonth = date.getMonth() + 1;

    // Check for date-specific overrides first
    const override = storeOverrides.find(
      override =>
        override.day === selectedDay && override.month === selectedMonth,
    );

    if (override) {
      if (!override.is_open) return null;
      if (
        override.start_time &&
        override.end_time &&
        override.start_time.trim() &&
        override.end_time.trim()
      ) {
        return {
          start_time: override.start_time,
          end_time: override.end_time,
          is_override: true,
        };
      }
      return null;
    }

    // Check regular store hours
    const dayHours = storeTimes.find(
      storeTime => storeTime.day_of_week === dayOfWeek,
    );

    if (!dayHours || !dayHours.is_open) return null;

    // Check if regular hours have valid times
    if (
      dayHours.start_time &&
      dayHours.end_time &&
      dayHours.start_time.trim() &&
      dayHours.end_time.trim()
    ) {
      return {
        start_time: dayHours.start_time,
        end_time: dayHours.end_time,
        is_override: false,
      };
    }

    return null; // Invalid regular hours data
  };

  const generateTimeSlots = () => {
    if (loading || !selectedDate) {
      return [];
    }

    const storeHours = getStoreHoursForDate(selectedDate);

    if (!storeHours) {
      return []; // Store is closed on selected date
    }

    const slots = [];
    const [startHour, startMinute] = storeHours.start_time
      .split(':')
      .map(Number);
    const [endHour, endMinute] = storeHours.end_time.split(':').map(Number);

    // Convert end time to minutes for easier comparison
    const endTotalMinutes = endHour * 60 + endMinute;

    let currentHour = startHour;
    let currentMinute = startMinute;

    // Round start time to next 15-minute interval
    const remainder = currentMinute % 15;
    if (remainder !== 0) {
      currentMinute += 15 - remainder;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    while (true) {
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      // Stop if we've reached or passed the end time
      if (currentTotalMinutes >= endTotalMinutes) break;

      // Store the original NYC time for backend/scheduling purposes
      const time24NYC = `${currentHour
        .toString()
        .padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // Format for display
      let displayHour = currentHour;
      let ampm = 'AM';

      if (currentHour >= 12) {
        ampm = 'PM';
        if (currentHour > 12) displayHour = currentHour - 12;
      }
      if (currentHour === 0) displayHour = 12;

      const displayTime = `${displayHour}:${currentMinute
        .toString()
        .padStart(2, '0')} ${ampm}`;

      slots.push({
        time24NYC, // Original NYC time for scheduling (HH:MM format)
        displayTime, // Time shown to user
        display: displayTime,
        nycHour: currentHour,
        nycMinute: currentMinute,
      });

      // Add 15 minutes
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    // Filter out already booked appointments
    const availableSlots = AppointmentManager.filterAvailableTimeSlots(
      slots,
      selectedDate,
    );

    return availableSlots;
  };

  if (!selectedDate) {
    return (
      <View style={styles.timeSlotsSection}>
        <Text style={styles.sectionTitle}>Available Time Slots</Text>
        <Text style={styles.noDateText}>Please select a date first</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.timeSlotsSection}>
        <Text style={styles.sectionTitle}>Available Time Slots</Text>
        <Text style={styles.noDateText}>Loading store hours...</Text>
      </View>
    );
  }

  const timeSlots = generateTimeSlots();
  const storeHours = getStoreHoursForDate(selectedDate);

  // Get total possible slots vs available slots for better messaging
  const totalPossibleSlots = storeHours
    ? (() => {
        const [startHour, startMinute] = storeHours.start_time
          .split(':')
          .map(Number);
        const [endHour, endMinute] = storeHours.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        return Math.floor((endMinutes - startMinutes) / 15);
      })()
    : 0;

  const bookedAppointments =
    AppointmentManager.getAppointmentsForDate(selectedDate);

  return (
    <View style={styles.timeSlotsSection}>
      <Text style={styles.sectionTitle}>
        Available Time Slots (NYC Store Hours)
        <Text style={styles.timezoneNote}>
          {timezone !== 'America/New_York' &&
            '\nTimes in NYC timezone - converted to your local time when confirmed'}
        </Text>
      </Text>

      {!storeHours ? (
        <Text style={styles.closedText}>
          Store is closed on{' '}
          {selectedDate && selectedDate.toLocaleDateString
            ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
            : 'Selected Date'}
        </Text>
      ) : timeSlots.length === 0 ? (
        <View>
          <Text style={styles.noSlotsText}>
            {bookedAppointments.length > 0
              ? `All ${totalPossibleSlots} time slots are booked for this date`
              : 'No available time slots for selected date'}
          </Text>
          {bookedAppointments.length > 0 && (
            <Text style={styles.bookedSlotsInfo}>
              📅 {bookedAppointments.length} appointment
              {bookedAppointments.length > 1 ? 's' : ''} already booked
            </Text>
          )}
        </View>
      ) : (
        <>
          {storeHours.is_override && (
            <Text style={styles.specialHoursText}>
              ⚠️ Special Hours: {formatTime(storeHours.start_time)} -{' '}
              {formatTime(storeHours.end_time)}
            </Text>
          )}
          {bookedAppointments.length > 0 && (
            <Text style={styles.availabilityInfo}>
              📊 {timeSlots.length} available • {bookedAppointments.length}{' '}
              booked
            </Text>
          )}
          <View style={styles.slotsGrid}>
            {timeSlots.map((slot, index) => {
              const isSelected = selectedTimeSlot === slot.time24NYC;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.selectedTimeSlot,
                  ]}
                  onPress={() => onTimeSlotSelect(slot.time24NYC)}>
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.selectedTimeSlotText,
                    ]}>
                    {slot.display}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );

  // Helper function to format time
  function formatTime(timeString) {
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
  }
};

const styles = StyleSheet.create({
  timeSlotsSection: {
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
  timezoneNote: {
    fontSize: 12,
    fontWeight: 'normal',
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  noDateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  closedText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 20,
  },
  noSlotsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  specialHoursText: {
    fontSize: 14,
    color: Colors.warning || '#f39c12',
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  availabilityInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  bookedSlotsInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectedTimeSlotText: {
    color: Colors.white,
  },
});

export default TimeSlots;
