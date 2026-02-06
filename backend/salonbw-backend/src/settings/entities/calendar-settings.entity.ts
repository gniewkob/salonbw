import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum CalendarView {
    Day = 'day',
    Week = 'week',
    Month = 'month',
}

export enum TimeSlotDuration {
    Minutes15 = 15,
    Minutes30 = 30,
    Minutes60 = 60,
}

@Entity('calendar_settings')
export class CalendarSettings {
    @PrimaryGeneratedColumn()
    id: number;

    // Default view settings
    @Column({
        name: 'default_view',
        type: 'enum',
        enum: CalendarView,
        default: CalendarView.Day,
    })
    defaultView: CalendarView;

    @Column({
        name: 'time_slot_duration',
        type: 'int',
        default: TimeSlotDuration.Minutes15,
    })
    timeSlotDuration: number;

    // Working hours
    @Column({ name: 'default_start_time', type: 'time', default: '08:00:00' })
    defaultStartTime: string;

    @Column({ name: 'default_end_time', type: 'time', default: '20:00:00' })
    defaultEndTime: string;

    // Display settings
    @Column({ name: 'show_weekends', default: false })
    showWeekends: boolean;

    @Column({ name: 'week_starts_on', default: 1 })
    weekStartsOn: number;

    @Column({ name: 'show_employee_photos', default: true })
    showEmployeePhotos: boolean;

    @Column({ name: 'show_service_colors', default: true })
    showServiceColors: boolean;

    @Column({ name: 'compact_view', default: false })
    compactView: boolean;

    // Appointment settings
    @Column({ name: 'allow_overlapping_appointments', default: false })
    allowOverlappingAppointments: boolean;

    @Column({ name: 'min_appointment_duration', default: 15 })
    minAppointmentDuration: number;

    @Column({ name: 'max_appointment_duration', default: 480 })
    maxAppointmentDuration: number;

    @Column({ name: 'buffer_time_before', default: 0 })
    bufferTimeBefore: number;

    @Column({ name: 'buffer_time_after', default: 0 })
    bufferTimeAfter: number;

    // Booking rules
    @Column({ name: 'min_booking_advance_hours', default: 1 })
    minBookingAdvanceHours: number;

    @Column({ name: 'max_booking_advance_days', default: 90 })
    maxBookingAdvanceDays: number;

    @Column({ name: 'allow_same_day_booking', default: true })
    allowSameDayBooking: boolean;

    // Cancellation policy
    @Column({ name: 'cancellation_deadline_hours', default: 24 })
    cancellationDeadlineHours: number;

    @Column({ name: 'allow_client_reschedule', default: true })
    allowClientReschedule: boolean;

    @Column({ name: 'reschedule_deadline_hours', default: 24 })
    rescheduleDeadlineHours: number;

    // Reminder settings
    @Column({ name: 'reminder_enabled', default: true })
    reminderEnabled: boolean;

    @Column({ name: 'reminder_hours_before', default: 24 })
    reminderHoursBefore: number;

    @Column({ name: 'second_reminder_enabled', default: false })
    secondReminderEnabled: boolean;

    @Column({ name: 'second_reminder_hours_before', default: 2 })
    secondReminderHoursBefore: number;

    // No-show handling
    @Column({ name: 'auto_mark_noshow_after_minutes', default: 30 })
    autoMarkNoshowAfterMinutes: number;

    @Column({ name: 'noshow_penalty_enabled', default: false })
    noshowPenaltyEnabled: boolean;

    // Colors for appointment statuses
    @Column({
        name: 'status_colors',
        type: 'jsonb',
        default: () =>
            `'{"pending": "#FFC107", "confirmed": "#28A745", "in_progress": "#17A2B8", "completed": "#6C757D", "cancelled": "#DC3545", "no_show": "#343A40"}'`,
    })
    statusColors: Record<string, string>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
