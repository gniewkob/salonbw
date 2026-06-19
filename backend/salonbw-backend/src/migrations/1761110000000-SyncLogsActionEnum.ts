import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Syncs the native Postgres enum `logs_action_enum` with the current
 * `LogAction` TS enum. The type was created (migration 1710000500000) with
 * only the original 14 actions and never extended, while the code grew to 59
 * action types. Because prod runs with synchronize=false, every audit-log
 * write of one of the 45 missing values failed at INSERT:
 *
 *   - services that wrap logging in try/catch (appointments `safeLog`,
 *     products, retail, services, loyalty) silently dropped the audit row —
 *     the RODO/activity log was incomplete for those actions;
 *   - services that call logAction bare (timetables, settings, suppliers,
 *     deliveries, branches, gift-cards, stocktaking, employee CRUD) returned
 *     HTTP 500 *after* persisting the change — e.g. an employee saving "Mój
 *     grafik" got an error toast even though the schedule saved.
 *
 * Adding the values with IF NOT EXISTS is idempotent and non-destructive
 * (the 14 pre-existing values are no-ops). Enum values cannot be removed, so
 * down() is a no-op.
 */
export class SyncLogsActionEnum1761110000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const statements: string[] = [
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'USER_LOGIN'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOGIN_FAIL'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'USER_REGISTERED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'AUTHORIZATION_FAILURE'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'EMPLOYEE_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'EMPLOYEE_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'EMPLOYEE_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'EMPLOYEE_ROLE_CHANGED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'PASSWORD_CHANGED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_BY_ADMIN'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'PRODUCT_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'PRODUCT_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'PRODUCT_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SERVICE_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SERVICE_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SERVICE_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CANCELLED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CANCELLATION_REQUESTED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULE_REQUESTED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'APPOINTMENT_COMPLETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'COMMISSION_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SUPPLIER_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SUPPLIER_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SUPPLIER_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'DELIVERY_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'DELIVERY_RECEIVED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'DELIVERY_CANCELLED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'STOCKTAKING_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'STOCKTAKING_COMPLETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'CUSTOMER_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'CUSTOMER_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'TIMETABLE_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'TIMETABLE_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'TIMETABLE_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_BRANCH_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_CALENDAR_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_CALENDAR_VIEW_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_CALENDAR_VIEW_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_CALENDAR_VIEW_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_ONLINE_BOOKING_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_SMS_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'SETTINGS_REMINDERS_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'BRANCH_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'BRANCH_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'BRANCH_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'GIFT_CARD_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'GIFT_CARD_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'GIFT_CARD_REDEEMED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'GIFT_CARD_CANCELLED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_PROGRAM_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_POINTS_AWARDED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_POINTS_ADJUSTED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_REWARD_CREATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_REWARD_UPDATED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_REWARD_DELETED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_REWARD_REDEEMED'`,
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'LOYALTY_COUPON_USED'`,
        ];
        for (const sql of statements) {
            await queryRunner.query(sql);
        }
    }

    public async down(): Promise<void> {
        // Postgres enum values cannot be dropped; nothing to revert.
    }
}
