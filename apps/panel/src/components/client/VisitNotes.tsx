interface VisitNotesProps {
    notes?: string | null;
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
    fallbackLabel = 'Komentarz do rezerwacji',
) {
    const cleaned = cleanFreeText(value);
    if (!cleaned) return;

    const recommendationMatch = cleaned.match(
        /^(Zalecenia(?:\s+po\s+wizycie)?|Rekomendacje)\s*:\s*([\s\S]+)$/i,
    );
    if (recommendationMatch?.[2]?.trim()) {
        sections.push({
            key: `recommendation-${sections.length}`,
            label: 'Zalecenia po wizycie',
            value: recommendationMatch[2].trim(),
        });
        return;
    }

    sections.push({
        key: `client-comment-${sections.length}`,
        label: fallbackLabel,
        value: cleaned,
    });
}

function parseNotes(rawNotes: string, appointmentStatus?: string) {
    let remainder = rawNotes.trim();
    const sections: VisitNoteSection[] = [];
    const hideVerification = appointmentStatus === 'completed';

    const addonMatch = remainder.match(
        /Dodatki wybrane online:\s*([\s\S]*?)(?=Łączny czas wizyty:|$)/i,
    );
    if (addonMatch?.[1]?.trim()) {
        const addonStart = addonMatch.index ?? 0;
        const addonEnd = addonStart + addonMatch[0].length;
        const textBeforeAddons = remainder.slice(0, addonStart).trim();
        pushFreeTextSection(sections, textBeforeAddons);
        sections.push({
            key: 'addons',
            label: 'Dodatkowe zabiegi',
            items: splitAddons(addonMatch[1]),
        });
        remainder = remainder.slice(addonEnd).trim();
    }

    const durationMatch = remainder.match(
        /Łączny czas wizyty:\s*([0-9]+\s*min)/i,
    );
    if (durationMatch?.[1]) {
        sections.push({
            key: 'duration',
            label: 'Łączny czas',
            value: durationMatch[1],
        });
        remainder = remainder.replace(durationMatch[0], ' ').trim();
    }

    if (/do weryfikacji przy potwierdzeniu/i.test(remainder)) {
        const verificationMatch = remainder.match(
            /[—-]?\s*do weryfikacji przy potwierdzeniu\.?/i,
        );
        if (!hideVerification) {
            sections.push({
                key: 'verification',
                label: 'Weryfikacja czasu',
                value: 'Salon potwierdzi łączny czas wizyty.',
            });
        }
        remainder = verificationMatch
            ? remainder.slice(
                  (verificationMatch.index ?? 0) + verificationMatch[0].length,
              )
            : remainder.replace(
                  /[—-]?\s*do weryfikacji przy potwierdzeniu\.?/i,
                  ' ',
              );
        remainder = remainder.trim();
        pushFreeTextSection(sections, remainder, 'Zalecenia po wizycie');
        return sections;
    }

    pushFreeTextSection(sections, remainder);

    return sections;
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

export default function VisitNotes({
    notes,
    emptyLabel = 'Brak notatek przy tej wizycie.',
    compact = false,
    appointmentStatus,
    clientComment,
    staffRecommendations,
    onlineAddonsSummary,
    onlineTotalDurationMinutes,
    onlineDurationNeedsVerification,
}: VisitNotesProps) {
    const normalizedNotes = notes?.trim();
    const hasStructuredNotes = Boolean(
        clientComment?.trim() ||
            staffRecommendations?.trim() ||
            onlineAddonsSummary?.trim() ||
            onlineTotalDurationMinutes ||
            onlineDurationNeedsVerification,
    );
    if (!normalizedNotes && !hasStructuredNotes) {
        return <p className="visit-notes-empty">{emptyLabel}</p>;
    }

    const sections = hasStructuredNotes
        ? buildStructuredSections({
              clientComment,
              staffRecommendations,
              onlineAddonsSummary,
              onlineTotalDurationMinutes,
              onlineDurationNeedsVerification,
              appointmentStatus,
          })
        : parseNotes(normalizedNotes ?? '', appointmentStatus);
    if (sections.length === 0) {
        return <p className="visit-notes-empty">{normalizedNotes}</p>;
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
