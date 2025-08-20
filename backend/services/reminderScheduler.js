import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import pushNotificationService from '../services/pushNotificationService.js';

class ReminderScheduler {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the reminder scheduler
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('Initializing Reminder Scheduler...');

    // Schedule appointment reminders to run every hour
    cron.schedule('0 * * * *', async () => {
      await this.processAppointmentReminders();
    });

    // Schedule medication reminders to run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.processMedicationReminders();
    });

    // Schedule pregnancy milestone reminders to run daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.processPregnancyMilestones();
    });

    // Schedule health checkup reminders to run daily at 8 AM
    cron.schedule('0 8 * * *', async () => {
      await this.processHealthCheckupReminders();
    });

    // Clean up expired reminders daily at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupExpiredReminders();
    });

    this.isInitialized = true;
    console.log('Reminder Scheduler initialized successfully');
  }

  /**
   * Process appointment reminders (24h and 1h before)
   */
  async processAppointmentReminders() {
    try {
      console.log('Processing appointment reminders...');

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const oneHourFromNow = new Date(now);
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      // Find appointments happening in 24 hours (with 1-hour window)
      const tomorrowStart = new Date(tomorrow);
      tomorrowStart.setHours(tomorrow.getHours() - 1);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(tomorrow.getHours() + 1);

      const appointmentsIn24h = await Appointment.find({
        appointmentDate: {
          $gte: tomorrowStart,
          $lte: tomorrowEnd
        },
        status: { $in: ['scheduled', 'confirmed'] },
        isActive: true,
        remindersSent: { $ne: '24h' }
      }).populate([
        {
          path: 'patient',
          populate: {
            path: 'user',
            select: 'firstName lastName _id'
          }
        },
        {
          path: 'healthcareProvider',
          select: 'firstName lastName'
        }
      ]);

      // Find appointments happening in 1 hour (with 15-minute window)
      const oneHourStart = new Date(oneHourFromNow);
      oneHourStart.setMinutes(oneHourFromNow.getMinutes() - 15);
      const oneHourEnd = new Date(oneHourFromNow);
      oneHourEnd.setMinutes(oneHourFromNow.getMinutes() + 15);

      const appointmentsIn1h = await Appointment.find({
        appointmentDate: {
          $gte: oneHourStart,
          $lte: oneHourEnd
        },
        status: { $in: ['scheduled', 'confirmed'] },
        isActive: true,
        remindersSent: { $ne: '1h' }
      }).populate([
        {
          path: 'patient',
          populate: {
            path: 'user',
            select: 'firstName lastName _id'
          }
        },
        {
          path: 'healthcareProvider',
          select: 'firstName lastName'
        }
      ]);

      // Send 24-hour reminders
      for (const appointment of appointmentsIn24h) {
        if (appointment.patient?.user?._id) {
          const doctorName = appointment.healthcareProvider 
            ? `Dr. ${appointment.healthcareProvider.firstName} ${appointment.healthcareProvider.lastName}`
            : 'your healthcare provider';

          const success = await pushNotificationService.sendAppointmentReminder(
            appointment.patient.user._id.toString(),
            {
              id: appointment._id,
              doctor: doctorName,
              time: appointment.appointmentTime,
              date: appointment.appointmentDate
            },
            '24h'
          );

          if (success) {
            await Appointment.findByIdAndUpdate(appointment._id, {
              remindersSent: '24h'
            });
            console.log(`Sent 24h reminder for appointment ${appointment._id}`);
          }
        }
      }

      // Send 1-hour reminders
      for (const appointment of appointmentsIn1h) {
        if (appointment.patient?.user?._id) {
          const doctorName = appointment.healthcareProvider 
            ? `Dr. ${appointment.healthcareProvider.firstName} ${appointment.healthcareProvider.lastName}`
            : 'your healthcare provider';

          const success = await pushNotificationService.sendAppointmentReminder(
            appointment.patient.user._id.toString(),
            {
              id: appointment._id,
              doctor: doctorName,
              time: appointment.appointmentTime,
              date: appointment.appointmentDate
            },
            '1h'
          );

          if (success) {
            await Appointment.findByIdAndUpdate(appointment._id, {
              remindersSent: '1h'
            });
            console.log(`Sent 1h reminder for appointment ${appointment._id}`);
          }
        }
      }

      console.log(`Processed ${appointmentsIn24h.length} 24h reminders and ${appointmentsIn1h.length} 1h reminders`);
    } catch (error) {
      console.error('Error processing appointment reminders:', error);
    }
  }

  /**
   * Process medication reminders
   */
  async processMedicationReminders() {
    try {
      console.log('Processing medication reminders...');

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Find patients with active medications
      const patientsWithMedications = await Patient.find({
        'medications.0': { $exists: true },
        isActive: true
      }).populate('user', 'firstName lastName _id');

      for (const patient of patientsWithMedications) {
        if (!patient.user?._id) continue;

        for (const medication of patient.medications) {
          if (!medication.frequency || !medication.startDate) continue;
          
          const startDate = new Date(medication.startDate);
          if (startDate > now) continue; // Medication hasn't started yet
          
          if (medication.endDate && new Date(medication.endDate) < now) {
            continue; // Medication has ended
          }

          // Parse frequency (e.g., "3 times daily", "twice daily", etc.)
          const reminderTimes = this.getMedicationReminderTimes(medication.frequency);
          
          for (const reminderTime of reminderTimes) {
            const [hours, minutes] = reminderTime.split(':').map(Number);
            
            // Check if it's time for this medication (within 15-minute window)
            const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (hours * 60 + minutes));
            
            if (timeDiff <= 15) {
              const success = await pushNotificationService.sendMedicationReminder(
                patient.user._id.toString(),
                {
                  id: medication._id,
                  name: medication.name,
                  dosage: medication.dosage
                }
              );

              if (success) {
                console.log(`Sent medication reminder for ${medication.name} to patient ${patient.user._id}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing medication reminders:', error);
    }
  }

  /**
   * Process pregnancy milestone reminders
   */
  async processPregnancyMilestones() {
    try {
      console.log('Processing pregnancy milestone reminders...');

      const pregnantPatients = await Patient.find({
        'currentPregnancy.isPregnant': true,
        isActive: true
      }).populate('user', 'firstName lastName _id');

      for (const patient of pregnantPatients) {
        if (!patient.user?._id || !patient.currentPregnancy?.currentWeek) continue;

        const currentWeek = patient.currentPregnancy.currentWeek;
        const milestone = this.getPregnancyMilestone(currentWeek);

        if (milestone) {
          const success = await pushNotificationService.sendGeneralNotification(
            patient.user._id.toString(),
            `Week ${currentWeek} Milestone`,
            milestone.message,
            {
              type: 'pregnancy_milestone',
              week: currentWeek,
              category: milestone.category
            }
          );

          if (success) {
            console.log(`Sent pregnancy milestone for week ${currentWeek} to patient ${patient.user._id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing pregnancy milestones:', error);
    }
  }

  /**
   * Process health checkup reminders
   */
  async processHealthCheckupReminders() {
    try {
      console.log('Processing health checkup reminders...');

      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Find patients who haven't had a checkup in 6 months
      const patientsNeedingCheckup = await Patient.find({
        $or: [
          { lastVisit: { $lt: sixMonthsAgo } },
          { lastVisit: { $exists: false } }
        ],
        isActive: true
      }).populate('user', 'firstName lastName _id');

      for (const patient of patientsNeedingCheckup) {
        if (!patient.user?._id) continue;

        // Check if they have any upcoming appointments
        const upcomingAppointments = await Appointment.countDocuments({
          patient: patient._id,
          appointmentDate: { $gte: now },
          status: { $in: ['scheduled', 'confirmed', 'pending'] },
          isActive: true
        });

        if (upcomingAppointments === 0) {
          const success = await pushNotificationService.sendGeneralNotification(
            patient.user._id.toString(),
            'Health Checkup Reminder',
            'It\'s time for your regular health checkup. Please schedule an appointment with your healthcare provider.',
            {
              type: 'checkup_reminder',
              lastVisit: patient.lastVisit
            }
          );

          if (success) {
            console.log(`Sent checkup reminder to patient ${patient.user._id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing health checkup reminders:', error);
    }
  }

  /**
   * Clean up expired reminders and old data
   */
  async cleanupExpiredReminders() {
    try {
      console.log('Cleaning up expired reminders...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Reset reminder flags for old appointments
      await Appointment.updateMany(
        {
          appointmentDate: { $lt: thirtyDaysAgo },
          remindersSent: { $exists: true }
        },
        {
          $unset: { remindersSent: "" }
        }
      );

      console.log('Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get medication reminder times based on frequency
   */
  getMedicationReminderTimes(frequency) {
    const frequencyMap = {
      'once daily': ['09:00'],
      'twice daily': ['09:00', '21:00'],
      '3 times daily': ['08:00', '14:00', '20:00'],
      '4 times daily': ['08:00', '12:00', '16:00', '20:00'],
      'before meals': ['07:30', '12:30', '18:30'],
      'after meals': ['08:30', '13:30', '19:30'],
      'every 4 hours': ['06:00', '10:00', '14:00', '18:00', '22:00'],
      'every 6 hours': ['06:00', '12:00', '18:00', '00:00'],
      'every 8 hours': ['08:00', '16:00', '00:00'],
      'every 12 hours': ['08:00', '20:00']
    };

    return frequencyMap[frequency.toLowerCase()] || ['09:00'];
  }

  /**
   * Get pregnancy milestone information
   */
  getPregnancyMilestone(week) {
    const milestones = {
      4: {
        category: 'early',
        message: 'Your baby\'s heart is starting to beat! Consider taking prenatal vitamins if you haven\'t already.'
      },
      8: {
        category: 'early',
        message: 'Your baby is now the size of a raspberry! Most major organs are forming.'
      },
      12: {
        category: 'milestone',
        message: 'End of first trimester! Risk of miscarriage decreases significantly. Time for your first prenatal appointment if you haven\'t had one.'
      },
      16: {
        category: 'milestone',
        message: 'You might start feeling baby\'s movements soon! Consider scheduling your anatomy scan.'
      },
      20: {
        category: 'milestone',
        message: 'Halfway point! Time for your detailed anatomy scan to check baby\'s development.'
      },
      24: {
        category: 'milestone',
        message: 'Your baby can now hear sounds from outside the womb! Start thinking about baby names.'
      },
      28: {
        category: 'milestone',
        message: 'Welcome to the third trimester! Your baby\'s survival rate is very high if born now.'
      },
      32: {
        category: 'late',
        message: 'Your baby is gaining weight rapidly. Consider preparing your birth plan.'
      },
      36: {
        category: 'milestone',
        message: 'Your baby is considered full-term soon! Make sure your hospital bag is ready.'
      },
      40: {
        category: 'milestone',
        message: 'You\'ve reached your due date! Your baby could arrive any day now.'
      }
    };

    return milestones[week] || null;
  }

  /**
   * Schedule a custom reminder
   */
  async scheduleCustomReminder(userId, title, body, scheduledTime, data = {}) {
    try {
      const jobId = `custom_${userId}_${Date.now()}`;
      
      const job = cron.schedule(
        this.dateToSchedule(scheduledTime),
        async () => {
          await pushNotificationService.sendGeneralNotification(
            userId,
            title,
            body,
            { ...data, type: 'custom_reminder' }
          );
          
          // Remove job after execution
          this.jobs.delete(jobId);
        },
        { scheduled: false }
      );

      this.jobs.set(jobId, job);
      job.start();
      
      console.log(`Scheduled custom reminder ${jobId} for user ${userId}`);
      return jobId;
    } catch (error) {
      console.error('Error scheduling custom reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  cancelReminder(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.destroy();
      this.jobs.delete(jobId);
      console.log(`Cancelled reminder ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Convert Date to cron schedule format
   */
  dateToSchedule(date) {
    const d = new Date(date);
    return `${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth() + 1} *`;
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      activeJobs: this.jobs.size,
      uptime: process.uptime()
    };
  }
}

export default new ReminderScheduler();
