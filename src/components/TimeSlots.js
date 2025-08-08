import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Colors from '../utils/Colors';
import {
  getStoreTimesWithFallback,
  getStoreOverridesWithFallback,
} from '../utils/APIController';
import AppointmentManager from '../utils/AppointmentManager';
import {
  createBookingTimeSlots,
  isTimeSlotPast,
  formatTimeSlotDisplay,
  formatTimeInTimezone,
  SLOT_INTERVALS,
  SUPPORTED_TIMEZONES,
} from '../utils/DateTimeUtils';

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

  const generateTimeSlotsForDate = () => {
    if (loading || !selectedDate) {
      return [];
    }

    const storeHours = getStoreHoursForDate(selectedDate);

    if (!storeHours) {
      return [];
    }

    const slots = createBookingTimeSlots(
      storeHours.start_time,
      storeHours.end_time,
      SLOT_INTERVALS.QUARTER_HOUR,
      timezone,
    );

    const availableSlots = AppointmentManager.filterAvailableTimeSlots(
      slots,
      selectedDate,
    );

    return availableSlots;
  };

  // New function to determine slot availability status
  const getSlotAvailabilityStatus = timeValue => {
    if (!selectedDate || !timeValue) return 'unavailable';

    const storeHours = getStoreHoursForDate(selectedDate);

    // If store is closed, slot is unavailable
    if (!storeHours) return 'unavailable';

    // Check if slot is in the past
    if (isTimeSlotPast(selectedDate, timeValue, timezone)) {
      return 'past';
    }

    // Check if slot is already booked
    const bookedAppointments =
      AppointmentManager.getAppointmentsForDate(selectedDate);
    const isBooked = bookedAppointments.some(apt => apt.timeSlot === timeValue);
    if (isBooked) return 'booked';

    // Check if this is an override day with special availability
    if (storeHours.is_override) {
      // For override days, we can implement special logic
      // For now, we'll mark them as 'override-available'
      return 'override-available';
    }

    // Regular available slot
    return 'available';
  };

  // New function to get status indicator
  const getStatusIndicator = status => {
    switch (status) {
      case 'available':
        return '🟢'; // Green circle
      case 'override-available':
        return '🟡'; // Yellow circle for override days
      case 'booked':
        return '🔴'; // Red circle
      case 'past':
        return '⚫'; // Black circle for past slots
      default:
        return '🔴'; // Red for unavailable
    }
  };

  // New function to get all possible time slots (including booked ones) for display
  const getAllTimeSlotsForDate = () => {
    if (loading || !selectedDate) {
      return [];
    }

    const storeHours = getStoreHoursForDate(selectedDate);

    if (!storeHours) {
      return [];
    }

    // Generate all possible slots regardless of availability
    const allSlots = createBookingTimeSlots(
      storeHours.start_time,
      storeHours.end_time,
      SLOT_INTERVALS.QUARTER_HOUR,
      timezone,
    );

    return allSlots.map(slot => {
      const timeValue = slot.value || slot.time24 || slot.time24NYC;
      const status = getSlotAvailabilityStatus(timeValue);

      return {
        ...slot,
        status,
        indicator: getStatusIndicator(status),
        isClickable: status === 'available' || status === 'override-available',
      };
    });
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

  const timeSlots = generateTimeSlotsForDate();
  const allTimeSlots = getAllTimeSlotsForDate(); // Get all slots with status indicators
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

  // Count slots by status
  const slotCounts = allTimeSlots.reduce((counts, slot) => {
    counts[slot.status] = (counts[slot.status] || 0) + 1;
    return counts;
  }, {});

  return (
    <View style={styles.timeSlotsSection}>
      <Text style={styles.sectionTitle}>
        Available Time Slots (NYC Store Hours)
        <Text style={styles.timezoneNote}>
          {timezone !== SUPPORTED_TIMEZONES.NEW_YORK &&
            '\nTimes in NYC timezone - converted to your local time when confirmed'}
        </Text>
      </Text>

      {/* Legend for status indicators */}
      {allTimeSlots.length > 0 && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Status Legend:</Text>
          <View style={styles.legendItems}>
            <Text style={styles.legendItem}>🟢 Available</Text>
            <Text style={styles.legendItem}>🟡 Special Hours</Text>
            <Text style={styles.legendItem}>🔴 Booked/Unavailable</Text>
            <Text style={styles.legendItem}>⚫ Past</Text>
          </View>
        </View>
      )}

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
      ) : allTimeSlots.length === 0 ? (
        <View>
          <Text style={styles.noSlotsText}>
            No time slots available for selected date
          </Text>
        </View>
      ) : (
        <>
          {storeHours.is_override && (
            <Text style={styles.specialHoursText}>
              ⚠️ Special Hours:{' '}
              {formatTimeInTimezone(
                new Date(`2000-01-01T${storeHours.start_time}:00`),
                timezone,
              )}{' '}
              -{' '}
              {formatTimeInTimezone(
                new Date(`2000-01-01T${storeHours.end_time}:00`),
                timezone,
              )}
            </Text>
          )}

          {/* Enhanced availability info */}
          <View style={styles.availabilityStats}>
            <Text style={styles.availabilityInfo}>
              📊 {slotCounts.available || 0} available •{' '}
              {slotCounts.booked || 0} booked
              {slotCounts['override-available']
                ? ` • ${slotCounts['override-available']} special`
                : ''}
              {slotCounts.past ? ` • ${slotCounts.past} past` : ''}
            </Text>
          </View>

          <View style={styles.slotsGrid}>
            {allTimeSlots.map((slot, index) => {
              const timeValue = slot.value || slot.time24 || slot.time24NYC;
              const displayText = slot.display || slot.displayTime;
              const isSelected = selectedTimeSlot === timeValue;
              const isClickable = slot.isClickable;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.selectedTimeSlot,
                    !isClickable && styles.disabledTimeSlot,
                    slot.status === 'override-available' &&
                      styles.overrideTimeSlot,
                  ]}
                  onPress={() =>
                    isClickable ? onTimeSlotSelect(timeValue) : null
                  }
                  disabled={!isClickable}>
                  <View style={styles.slotContent}>
                    <Text style={styles.statusIndicator}>{slot.indicator}</Text>
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.selectedTimeSlotText,
                        !isClickable && styles.disabledTimeSlotText,
                      ]}>
                      {displayText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
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
  legendContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  availabilityStats: {
    marginBottom: 16,
  },
  availabilityInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    minWidth: 80,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  disabledTimeSlot: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    opacity: 0.6,
  },
  overrideTimeSlot: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusIndicator: {
    fontSize: 12,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  selectedTimeSlotText: {
    color: Colors.white,
  },
  disabledTimeSlotText: {
    color: Colors.textSecondary,
  },
});

export default TimeSlots;
