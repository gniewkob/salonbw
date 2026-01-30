import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('online_booking_settings')
export class OnlineBookingSettings {
    @PrimaryGeneratedColumn()
    id: number;

    // General settings
    @Column({ name: 'is_enabled', default: true })
    isEnabled: boolean;

    @Column({ name: 'booking_page_url', length: 255, nullable: true })
    bookingPageUrl: string;

    // Customer requirements
    @Column({ name: 'require_phone', default: true })
    requirePhone: boolean;

    @Column({ name: 'require_email', default: true })
    requireEmail: boolean;

    @Column({ name: 'allow_guest_booking', default: false })
    allowGuestBooking: boolean;

    @Column({ name: 'require_account', default: true })
    requireAccount: boolean;

    // Service selection
    @Column({ name: 'show_prices', default: true })
    showPrices: boolean;

    @Column({ name: 'show_duration', default: true })
    showDuration: boolean;

    @Column({ name: 'allow_multiple_services', default: true })
    allowMultipleServices: boolean;

    @Column({ name: 'max_services_per_booking', default: 5 })
    maxServicesPerBooking: number;

    // Employee selection
    @Column({ name: 'allow_employee_selection', default: true })
    allowEmployeeSelection: boolean;

    @Column({ name: 'show_employee_photos_online', default: true })
    showEmployeePhotosOnline: boolean;

    @Column({ name: 'auto_assign_employee', default: false })
    autoAssignEmployee: boolean;

    // Time slot settings
    @Column({ name: 'online_slot_duration', default: 30 })
    onlineSlotDuration: number;

    @Column({ name: 'show_first_available', default: true })
    showFirstAvailable: boolean;

    // Confirmation settings
    @Column({ name: 'require_confirmation', default: true })
    requireConfirmation: boolean;

    @Column({ name: 'auto_confirm', default: false })
    autoConfirm: boolean;

    @Column({ name: 'send_confirmation_email', default: true })
    sendConfirmationEmail: boolean;

    @Column({ name: 'send_confirmation_sms', default: false })
    sendConfirmationSms: boolean;

    // Payment settings
    @Column({ name: 'require_prepayment', default: false })
    requirePrepayment: boolean;

    @Column({ name: 'prepayment_percentage', default: 100 })
    prepaymentPercentage: number;

    @Column({ name: 'accept_online_payments', default: false })
    acceptOnlinePayments: boolean;

    // Cancellation policy display
    @Column({ name: 'show_cancellation_policy', default: true })
    showCancellationPolicy: boolean;

    @Column({ name: 'cancellation_policy_text', type: 'text', nullable: true })
    cancellationPolicyText: string;

    // Custom messaging
    @Column({ name: 'welcome_message', type: 'text', nullable: true })
    welcomeMessage: string;

    @Column({ name: 'confirmation_message', type: 'text', nullable: true })
    confirmationMessage: string;

    @Column({ name: 'booking_notes_placeholder', length: 255, nullable: true })
    bookingNotesPlaceholder: string;

    // Restrictions
    @Column({
        name: 'blocked_services',
        type: 'jsonb',
        default: () => `'[]'`,
        comment: 'Service IDs that are not available for online booking',
    })
    blockedServices: number[];

    @Column({
        name: 'blocked_employees',
        type: 'jsonb',
        default: () => `'[]'`,
        comment: 'Employee IDs that are not available for online booking',
    })
    blockedEmployees: number[];

    // Widget customization
    @Column({ name: 'widget_theme', length: 20, default: 'light' })
    widgetTheme: string;

    @Column({ name: 'widget_primary_color', length: 7, nullable: true })
    widgetPrimaryColor: string;

    @Column({ name: 'widget_border_radius', default: 8 })
    widgetBorderRadius: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
