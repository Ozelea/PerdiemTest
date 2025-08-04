import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Colors from '../utils/Colors';

const SelectedAppointment = ({
  selectedDate,
  selectedTimeSlot,
  timezone,
  onClearAppointment,
}) => {
  if (!selectedDate || !selectedTimeSlot) {
    return null;
  }

  const formatSelectedDate = date => {
    if (!date || date === undefined || date === null) {
      return 'No Date Selected';
    }

    // Ensure date is a Date object
    let dateObject;
    if (date instanceof Date) {
      dateObject = date;
    } else if (typeof date === 'string') {
      dateObject = new Date(date);
    } else {
      return 'Invalid Date';
    }

    // Check if date is valid
    if (isNaN(dateObject.getTime())) {
      return 'Invalid Date';
    }

    // Always show the date in the selected timezone
    const dateInTimezone = dateObject.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    });

    // If viewing in different timezone, check if date differs
    if (timezone !== 'America/New_York') {
      const nycDate = dateObject.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York',
      });

      // If dates are different, show both
      if (dateInTimezone !== nycDate) {
        const nycDateShort = dateObject.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'America/New_York',
        });

        return `${dateInTimezone} (${nycDateShort} NYC)`;
      }
    }

    return dateInTimezone;
  };

  const formatSelectedTime = timeSlot => {
    // Add defensive checks
    if (!timeSlot || timeSlot === undefined || timeSlot === null) {
      return 'No Time Selected';
    }

    // Handle case where timeSlot is already a formatted string (NYC time in HH:MM format)
    if (typeof timeSlot === 'string' && timeSlot.includes(':')) {
      const [hour, minute] = timeSlot.split(':');

      // Format NYC time for display
      let nycDisplayHour = parseInt(hour);
      let nycAmpm = 'AM';

      if (nycDisplayHour >= 12) {
        nycAmpm = 'PM';
        if (nycDisplayHour > 12) nycDisplayHour = nycDisplayHour - 12;
      }
      if (nycDisplayHour === 0) nycDisplayHour = 12;

      const nycTimeDisplay = `${nycDisplayHour}:${minute} ${nycAmpm}`;

      // If user is viewing in local time, show conversion
      if (timezone !== 'America/New_York') {
        // Calculate the timezone offset difference
        // Get current time in both timezones to calculate the difference
        const currentTimeNYC = new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });

        const currentTimeUser = new Date().toLocaleString('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });

        // Parse the times to get hour difference
        const [nycHour, nycMin] = currentTimeNYC.split(':').map(Number);
        const [userHour, userMin] = currentTimeUser.split(':').map(Number);

        // Calculate offset in hours (handling day boundary)
        let hourDiff = userHour - nycHour;
        if (hourDiff > 12) hourDiff -= 24;
        if (hourDiff < -12) hourDiff += 24;

        // Apply the offset to our appointment time
        let convertedHour = parseInt(hour) + hourDiff;
        let dayOffset = 0;

        // Handle day boundaries and track day changes
        if (convertedHour < 0) {
          convertedHour += 24;
          dayOffset = -1; // Previous day
        }
        if (convertedHour >= 24) {
          convertedHour -= 24;
          dayOffset = 1; // Next day
        }

        // Format the converted time
        let userDisplayHour = convertedHour;
        let userAmpm = 'AM';

        if (userDisplayHour >= 12) {
          userAmpm = 'PM';
          if (userDisplayHour > 12) userDisplayHour = userDisplayHour - 12;
        }
        if (userDisplayHour === 0) userDisplayHour = 12;

        const userTimeDisplay = `${userDisplayHour}:${minute} ${userAmpm}`;

        // Add day indicator if the time crosses to a different day
        let dayIndicator = '';
        if (dayOffset === 1) {
          dayIndicator = ' +1 day';
        } else if (dayOffset === -1) {
          dayIndicator = ' -1 day';
        }

        return `${nycTimeDisplay} NYC (${userTimeDisplay}${dayIndicator} local)`;
      }
      return `${nycTimeDisplay} NYC`;
    }

    // Handle case where timeSlot is an object with time property
    if (typeof timeSlot === 'object' && timeSlot.time) {
      return timeSlot.time;
    }

    // If it's an object with other properties, try to extract time info
    if (typeof timeSlot === 'object' && timeSlot.datetime) {
      try {
        const date = new Date(timeSlot.datetime);
        if (isNaN(date.getTime())) {
          console.log(
            'SelectedAppointment: Invalid datetime in timeSlot:',
            timeSlot.datetime,
          );
          return 'Invalid Time';
        }
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        console.log('SelectedAppointment: Error formatting timeSlot:', error);
        return 'Invalid Time';
      }
    }

    // Default fallback - return a string representation
    return String(timeSlot || 'Not selected');
  };

  return (
    <View style={styles.selectedSection}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Selected Appointment</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClearAppointment}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>📅 Date:</Text>
          <Text style={styles.appointmentValue}>
            {formatSelectedDate(selectedDate)}
          </Text>
        </View>
        <View style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>⏰ Time:</Text>
          <Text style={styles.appointmentValue}>
            {formatSelectedTime(selectedTimeSlot)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectedSection: {
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
  appointmentCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 80,
  },
  appointmentValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SelectedAppointment;
