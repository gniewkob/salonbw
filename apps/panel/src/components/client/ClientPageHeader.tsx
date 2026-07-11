import type { RefObject } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import PanelButton from '@/components/ui/PanelButton';

interface ClientPageHeaderProps {
    title: string;
    /** Lets a caller programmatically focus the h1 (e.g. as a fallback
     * landing spot when an action removes the element that should
     * otherwise receive focus). */
    titleRef?: RefObject<HTMLHeadingElement>;
}

export default function ClientPageHeader({
    title,
    titleRef,
}: ClientPageHeaderProps) {
    return (
        <header className="client-page-header">
            <h1
                ref={titleRef}
                tabIndex={-1}
                className="client-page-header__title"
            >
                {title}
            </h1>
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
