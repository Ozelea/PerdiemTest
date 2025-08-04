import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Colors from '../utils/Colors';
import AppointmentManager from '../utils/AppointmentManager';

const AppointmentStats = ({onPress}) => {
  const [stats, setStats] = useState({
    hasAppointment: false,
    total: 0,
    confirmed: 0,
    upcoming: 0,
    past: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    updateStats();
    // Update stats every time component becomes visible
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const userStats = AppointmentManager.getUserAppointmentStats();
    setStats(userStats);
  };

  if (!stats.hasAppointment) {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.noAppointmentsText}>
          📅 No appointment scheduled. Book your appointment above!
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.statsContainer}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.7}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>� Your Current Appointment</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              stats.upcoming ? styles.upcomingNumber : styles.pastNumber,
            ]}>
            {stats.upcoming ? 'Upcoming' : 'Past'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.confirmedNumber]}>✓</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      {isExpanded && stats.appointment && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedText}>
            📅 Date: {new Date(stats.appointment.date).toDateString()}
          </Text>
          <Text style={styles.expandedText}>
            ⏰ Time:{' '}
            {(() => {
              const [hour, minute] = stats.appointment.timeSlot.split(':');
              let displayHour = parseInt(hour);
              let ampm = 'AM';
              if (displayHour >= 12) {
                ampm = 'PM';
                if (displayHour > 12) displayHour = displayHour - 12;
              }
              if (displayHour === 0) displayHour = 12;
              return `${displayHour}:${minute} ${ampm} NYC`;
            })()}
          </Text>
          <Text style={styles.expandedText}>
            🕒 Booked:{' '}
            {new Date(stats.appointment.bookedAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity style={styles.manageButton} onPress={onPress}>
            <Text style={styles.manageButtonText}>Change Appointment</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noAppointmentsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  expandIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  upcomingNumber: {
    color: Colors.primary,
  },
  pastNumber: {
    color: Colors.textSecondary,
  },
  confirmedNumber: {
    color: '#4CAF50', // Green color for confirmed status
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  manageButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AppointmentStats;
