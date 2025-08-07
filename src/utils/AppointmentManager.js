import Storage from './Storage';
import {setHours, setMinutes, startOfDay, isBefore, isAfter} from 'date-fns';

// Constants for appointment management
const APPOINTMENT_KEY = 'bookedAppointments';
const USER_APPOINTMENT_KEY = 'userAppointment';

const getBookedAppointments = () => {
  try {
    const appointments = Storage.getString(APPOINTMENT_KEY);
    return appointments ? JSON.parse(appointments) : [];
  } catch (error) {
    return [];
  }
};

const getUserAppointment = () => {
  try {
    const appointment = Storage.getString(USER_APPOINTMENT_KEY);
    return appointment ? JSON.parse(appointment) : null;
  } catch (error) {
    return null;
  }
};

const saveAppointment = (date, timeSlot, timezone = 'America/New_York') => {
  try {
    const currentUserAppointment = getUserAppointment();
    let appointments = getBookedAppointments();

    if (currentUserAppointment) {
      appointments = appointments.filter(
        apt => apt.id !== currentUserAppointment.id,
      );
    }

    const newAppointment = {
      id: Date.now().toString(),
      date: date instanceof Date ? date.toISOString() : date,
      timeSlot: timeSlot,
      timezone: timezone,
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      userId: 'current_user',
    };

    appointments.push(newAppointment);

    Storage.setString(APPOINTMENT_KEY, JSON.stringify(appointments));
    Storage.setString(USER_APPOINTMENT_KEY, JSON.stringify(newAppointment));

    return {
      success: true,
      appointment: newAppointment,
      wasReplaced: !!currentUserAppointment,
    };
  } catch (error) {
    console.error('Error saving appointment:', error);
    return {success: false, error: error.message};
  }
};

// Clear current user's appointment
const clearUserAppointment = () => {
  try {
    const currentUserAppointment = getUserAppointment();

    if (currentUserAppointment) {
      // Remove from global appointments list
      const appointments = getBookedAppointments();
      const filteredAppointments = appointments.filter(
        apt => apt.id !== currentUserAppointment.id,
      );
      Storage.setString(APPOINTMENT_KEY, JSON.stringify(filteredAppointments));

      // Clear user's appointment
      Storage.removeItem(USER_APPOINTMENT_KEY);

      console.log('User appointment cleared:', currentUserAppointment.id);
      return {success: true, clearedAppointment: currentUserAppointment};
    }

    return {success: true, clearedAppointment: null};
  } catch (error) {
    console.error('Error clearing user appointment:', error);
    return {success: false, error: error.message};
  }
};

// Remove an appointment (legacy method, now redirects to clearUserAppointment)
const removeAppointment = appointmentId => {
  try {
    const userAppointment = getUserAppointment();
    if (userAppointment && userAppointment.id === appointmentId) {
      return clearUserAppointment();
    }

    // If it's not the user's appointment, just remove from global list
    const appointments = getBookedAppointments();
    const filteredAppointments = appointments.filter(
      apt => apt.id !== appointmentId,
    );

    Storage.setString(APPOINTMENT_KEY, JSON.stringify(filteredAppointments));

    console.log('Appointment removed:', appointmentId);
    return {success: true};
  } catch (error) {
    console.error('Error removing appointment:', error);
    return {success: false, error: error.message};
  }
};

// Clear all appointments (admin function)
const clearAllAppointments = () => {
  try {
    Storage.removeItem(APPOINTMENT_KEY);
    Storage.removeItem(USER_APPOINTMENT_KEY);
    console.log('All appointments cleared');
    return {success: true};
  } catch (error) {
    console.error('Error clearing appointments:', error);
    return {success: false, error: error.message};
  }
};

// Check if a specific time slot is available on a given date
const isTimeSlotAvailable = (date, timeSlot) => {
  try {
    const appointments = getBookedAppointments();
    const userAppointment = getUserAppointment();

    // Convert date to consistent format for comparison
    const targetDate =
      date instanceof Date
        ? date.toDateString()
        : new Date(date).toDateString();

    // Check if any OTHER appointment exists for this date and time slot
    // (excluding current user's appointment since they can replace it)
    const isBooked = appointments.some(appointment => {
      const appointmentDate = new Date(appointment.date).toDateString();
      const isTargetSlot =
        appointmentDate === targetDate &&
        appointment.timeSlot === timeSlot &&
        appointment.status === 'confirmed';

      // Exclude user's own appointment from availability check
      const isUserOwnAppointment =
        userAppointment && appointment.id === userAppointment.id;

      return isTargetSlot && !isUserOwnAppointment;
    });

    return !isBooked;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return true; // Default to available if there's an error
  }
};

// Get booked appointments for a specific date
const getAppointmentsForDate = date => {
  try {
    const appointments = getBookedAppointments();
    const targetDate =
      date instanceof Date
        ? date.toDateString()
        : new Date(date).toDateString();

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date).toDateString();
      return (
        appointmentDate === targetDate && appointment.status === 'confirmed'
      );
    });
  } catch (error) {
    console.error('Error getting appointments for date:', error);
    return [];
  }
};

