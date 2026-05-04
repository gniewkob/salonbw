import { useMemo } from 'react';
import { useCustomerEventHistory, useCustomerNotes } from '@/hooks/useCustomers';
import { useCustomerLinkedSales } from '@/hooks/useCustomerLinkedSales';
import type { NoteType } from '@/types';

export type CustomerTimelineItem =
    | {
          type: 'appointment';
          id: number;
          date: string;
          timestamp: number;
          title: string;
          subtitle?: string;
          status?: string;
          amount?: number;
          href?: string;
      }
    | {
          type: 'sale';
          id: number;
          date: string;
          timestamp: number;
          title: string;
          amount?: number;
          href?: string;
      }
    | {
          type: 'note';
          id: number;
          date: string;
          timestamp: number;
          title: string;
          noteType?: NoteType;
          isPinned?: boolean;
          content: string;
      };

interface UseCustomerTimelineOptions {
    limit?: number;
}

const TIMELINE_TYPE_PRIORITY: Record<CustomerTimelineItem['type'], number> = {
    note: 3,
    sale: 2,
    appointment: 1,
};

function noteTypeLabel(noteType: NoteType | undefined) {
    switch (noteType) {
        case 'warning':
            return 'Ostrzeżenie';
        case 'medical':
            return 'Medyczna';
        case 'preference':
            return 'Preferencja';
        case 'payment':
            return 'Płatność';
        default:
            return 'Notatka';
    }
}

export function useCustomerTimeline(
    customerId: number,
    options: UseCustomerTimelineOptions = {},
) {
    const limit = options.limit ?? 20;
    const eventsQuery = useCustomerEventHistory(customerId, { limit });
    const notesQuery = useCustomerNotes(customerId);
    const { linkedSalesQuery } = useCustomerLinkedSales(customerId, {
        salesPageSize: limit,
    });

    const items = useMemo<CustomerTimelineItem[]>(() => {
        const appointmentItems: CustomerTimelineItem[] = (
            eventsQuery.data?.items ?? []
        ).map((visit) => {
            const isoDate = `${visit.date}T${visit.time || '00:00'}:00`;
            const timestamp = Number.isNaN(new Date(isoDate).getTime())
                ? 0
                : new Date(isoDate).getTime();
            return {
                type: 'appointment',
                id: visit.id,
                date: isoDate,
                timestamp,
                title: visit.service?.name ?? 'Wizyta',
                subtitle: visit.employee?.name ?? undefined,
                status: visit.status,
                amount: visit.price,
                href: `/sales/history?appointmentId=${visit.id}`,
            };
        });

        const saleItems: CustomerTimelineItem[] = (
            linkedSalesQuery.data?.items ?? []
        ).map((sale) => {
            const soldAt = sale.soldAt ?? '';
            const timestamp = Number.isNaN(new Date(soldAt).getTime())
                ? 0
                : new Date(soldAt).getTime();
            return {
                type: 'sale',
                id: sale.id,
                date: soldAt,
                timestamp,
                title: sale.saleNumber || `Sprzedaż #${sale.id}`,
                amount: Number(sale.totalGross ?? 0),
                href: `/sales/history/${sale.id}`,
            };
        });

        const noteItems: CustomerTimelineItem[] = (notesQuery.data ?? []).map(
            (note) => {
                const timestamp = Number.isNaN(new Date(note.createdAt).getTime())
                    ? 0
                    : new Date(note.createdAt).getTime();
                return {
                    type: 'note',
                    id: note.id,
                    date: note.createdAt,
                    timestamp,
                    title: noteTypeLabel(note.type),
                    noteType: note.type,
                    isPinned: note.isPinned,
                    content: note.content,
                };
            },
        );

        return [...appointmentItems, ...saleItems, ...noteItems].sort((a, b) => {
            if (b.timestamp !== a.timestamp) {
                return b.timestamp - a.timestamp;
            }
            const typeDelta =
                TIMELINE_TYPE_PRIORITY[b.type] - TIMELINE_TYPE_PRIORITY[a.type];
            if (typeDelta !== 0) {
                return typeDelta;
            }
            return b.id - a.id;
        });
    }, [eventsQuery.data?.items, linkedSalesQuery.data?.items, notesQuery.data]);

    return {
        items,
        isLoading:
            eventsQuery.isLoading ||
            notesQuery.isLoading ||
            linkedSalesQuery.isLoading,
        isError:
            eventsQuery.isError || notesQuery.isError || linkedSalesQuery.isError,
    };
}
