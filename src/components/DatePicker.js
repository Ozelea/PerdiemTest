import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Colors from '../utils/Colors';

const DatePicker = ({
  selectedDate,
  onDateSelect,
  timezone = 'America/New_York',
}) => {
  // Generate next 30 days based on the selected timezone
  const getDatesForNext30Days = () => {
    const dates = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const formatDate = date => {
    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(today.getDate() + 1);

    // Compare dates by their date string to avoid timezone issues
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === tomorrowStr) {
      return 'Tomorrow';
    } else {
      return date && date.toLocaleDateString
        ? date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : 'Invalid Date';
    }
  };

  const dates = getDatesForNext30Days();

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
