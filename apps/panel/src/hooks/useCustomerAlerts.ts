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

    tags.slice(0, 3).forEach((tag) => {
        alerts.push({
            id: `tag-${tag.id}`,
            severity: 'info',
            label: 'Tag klienta',
            detail: tag.name,
            source: 'tag',
        });
    });

    (customer?.groups ?? []).slice(0, 2).forEach((group) => {
        alerts.push({
            id: `group-${group.id}`,
            severity: 'info',
            label: 'Grupa klienta',
            detail: group.name,
            source: 'group',
        });
    });

    return {
        alerts,
        isLoading: statsLoading || notesLoading || tagsLoading || customerLoading,
    };
}

