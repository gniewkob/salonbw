import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTables1710020000000 implements MigrationInterface {
    name = 'CreateSettingsTables1710020000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create branch_settings table
        await queryRunner.query(`
            CREATE TABLE "branch_settings" (
                "id" SERIAL PRIMARY KEY,
                "company_name" VARCHAR(255) NOT NULL,
                "display_name" VARCHAR(255),
                "nip" VARCHAR(20),
                "regon" VARCHAR(20),
                "street" VARCHAR(255),
                "building_number" VARCHAR(20),
                "apartment_number" VARCHAR(20),
                "postal_code" VARCHAR(10),
                "city" VARCHAR(100),
                "country" VARCHAR(100),
                "phone" VARCHAR(20),
                "phone_secondary" VARCHAR(20),
                "email" VARCHAR(255),
                "website" VARCHAR(255),
                "facebook_url" VARCHAR(255),
                "instagram_url" VARCHAR(255),
                "tiktok_url" VARCHAR(255),
                "logo_url" VARCHAR(500),
                "primary_color" VARCHAR(7) DEFAULT '#25B4C1',
                "currency" VARCHAR(3) DEFAULT 'PLN',
                "locale" VARCHAR(10) DEFAULT 'pl',
                "timezone" VARCHAR(50) DEFAULT 'Europe/Warsaw',
                "default_vat_rate" DECIMAL(5,2) DEFAULT 23,
                "is_vat_payer" BOOLEAN DEFAULT true,
                "receipt_footer" TEXT,
                "invoice_notes" TEXT,
                "invoice_payment_days" INTEGER DEFAULT 14,
                "gdpr_data_retention_days" INTEGER DEFAULT 1095,
                "gdpr_consent_text" TEXT,
                "is_active" BOOLEAN DEFAULT true,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create calendar_settings table
        await queryRunner.query(`
            CREATE TYPE "calendar_view_enum" AS ENUM ('day', 'week', 'month')
        `);

        await queryRunner.query(`
            CREATE TABLE "calendar_settings" (
                "id" SERIAL PRIMARY KEY,
                "default_view" calendar_view_enum DEFAULT 'day',
                "time_slot_duration" INTEGER DEFAULT 15,
                "default_start_time" TIME DEFAULT '08:00:00',
                "default_end_time" TIME DEFAULT '20:00:00',
                "show_weekends" BOOLEAN DEFAULT false,
                "week_starts_on" INTEGER DEFAULT 1,
                "show_employee_photos" BOOLEAN DEFAULT true,
                "show_service_colors" BOOLEAN DEFAULT true,
                "compact_view" BOOLEAN DEFAULT false,
                "allow_overlapping_appointments" BOOLEAN DEFAULT false,
                "min_appointment_duration" INTEGER DEFAULT 15,
                "max_appointment_duration" INTEGER DEFAULT 480,
                "buffer_time_before" INTEGER DEFAULT 0,
                "buffer_time_after" INTEGER DEFAULT 0,
                "min_booking_advance_hours" INTEGER DEFAULT 1,
                "max_booking_advance_days" INTEGER DEFAULT 90,
                "allow_same_day_booking" BOOLEAN DEFAULT true,
                "cancellation_deadline_hours" INTEGER DEFAULT 24,
                "allow_client_reschedule" BOOLEAN DEFAULT true,
                "reschedule_deadline_hours" INTEGER DEFAULT 24,
                "reminder_enabled" BOOLEAN DEFAULT true,
                "reminder_hours_before" INTEGER DEFAULT 24,
                "second_reminder_enabled" BOOLEAN DEFAULT false,
                "second_reminder_hours_before" INTEGER DEFAULT 2,
                "auto_mark_noshow_after_minutes" INTEGER DEFAULT 30,
                "noshow_penalty_enabled" BOOLEAN DEFAULT false,
                "status_colors" JSONB DEFAULT '{"pending": "#FFC107", "confirmed": "#28A745", "in_progress": "#17A2B8", "completed": "#6C757D", "cancelled": "#DC3545", "no_show": "#343A40"}',
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create online_booking_settings table
        await queryRunner.query(`
            CREATE TABLE "online_booking_settings" (
                "id" SERIAL PRIMARY KEY,
                "is_enabled" BOOLEAN DEFAULT true,
                "booking_page_url" VARCHAR(255),
                "require_phone" BOOLEAN DEFAULT true,
                "require_email" BOOLEAN DEFAULT true,
                "allow_guest_booking" BOOLEAN DEFAULT false,
                "require_account" BOOLEAN DEFAULT true,
                "show_prices" BOOLEAN DEFAULT true,
                "show_duration" BOOLEAN DEFAULT true,
                "allow_multiple_services" BOOLEAN DEFAULT true,
                "max_services_per_booking" INTEGER DEFAULT 5,
                "allow_employee_selection" BOOLEAN DEFAULT true,
                "show_employee_photos_online" BOOLEAN DEFAULT true,
                "auto_assign_employee" BOOLEAN DEFAULT false,
                "online_slot_duration" INTEGER DEFAULT 30,
                "show_first_available" BOOLEAN DEFAULT true,
                "require_confirmation" BOOLEAN DEFAULT true,
                "auto_confirm" BOOLEAN DEFAULT false,
                "send_confirmation_email" BOOLEAN DEFAULT true,
                "send_confirmation_sms" BOOLEAN DEFAULT false,
                "require_prepayment" BOOLEAN DEFAULT false,
                "prepayment_percentage" INTEGER DEFAULT 100,
                "accept_online_payments" BOOLEAN DEFAULT false,
                "show_cancellation_policy" BOOLEAN DEFAULT true,
                "cancellation_policy_text" TEXT,
                "welcome_message" TEXT,
                "confirmation_message" TEXT,
                "booking_notes_placeholder" VARCHAR(255),
                "blocked_services" JSONB DEFAULT '[]',
                "blocked_employees" JSONB DEFAULT '[]',
                "widget_theme" VARCHAR(20) DEFAULT 'light',
                "widget_primary_color" VARCHAR(7),
                "widget_border_radius" INTEGER DEFAULT 8,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Insert default settings
        await queryRunner.query(`
            INSERT INTO "branch_settings" ("company_name", "is_active")
            VALUES ('Salon Beauty & Wellness', true)
        `);

        await queryRunner.query(`
            INSERT INTO "calendar_settings" DEFAULT VALUES
        `);

        await queryRunner.query(`
            INSERT INTO "online_booking_settings" DEFAULT VALUES
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "online_booking_settings"`);
        await queryRunner.query(`DROP TABLE "calendar_settings"`);
        await queryRunner.query(`DROP TYPE "calendar_view_enum"`);
        await queryRunner.query(`DROP TABLE "branch_settings"`);
    }
}