// Get booked time slots for a specific date (array of time strings)
const getBookedTimeSlotsForDate = date => {
  try {
    const appointments = getAppointmentsForDate(date);
    return appointments.map(appointment => appointment.timeSlot);
  } catch (error) {
    console.error('Error getting booked time slots for date:', error);
    return [];
  }
};

// Filter available time slots by removing booked ones
const filterAvailableTimeSlots = (timeSlots, date) => {
  try {
    const bookedTimeSlots = getBookedTimeSlotsForDate(date);

    return timeSlots.filter(slot => {
      // Handle different slot formats
      const slotTime = typeof slot === 'string' ? slot : slot.time24NYC;
      return !bookedTimeSlots.includes(slotTime);
    });
  } catch (error) {
    console.error('Error filtering available time slots:', error);
    return timeSlots; // Return all slots if there's an error
  }
};

// Get appointment statistics (user-specific)
const getUserAppointmentStats = () => {
  try {
    const userAppointment = getUserAppointment();
    const now = new Date();

    if (!userAppointment) {
      return {
        hasAppointment: false,
        total: 0,
        confirmed: 0,
        upcoming: 0,
        past: 0,
      };
    }

    // Create full appointment datetime including both date and time
    const aptDate = new Date(userAppointment.date);
    let appointmentDateTime = aptDate;

    // If appointment has a timeSlot, include it in the comparison
    if (userAppointment.timeSlot) {
      try {
        const [hour, minute] = userAppointment.timeSlot.split(':').map(Number);
        if (!isNaN(hour) && !isNaN(minute)) {
          appointmentDateTime = setHours(
            setMinutes(startOfDay(aptDate), minute),
            hour,
          );
        }
      } catch (timeError) {
        console.error('Error parsing appointment time:', timeError);
        // Fallback to date-only comparison if time parsing fails
        appointmentDateTime = aptDate;
      }
    }

    const isUpcoming =
      isAfter(appointmentDateTime, now) &&
      userAppointment.status === 'confirmed';
    const isPast =
      isBefore(appointmentDateTime, now) &&
      userAppointment.status === 'confirmed';

    const stats = {
      hasAppointment: true,
      total: 1,
      confirmed: userAppointment.status === 'confirmed' ? 1 : 0,
      upcoming: isUpcoming ? 1 : 0,
      past: isPast ? 1 : 0,
      appointment: userAppointment,
    };

    return stats;
  } catch (error) {
    console.error('Error getting user appointment stats:', error);
    return {
      hasAppointment: false,
      total: 0,
      confirmed: 0,
      upcoming: 0,
      past: 0,
    };
  }
};

// Get appointment statistics (all appointments - for admin view)
const getAppointmentStats = () => {
  try {
    const appointments = getBookedAppointments();
    const now = new Date();

    const stats = {
      total: appointments.length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      upcoming: appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate > now && apt.status === 'confirmed';
      }).length,
      past: appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate < now && apt.status === 'confirmed';
      }).length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    return {total: 0, confirmed: 0, upcoming: 0, past: 0};
  }
};

// Find appointment by date and time
const findAppointment = (date, timeSlot) => {
  try {
    const appointments = getBookedAppointments();
    const targetDate =
      date instanceof Date
        ? date.toDateString()
        : new Date(date).toDateString();

    return appointments.find(appointment => {
      const appointmentDate = new Date(appointment.date).toDateString();
      return (
        appointmentDate === targetDate &&
        appointment.timeSlot === timeSlot &&
        appointment.status === 'confirmed'
      );
    });
  } catch (error) {
    console.error('Error finding appointment:', error);
    return null;
  }
};

// Update appointment status
const updateAppointmentStatus = (appointmentId, newStatus) => {
  try {
    const appointments = getBookedAppointments();
    const appointmentIndex = appointments.findIndex(
      apt => apt.id === appointmentId,
    );

    if (appointmentIndex !== -1) {
      appointments[appointmentIndex].status = newStatus;
      appointments[appointmentIndex].updatedAt = new Date().toISOString();

      Storage.setString(APPOINTMENT_KEY, JSON.stringify(appointments));

      console.log('Appointment status updated:', appointmentId, newStatus);
      return {success: true, appointment: appointments[appointmentIndex]};
    }

    return {success: false, error: 'Appointment not found'};
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return {success: false, error: error.message};
  }
};

// Export appointment manager functions
const AppointmentManager = {
  getBookedAppointments,
  getUserAppointment,
  saveAppointment,
  clearUserAppointment,
  removeAppointment,
  clearAllAppointments,
  isTimeSlotAvailable,
  getAppointmentsForDate,
  getBookedTimeSlotsForDate,
  filterAvailableTimeSlots,
  getUserAppointmentStats,
  getAppointmentStats,
  findAppointment,
  updateAppointmentStatus,
};

export default AppointmentManager;
