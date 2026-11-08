import type {
    CommunicationChannel,
    CommunicationState,
    ConsentScopeView,
} from '@/api/communicationConsents';

/**
 * Presentation groups only. The API still authorizes and audits each physical
 * channel independently; in particular SMS never implies WhatsApp consent.
 */
export const V18_CHANNEL_GROUPS = [
    {
        id: 'MESSAGING',
        label: 'SMS / WhatsApp',
        channels: ['SMS', 'WHATSAPP'],
    },
    {
        id: 'EMAIL',
        label: 'E-mail',
        channels: ['EMAIL'],
    },
] as const satisfies ReadonlyArray<{
    id: string;
    label: string;
    channels: readonly CommunicationChannel[];
}>;

export type V18ChannelGroup = (typeof V18_CHANNEL_GROUPS)[number];
export type GroupState = 'on' | 'off' | 'partial' | 'unavailable';

const isInGroup = (group: V18ChannelGroup, channel: CommunicationChannel) =>
    (group.channels as readonly CommunicationChannel[]).includes(channel);

const prefKey = (type: string, channel: CommunicationChannel) =>
    `${type}:${channel}`;

export function operationalGroupSettings(
    state: CommunicationState,
    group: V18ChannelGroup,
    draft: Record<string, boolean> = {},
) {
    const supported = state.preferences.filter(
        (pref) =>
            pref.communicationClass === 'OPERATIONAL' &&
            pref.supported &&
            isInGroup(group, pref.channel),
    );
    const enabled = supported.filter((pref) => {
        const key = prefKey(pref.communicationType, pref.channel);
        return Object.prototype.hasOwnProperty.call(draft, key)
            ? draft[key]
            : pref.preferred === true;
    }).length;
    const status: GroupState =
        supported.length === 0
            ? 'unavailable'
            : enabled === 0
              ? 'off'
              : enabled === supported.length
                ? 'on'
                : 'partial';

    return { status, enabled, total: supported.length };
}

export function setOperationalGroupDraft(
    state: CommunicationState,
    group: V18ChannelGroup,
    draft: Record<string, boolean>,
    enabled: boolean,
): Record<string, boolean> {
    const updated = { ...draft };
    for (const pref of state.preferences) {
        if (
            pref.communicationClass === 'OPERATIONAL' &&
            pref.supported &&
            isInGroup(group, pref.channel) &&
            // Staff preferences are not evidence of WhatsApp opt-in.
            // Disabling it is safe; never enable it as a side-effect of SMS.
            (!enabled || pref.channel !== 'WHATSAPP')
        ) {
            updated[prefKey(pref.communicationType, pref.channel)] = enabled;
        }
    }
    return updated;
}

/**
 * A customer-facing operational summary must use server-authoritative
 * effectiveAllowed, not the preferred flag (which may be blocked globally).
 */
export function operationalGroupDelivery(
    state: CommunicationState,
    group: V18ChannelGroup,
) {
    const supported = group.channels.filter((channel) =>
        state.preferences.some(
            (pref) =>
                pref.communicationClass === 'OPERATIONAL' &&
                pref.channel === channel &&
                pref.supported,
        ),
    );
    // The state API evaluates preference eligibility; actual delivery also
    // requires contact details. Never show a deliverable channel without them.
    const withContact = supported.filter((channel) =>
        channel === 'EMAIL'
            ? state.contact.hasEmail
            : channel === 'PANEL' || state.contact.hasPhone,
    );
    const enabled = withContact.filter(
        (channel) =>
            state.receiveNotifications &&
            state.preferences.some(
                (pref) =>
                    pref.communicationClass === 'OPERATIONAL' &&
                    pref.channel === channel &&
                    pref.supported &&
                    pref.effectiveAllowed,
            ),
    ).length;
    const status: GroupState =
        withContact.length === 0
            ? 'unavailable'
            : enabled === 0
              ? 'off'
              : enabled === group.channels.length
                ? 'on'
                : 'partial';

    return { status, enabled, total: group.channels.length };
}

/** Marketing is explicitly recorded per channel, never inferred from legacy. */
export function marketingGroupConsent(
    state: CommunicationState,
    group: V18ChannelGroup,
) {
    const scopes = group.channels
        .map((channel) =>
            state.consents.find(
                (consent) =>
                    consent.purpose === 'DIRECT_MARKETING' &&
                    consent.channel === channel,
            ),
        )
        .filter((scope): scope is ConsentScopeView => Boolean(scope));
    const granted = scopes.filter((scope) => scope.status === 'GRANTED').length;
    const status: GroupState =
        scopes.length === 0
            ? 'unavailable'
            : granted === 0
              ? 'off'
              : granted === group.channels.length
                ? 'on'
                : 'partial';

    return { status, granted, total: group.channels.length };
}

export const groupStatusLabel: Record<GroupState, string> = {
    on: 'Włączone',
    off: 'Wyłączone',
    partial: 'Częściowo',
    unavailable: 'Niedostępne',
};

export const marketingStatusLabel: Record<GroupState, string> = {
    on: 'Zgoda udzielona',
    off: 'Brak aktywnej zgody',
    partial: 'Zgoda częściowa',
    unavailable: 'Brak danych',
};
