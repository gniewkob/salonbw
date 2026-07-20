export interface VisitNotesProps {
    emptyLabel?: string;
    compact?: boolean;
    appointmentStatus?: string;
    clientComment?: string | null;
    staffRecommendations?: string | null;
    onlineAddonsSummary?: string | null;
    onlineTotalDurationMinutes?: number | null;
    onlineDurationNeedsVerification?: boolean;
}

interface VisitNoteSection {
    key: string;
    label: string;
    items?: string[];
    value?: string;
}

function splitAddons(value: string) {
    return value
        .split(/,\s*/)
        .map((item) => item.replace(/[.\s]+$/g, '').trim())
        .filter(Boolean);
}

function cleanFreeText(value: string) {
    return value.replace(/^[—\s.]+|[—\s.]+$/g, '').trim();
}

function pushFreeTextSection(
    sections: VisitNoteSection[],
    value: string,
    sectionLabel = 'Komentarz do rezerwacji',
) {
    const cleaned = cleanFreeText(value);
    if (!cleaned) return;

    sections.push({
        key: `client-comment-${sections.length}`,
        label: sectionLabel,
        value: cleaned,
    });
}

function buildStructuredSections({
    clientComment,
    staffRecommendations,
    onlineAddonsSummary,
    onlineTotalDurationMinutes,
    onlineDurationNeedsVerification,
    appointmentStatus,
}: Pick<
    VisitNotesProps,
    | 'clientComment'
    | 'staffRecommendations'
    | 'onlineAddonsSummary'
    | 'onlineTotalDurationMinutes'
    | 'onlineDurationNeedsVerification'
    | 'appointmentStatus'
>) {
    const sections: VisitNoteSection[] = [];
    pushFreeTextSection(sections, clientComment ?? '');

    const addons = onlineAddonsSummary?.trim();
    if (addons) {
        sections.push({
            key: 'addons',
            label: 'Dodatkowe zabiegi',
            items: splitAddons(addons),
        });
    }

    if (onlineTotalDurationMinutes) {
        sections.push({
            key: 'duration',
            label: 'Łączny czas',
            value: `${onlineTotalDurationMinutes} min`,
        });
    }

    if (onlineDurationNeedsVerification && appointmentStatus !== 'completed') {
        sections.push({
            key: 'verification',
            label: 'Weryfikacja czasu',
            value: 'Salon potwierdzi łączny czas wizyty.',
        });
    }

    pushFreeTextSection(
        sections,
        staffRecommendations ?? '',
        'Zalecenia po wizycie',
    );

    return sections;
}

export function hasVisibleVisitNotes(
    value: Pick<
        VisitNotesProps,
        | 'appointmentStatus'
        | 'clientComment'
        | 'staffRecommendations'
        | 'onlineAddonsSummary'
        | 'onlineTotalDurationMinutes'
        | 'onlineDurationNeedsVerification'
    >,
) {
    return buildStructuredSections(value).length > 0;
}

export default function VisitNotes({
    emptyLabel = 'Brak notatek przy tej wizycie.',
    compact = false,
    appointmentStatus,
    clientComment,
    staffRecommendations,
    onlineAddonsSummary,
    onlineTotalDurationMinutes,
    onlineDurationNeedsVerification,
}: VisitNotesProps) {
    const sections = buildStructuredSections({
        clientComment,
        staffRecommendations,
        onlineAddonsSummary,
        onlineTotalDurationMinutes,
        onlineDurationNeedsVerification,
        appointmentStatus,
    });
    if (sections.length === 0) {
        return <p className="visit-notes-empty">{emptyLabel}</p>;
    }

    return (
        <div
            className={['visit-notes', compact ? 'visit-notes--compact' : '']
                .filter(Boolean)
                .join(' ')}
        >
            {sections.map((section) => (
                <div key={section.key} className="visit-notes__section">
                    <div className="visit-notes__label">{section.label}</div>
                    {section.items ? (
                        <ul className="visit-notes__list">
                            {section.items.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    ) : (
                        <div className="visit-notes__value">
                            {section.value}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
