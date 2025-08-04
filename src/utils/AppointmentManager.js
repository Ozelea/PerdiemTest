import Storage from './Storage';

class AppointmentManager {
  constructor() {
    this.appointmentKey = 'bookedAppointments';
    this.userAppointmentKey = 'userAppointment';
  }

  getBookedAppointments() {
    try {
      const appointments = Storage.getString(this.appointmentKey);
      return appointments ? JSON.parse(appointments) : [];
    } catch (error) {
      return [];
    }
  }

  getUserAppointment() {
    try {
      const appointment = Storage.getString(this.userAppointmentKey);
      return appointment ? JSON.parse(appointment) : null;
    } catch (error) {
      return null;
    }
  }

  saveAppointment(date, timeSlot, timezone = 'America/New_York') {
    try {
      const currentUserAppointment = this.getUserAppointment();
      let appointments = this.getBookedAppointments();

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

      Storage.setString(this.appointmentKey, JSON.stringify(appointments));
      Storage.setString(
        this.userAppointmentKey,
        JSON.stringify(newAppointment),
      );

      return {
        success: true,
        appointment: newAppointment,
        wasReplaced: !!currentUserAppointment,
      };
    } catch (error) {
      console.error('Error saving appointment:', error);
      return {success: false, error: error.message};
    }
  }

  // Clear current user's appointment
  clearUserAppointment() {
    try {
      const currentUserAppointment = this.getUserAppointment();

      if (currentUserAppointment) {
        // Remove from global appointments list
        const appointments = this.getBookedAppointments();
        const filteredAppointments = appointments.filter(
          apt => apt.id !== currentUserAppointment.id,
        );
        Storage.setString(
          this.appointmentKey,
          JSON.stringify(filteredAppointments),
        );

        // Clear user's appointment
        Storage.removeItem(this.userAppointmentKey);

        console.log('User appointment cleared:', currentUserAppointment.id);
        return {success: true, clearedAppointment: currentUserAppointment};
      }

      return {success: true, clearedAppointment: null};
    } catch (error) {
      console.error('Error clearing user appointment:', error);
      return {success: false, error: error.message};
    }
  }

  // Remove an appointment (legacy method, now redirects to clearUserAppointment)
  removeAppointment(appointmentId) {
    try {
      const userAppointment = this.getUserAppointment();
      if (userAppointment && userAppointment.id === appointmentId) {
        return this.clearUserAppointment();
      }

      // If it's not the user's appointment, just remove from global list
      const appointments = this.getBookedAppointments();
      const filteredAppointments = appointments.filter(
        apt => apt.id !== appointmentId,
      );

      Storage.setString(
        this.appointmentKey,
        JSON.stringify(filteredAppointments),
      );

      console.log('Appointment removed:', appointmentId);
      return {success: true};
    } catch (error) {
      console.error('Error removing appointment:', error);
      return {success: false, error: error.message};
    }
  }

  // Clear all appointments (admin function)
  clearAllAppointments() {
    try {
      Storage.removeItem(this.appointmentKey);
      Storage.removeItem(this.userAppointmentKey);
      console.log('All appointments cleared');
      return {success: true};
    } catch (error) {
      console.error('Error clearing appointments:', error);
      return {success: false, error: error.message};
    }
  }

  // Check if a specific time slot is available on a given date
  isTimeSlotAvailable(date, timeSlot) {
    try {
      const appointments = this.getBookedAppointments();
      const userAppointment = this.getUserAppointment();

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
  }

  // Get booked appointments for a specific date
  getAppointmentsForDate(date) {
    try {
      const appointments = this.getBookedAppointments();
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
  }

  // Get booked time slots for a specific date (array of time strings)
  getBookedTimeSlotsForDate(date) {
    try {
      const appointments = this.getAppointmentsForDate(date);
      return appointments.map(appointment => appointment.timeSlot);
    } catch (error) {
      console.error('Error getting booked time slots for date:', error);
      return [];
    }
  }

  // Filter available time slots by removing booked ones
  filterAvailableTimeSlots(timeSlots, date) {
    try {
      const bookedTimeSlots = this.getBookedTimeSlotsForDate(date);

      return timeSlots.filter(slot => {
        // Handle different slot formats
        const slotTime = typeof slot === 'string' ? slot : slot.time24NYC;
        return !bookedTimeSlots.includes(slotTime);
      });
    } catch (error) {
      console.error('Error filtering available time slots:', error);
      return timeSlots; // Return all slots if there's an error
    }
  }

  // Get appointment statistics (user-specific)
  getUserAppointmentStats() {
    try {
      const userAppointment = this.getUserAppointment();
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

      const aptDate = new Date(userAppointment.date);
      const isUpcoming =
        aptDate > now && userAppointment.status === 'confirmed';
      const isPast = aptDate < now && userAppointment.status === 'confirmed';

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
  }

  // Get appointment statistics (all appointments - for admin view)
  getAppointmentStats() {
    try {
      const appointments = this.getBookedAppointments();
      const now = new Date();

      const stats = {
        total: appointments.length,
        confirmed: appointments.filter(apt => apt.status === 'confirmed')
          .length,
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
  }

  // Find appointment by date and time
  findAppointment(date, timeSlot) {
    try {
      const appointments = this.getBookedAppointments();
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
  }

  // Update appointment status
  updateAppointmentStatus(appointmentId, newStatus) {
    try {
      const appointments = this.getBookedAppointments();
      const appointmentIndex = appointments.findIndex(
        apt => apt.id === appointmentId,
      );

      if (appointmentIndex !== -1) {
        appointments[appointmentIndex].status = newStatus;
        appointments[appointmentIndex].updatedAt = new Date().toISOString();

        Storage.setString(this.appointmentKey, JSON.stringify(appointments));

        console.log('Appointment status updated:', appointmentId, newStatus);
        return {success: true, appointment: appointments[appointmentIndex]};
      }

      return {success: false, error: 'Appointment not found'};
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return {success: false, error: error.message};
    }
  }
}

// Export singleton instance
export default new AppointmentManager();
