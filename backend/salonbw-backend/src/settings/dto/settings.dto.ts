import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsEmail,
    IsUrl,
    IsEnum,
    Min,
    Max,
    Length,
    Matches,
    IsArray,
} from 'class-validator';
import { CalendarView } from '../entities/calendar-settings.entity';

// Branch Settings DTOs
export class UpdateBranchSettingsDto {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    companyName?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    displayName?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{10}$/, { message: 'NIP must be 10 digits' })
    nip?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{9}(\d{5})?$/, { message: 'REGON must be 9 or 14 digits' })
    regon?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    street?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    buildingNumber?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    apartmentNumber?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}-\d{3}$/, { message: 'Postal code must be in format XX-XXX' })
    postalCode?: string;

    @IsOptional()
    @IsString()
    @Length(0, 100)
    city?: string;

    @IsOptional()
    @IsString()
    @Length(0, 100)
    country?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    phone?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    phoneSecondary?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsUrl()
    website?: string;

    @IsOptional()
    @IsUrl()
    facebookUrl?: string;

    @IsOptional()
    @IsUrl()
    instagramUrl?: string;

    @IsOptional()
    @IsUrl()
    tiktokUrl?: string;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
    primaryColor?: string;

    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;

    @IsOptional()
    @IsString()
    @Length(2, 10)
    locale?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    defaultVatRate?: number;

    @IsOptional()
    @IsBoolean()
    isVatPayer?: boolean;

    @IsOptional()
    @IsString()
    receiptFooter?: string;

    @IsOptional()
    @IsString()
    invoiceNotes?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(90)
    invoicePaymentDays?: number;

    @IsOptional()
    @IsNumber()
    @Min(30)
    gdprDataRetentionDays?: number;

    @IsOptional()
    @IsString()
    gdprConsentText?: string;
}

// Calendar Settings DTOs
export class UpdateCalendarSettingsDto {
    @IsOptional()
    @IsEnum(CalendarView)
    defaultView?: CalendarView;

    @IsOptional()
    @IsNumber()
    timeSlotDuration?: number;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
    defaultStartTime?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
    defaultEndTime?: string;

    @IsOptional()
    @IsBoolean()
    showWeekends?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(6)
    weekStartsOn?: number;

    @IsOptional()
    @IsBoolean()
    showEmployeePhotos?: boolean;

    @IsOptional()
    @IsBoolean()
    showServiceColors?: boolean;

    @IsOptional()
    @IsBoolean()
    compactView?: boolean;

    @IsOptional()
    @IsBoolean()
    allowOverlappingAppointments?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(5)
    minAppointmentDuration?: number;

    @IsOptional()
    @IsNumber()
    @Max(720)
    maxAppointmentDuration?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    bufferTimeBefore?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    bufferTimeAfter?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minBookingAdvanceHours?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(365)
    maxBookingAdvanceDays?: number;

    @IsOptional()
    @IsBoolean()
    allowSameDayBooking?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    cancellationDeadlineHours?: number;

    @IsOptional()
    @IsBoolean()
    allowClientReschedule?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    rescheduleDeadlineHours?: number;

    @IsOptional()
    @IsBoolean()
    reminderEnabled?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    reminderHoursBefore?: number;

    @IsOptional()
    @IsBoolean()
    secondReminderEnabled?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    secondReminderHoursBefore?: number;

    @IsOptional()
    @IsNumber()
    @Min(5)
    autoMarkNoshowAfterMinutes?: number;

    @IsOptional()
    @IsBoolean()
    noshowPenaltyEnabled?: boolean;

    @IsOptional()
    statusColors?: Record<string, string>;
}

// Online Booking Settings DTOs
export class UpdateOnlineBookingSettingsDto {
    @IsOptional()
    @IsBoolean()
    isEnabled?: boolean;

    @IsOptional()
    @IsString()
    bookingPageUrl?: string;

    @IsOptional()
    @IsBoolean()
    requirePhone?: boolean;

    @IsOptional()
    @IsBoolean()
    requireEmail?: boolean;

    @IsOptional()
    @IsBoolean()
    allowGuestBooking?: boolean;

    @IsOptional()
    @IsBoolean()
    requireAccount?: boolean;

    @IsOptional()
    @IsBoolean()
    showPrices?: boolean;

    @IsOptional()
    @IsBoolean()
    showDuration?: boolean;

    @IsOptional()
    @IsBoolean()
    allowMultipleServices?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    maxServicesPerBooking?: number;

    @IsOptional()
    @IsBoolean()
    allowEmployeeSelection?: boolean;

    @IsOptional()
    @IsBoolean()
    showEmployeePhotosOnline?: boolean;

    @IsOptional()
    @IsBoolean()
    autoAssignEmployee?: boolean;

    @IsOptional()
    @IsNumber()
    onlineSlotDuration?: number;

    @IsOptional()
    @IsBoolean()
    showFirstAvailable?: boolean;

    @IsOptional()
    @IsBoolean()
    requireConfirmation?: boolean;

    @IsOptional()
    @IsBoolean()
    autoConfirm?: boolean;

    @IsOptional()
    @IsBoolean()
    sendConfirmationEmail?: boolean;

    @IsOptional()
    @IsBoolean()
    sendConfirmationSms?: boolean;

    @IsOptional()
    @IsBoolean()
    requirePrepayment?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    prepaymentPercentage?: number;

    @IsOptional()
    @IsBoolean()
    acceptOnlinePayments?: boolean;

    @IsOptional()
    @IsBoolean()
    showCancellationPolicy?: boolean;

    @IsOptional()
    @IsString()
    cancellationPolicyText?: string;

    @IsOptional()
    @IsString()
    welcomeMessage?: string;

    @IsOptional()
    @IsString()
    confirmationMessage?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    bookingNotesPlaceholder?: string;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    blockedServices?: number[];

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    blockedEmployees?: number[];

    @IsOptional()
    @IsString()
    widgetTheme?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
    widgetPrimaryColor?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(24)
    widgetBorderRadius?: number;
}

// Combined settings response
export class AllSettingsDto {
    branch: UpdateBranchSettingsDto;
    calendar: UpdateCalendarSettingsDto;
    onlineBooking: UpdateOnlineBookingSettingsDto;
}
