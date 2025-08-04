import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Colors from '../utils/Colors';

const TimezoneToggle = ({timezone, onTimezoneChange}) => {
  const getTimeInTimezone = timezone => {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.timezoneSection}>
      <Text style={styles.sectionTitle}>Timezone</Text>
      <View style={styles.timezoneToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            timezone === 'America/New_York' && styles.toggleButtonActive,
          ]}
          onPress={() => onTimezoneChange('America/New_York')}>
          <Text
            style={[
              styles.toggleText,
              timezone === 'America/New_York' && styles.toggleTextActive,
            ]}>
            NYC Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            timezone !== 'America/New_York' && styles.toggleButtonActive,
          ]}
          onPress={() =>
            onTimezoneChange(Intl.DateTimeFormat().resolvedOptions().timeZone)
          }>
          <Text
            style={[
              styles.toggleText,
              timezone !== 'America/New_York' && styles.toggleTextActive,
            ]}>
            Local Time
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.currentTime}>
        Current Time: {getTimeInTimezone(timezone)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timezoneSection: {
    backgroundColor: Colors.white,
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  timezoneToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  currentTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default TimezoneToggle;
