interface VisitNotesProps {
    notes?: string | null;
    emptyLabel?: string;
    compact?: boolean;
}

function splitAddons(value: string) {
    return value
        .split(/,\s*/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseNotes(rawNotes: string) {
    let remainder = rawNotes.trim();
    const sections: Array<{
        key: string;
        label: string;
        items?: string[];
        value?: string;
    }> = [];

    const addonMatch = remainder.match(
        /Dodatki wybrane online:\s*([\s\S]*?)(?=Łączny czas wizyty:|$)/i,
    );
    if (addonMatch?.[1]?.trim()) {
        sections.push({
            key: 'addons',
            label: 'Dodatkowe zabiegi',
            items: splitAddons(addonMatch[1]),
        });
        remainder = remainder.replace(addonMatch[0], ' ').trim();
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
        sections.push({
            key: 'verification',
            label: 'Status',
            value: 'Do weryfikacji przy potwierdzeniu',
        });
        remainder = remainder
            .replace(/[—-]?\s*do weryfikacji przy potwierdzeniu\.?/i, ' ')
            .trim();
    }

    const recommendation = remainder.replace(/^[—\s.]+|[—\s.]+$/g, '').trim();
    if (recommendation) {
        sections.unshift({
            key: 'recommendation',
            label: 'Zalecenia',
            value: recommendation,
        });
    }

    return sections;
}

export default function VisitNotes({
    notes,
    emptyLabel = 'Brak notatek przy tej wizycie.',
    compact = false,
}: VisitNotesProps) {
    const normalizedNotes = notes?.trim();
    if (!normalizedNotes) {
        return <p className="visit-notes-empty">{emptyLabel}</p>;
    }

    const sections = parseNotes(normalizedNotes);
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
