import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Colors from '../utils/Colors';
import {
  generateUpcomingDates,
  getDateLabel,
  SUPPORTED_TIMEZONES,
} from '../utils/DateTimeUtils';

const DatePicker = ({
  selectedDate,
  onDateSelect,
  timezone = SUPPORTED_TIMEZONES.NEW_YORK,
}) => {
  const dates = generateUpcomingDates(30);

  const formatDate = date => {
    return getDateLabel(date, timezone);
  };

  return (
    <View style={styles.dateSection}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dates.map((date, index) => {
          const isSelected =
            selectedDate && date.toDateString() === selectedDate.toDateString();

          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateItem, isSelected && styles.selectedDateItem]}
              onPress={() => onDateSelect(date)}>
              <Text
                style={[
                  styles.dateText,
                  isSelected && styles.selectedDateText,
                ]}>
                {formatDate(date)}
              </Text>
              <Text
                style={[styles.dayText, isSelected && styles.selectedDayText]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dateSection: {
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
  dateItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 70,
  },
  selectedDateItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectedDateText: {
    color: Colors.white,
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  selectedDayText: {
    color: Colors.white,
  },
});

export default DatePicker;
