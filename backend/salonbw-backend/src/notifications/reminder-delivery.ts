import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { SmsLog, SmsStatus } from '../sms/entities/sms-log.entity';

export const DEFAULT_REMINDER_RETRY_MINUTES = 15;

export function isSuccessfulSmsDelivery(
    log: Pick<SmsLog, 'status'> | null,
): boolean {
    return (
        log !== null &&
        [SmsStatus.Sent, SmsStatus.Delivered].includes(log.status)
    );
}

export async function claimReminderAttempt(
    repository: Repository<Appointment>,
    appointmentId: number,
    attemptedAt: Date,
    retryMinutes = DEFAULT_REMINDER_RETRY_MINUTES,
): Promise<boolean> {
    const retryCutoff = new Date(
        attemptedAt.getTime() - retryMinutes * 60 * 1000,
    );
    const claimed = await repository
        .createQueryBuilder()
        .update(Appointment)
        .set({
            reminderAttemptCount: () => '"reminderAttemptCount" + 1',
            reminderLastAttemptAt: attemptedAt,
        })
        .where('"id" = :appointmentId', { appointmentId })
        .andWhere('"reminderSent" = :reminderSent', {
            reminderSent: false,
        })
        .andWhere(
            '("reminderLastAttemptAt" IS NULL OR "reminderLastAttemptAt" <= :retryCutoff)',
            { retryCutoff },
        )
        .execute();

    return claimed.affected === 1;
}
