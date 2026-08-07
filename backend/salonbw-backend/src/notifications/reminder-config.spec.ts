import {
    reminderChannelPlan,
    resolveReminderConfig,
} from './automatic-reminder.service';
import {
    ReminderChannel,
    ReminderSettings,
} from '../settings/entities/reminder-settings.entity';

function settings(over: Partial<ReminderSettings>): ReminderSettings {
    return {
        id: 1,
        active: true,
        timingHours: 24,
        preferredChannel: ReminderChannel.Both,
        ...over,
    } as ReminderSettings;
}

describe('resolveReminderConfig', () => {
    // The sender used to read REMINDER_ENABLED / REMINDER_HOURS_BEFORE from
    // env and ignore the reminder_settings row entirely, so everything the
    // owner set in the panel was decorative.
    it('prefers the database row over environment defaults', () => {
        const cfg = resolveReminderConfig(
            settings({
                active: false,
                timingHours: 48,
                preferredChannel: ReminderChannel.Email,
            }),
            true,
            24,
        );

        expect(cfg).toEqual({
            enabled: false,
            hoursBefore: 48,
            channel: ReminderChannel.Email,
        });
    });

    it('falls back to environment when no row exists yet', () => {
        expect(resolveReminderConfig(null, false, 12)).toEqual({
            enabled: false,
            hoursBefore: 12,
            channel: ReminderChannel.Both,
        });
    });

    // A corrupt/zero timing must not silently mean "remind at appointment time".
    it('ignores a non-positive timing and keeps the env default', () => {
        expect(
            resolveReminderConfig(settings({ timingHours: 0 }), true, 24)
                .hoursBefore,
        ).toBe(24);
    });
});

describe('reminderChannelPlan', () => {
    it('sends on both channels when no preference is set', () => {
        expect(reminderChannelPlan(ReminderChannel.Both)).toEqual({
            order: ['sms', 'email'],
            sendAll: true,
        });
    });

    // Today's real situation: preferred is SMS but SMSAPI has no token —
    // e-mail must remain reachable as a fallback, not be dropped.
    it('keeps the other channel as a fallback for an explicit preference', () => {
        expect(reminderChannelPlan(ReminderChannel.Sms)).toEqual({
            order: ['sms', 'email'],
            sendAll: false,
        });
        expect(reminderChannelPlan(ReminderChannel.Email)).toEqual({
            order: ['email', 'sms'],
            sendAll: false,
        });
    });
});
