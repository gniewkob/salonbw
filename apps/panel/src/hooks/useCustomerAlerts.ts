import {
    useCustomer,
    useCustomerNotes,
    useCustomerStatistics,
    useTagsForCustomer,
} from '@/hooks/useCustomers';

export type CustomerAlert = {
    id: string;
    severity: 'info' | 'warning' | 'danger';
    label: string;
    detail?: string;
    source: 'stats' | 'note' | 'tag' | 'group';
};

const IMPORTANT_TAG_KEYWORDS = [
    'vip',
    'alerg',
    'uczul',
    'no-show',
    'noshow',
    'ryzyko',
    'important',
];

function isImportantTag(name: string) {
    const normalized = name.toLowerCase();
    return IMPORTANT_TAG_KEYWORDS.some((keyword) =>
        normalized.includes(keyword),
    );
}

function severityWeight(severity: CustomerAlert['severity']) {
    if (severity === 'danger') return 3;
    if (severity === 'warning') return 2;
    return 1;
}

export function useCustomerAlerts(customerId: number | null) {
    const { data: stats, isLoading: statsLoading } =
        useCustomerStatistics(customerId);
    const { data: notes = [], isLoading: notesLoading } =
        useCustomerNotes(customerId);
    const { data: tags = [], isLoading: tagsLoading } =
        useTagsForCustomer(customerId);
    const { data: customer, isLoading: customerLoading } = useCustomer(customerId);

    const alerts: CustomerAlert[] = [];

    if (typeof stats?.noShowVisits === 'number' && stats.noShowVisits > 0) {
        alerts.push({
            id: 'no-show',
            severity: stats.noShowVisits >= 2 ? 'danger' : 'warning',
            label: 'Historia no-show',
            detail: `Liczba nieobecności: ${stats.noShowVisits}`,
            source: 'stats',
        });
    }

    const pinnedAlertNotes = notes.filter(
        (note) =>
            note.isPinned &&
            (note.type === 'warning' ||
                note.type === 'medical' ||
                note.type === 'preference'),
    );
    pinnedAlertNotes.forEach((note) => {
        alerts.push({
            id: `note-${note.id}`,
            severity: note.type === 'warning' || note.type === 'medical'
                ? 'danger'
                : 'warning',
            label:
                note.type === 'medical'
                    ? 'Notatka medyczna'
                    : note.type === 'preference'
                      ? 'Preferencja klienta'
                      : 'Notatka ostrzegawcza',
            detail: note.content,
            source: 'note',
        });
    });

    tags.filter((tag) => isImportantTag(tag.name))
        .slice(0, 2)
        .forEach((tag) => {
            alerts.push({
                id: `tag-${tag.id}`,
                severity: 'warning',
                label: 'Ważny tag klienta',
                detail: tag.name,
                source: 'tag',
            });
        });

    (customer?.groups ?? []).slice(0, 1).forEach((group) => {
        alerts.push({
            id: `group-${group.id}`,
            severity: 'info',
            label: 'Grupa klienta',
            detail: group.name,
            source: 'group',
        });
    });

    const sortedAlerts = alerts
        .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
        .slice(0, 5);

    return {
        alerts: sortedAlerts,
        isLoading: statsLoading || notesLoading || tagsLoading || customerLoading,
    };
}
