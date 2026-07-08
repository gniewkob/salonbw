import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import PanelButton from '@/components/ui/PanelButton';

interface ClientPageHeaderProps {
    title: string;
}

export default function ClientPageHeader({ title }: ClientPageHeaderProps) {
    return (
        <header className="client-page-header">
            <h1 className="client-page-header__title">{title}</h1>
            <PanelButton
                href="/booking"
                variant="primary"
                className="client-page-header__action"
                icon={
                    <CalendarDaysIcon
                        aria-hidden="true"
                        className="client-page-header__action-icon"
                    />
                }
            >
                Zarezerwuj wizytę
            </PanelButton>
        </header>
    );
}
