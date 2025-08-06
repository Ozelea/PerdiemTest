import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Colors from '../utils/Colors';
import {formatAppointmentDateTime} from '../utils/DateTimeUtils';

const SelectedAppointment = ({
  selectedDate,
  selectedTimeSlot,
  timezone,
  currentTimezone,
  onClearAppointment,
}) => {
  if (!selectedDate || !selectedTimeSlot) {
    return null;
  }

  const appointmentDisplay = formatAppointmentDateTime(
    selectedDate,
    selectedTimeSlot,
    timezone,
    currentTimezone,
  );

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
          <Text style={styles.appointmentLabel}>📅 Appointment:</Text>
          <Text style={styles.appointmentValue}>{appointmentDisplay}</Text>
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
