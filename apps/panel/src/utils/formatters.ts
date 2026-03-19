import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export function formatPanelDate(dateStr: string | undefined) {
    if (!dateStr) return '-';

    try {
        return format(new Date(dateStr), 'd MMM yyyy', { locale: pl });
    } catch {
        return '-';
    }
}

export function formatPanelCurrency(amount: number) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(amount);
}
