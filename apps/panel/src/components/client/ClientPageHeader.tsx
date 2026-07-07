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
            >
                Zarezerwuj wizytę
            </PanelButton>
        </header>
    );
}
