import { useRef, useState, type KeyboardEvent } from 'react';
import type { Customer } from '@/types';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';
import CustomerStatisticsTab from '@/components/customers/CustomerStatisticsTab';
import CustomerNotesTab from '@/components/customers/CustomerNotesTab';
import CustomerCommunicationTab from '@/components/customers/CustomerCommunicationTab';
import CustomerGalleryTab from '@/components/customers/CustomerGalleryTab';
import CustomerFilesTab from '@/components/customers/CustomerFilesTab';
import styles from '@/styles/V18Customer360Sections.module.css';

const sections = [
    { id: 'history', label: 'Historia wizyt' },
    { id: 'statistics', label: 'Statystyki' },
    { id: 'notes', label: 'Notatki' },
    { id: 'communication', label: 'Komunikacja' },
    { id: 'gallery', label: 'Zdjęcia' },
    { id: 'files', label: 'Pliki' },
] as const;

type SectionId = (typeof sections)[number]['id'];

type Props = {
    customer: Customer;
    onEditConsents: () => void;
};

/**
 * A single customer workspace. Reuse the existing fully wired CRM sections
 * instead of rebuilding API calls or duplicating business logic for V18.
 * Sections mount on selection, so their queries are not all fired at once.
 */
export default function V18Customer360Sections({
    customer,
    onEditConsents,
}: Props) {
    const [active, setActive] = useState<SectionId>('history');
    const buttons = useRef<
        Partial<Record<SectionId, HTMLButtonElement | null>>
    >({});

    const onTabKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % sections.length;
        else if (event.key === 'ArrowLeft')
            next = (index - 1 + sections.length) % sections.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = sections.length - 1;
        else return;

        event.preventDefault();
        const id = sections[next].id;
        setActive(id);
        buttons.current[id]?.focus();
    };

    return (
        <section
            className={styles.workspace}
            aria-label="Pełna karta klienta V18"
            data-testid="v18-customer-360"
        >
            <div className={styles.heading}>
                <div>
                    <span className={styles.eyebrow}>CRM 360°</span>
                    <h2>Historia i obsługa klienta</h2>
                    <p>
                        Historia wizyt, statystyki, notatki, komunikacja,
                        zdjęcia i dokumenty w jednym miejscu.
                    </p>
                </div>
            </div>

            <div
                className={styles.tabs}
                role="tablist"
                aria-label="Sekcje karty klienta V18"
            >
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        ref={(node) => {
                            buttons.current[section.id] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`customer-v18-${customer.id}-${section.id}-tab`}
                        aria-controls={`customer-v18-${customer.id}-${section.id}`}
                        aria-selected={active === section.id}
                        tabIndex={active === section.id ? 0 : -1}
                        className={
                            active === section.id
                                ? styles.activeTab
                                : styles.tab
                        }
                        onClick={() => setActive(section.id)}
                        onKeyDown={(event) => onTabKeyDown(event, index)}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {sections.map((section) => (
                <div
                    key={section.id}
                    id={`customer-v18-${customer.id}-${section.id}`}
                    role="tabpanel"
                    tabIndex={active === section.id ? 0 : -1}
                    aria-labelledby={`customer-v18-${customer.id}-${section.id}-tab`}
                    hidden={active !== section.id}
                    className={styles.content}
                >
                    {active === section.id && section.id === 'history' ? (
                        <CustomerHistoryTab
                            customerId={customer.id}
                            variant="v18"
                        />
                    ) : null}
                    {active === section.id && section.id === 'statistics' ? (
                        <CustomerStatisticsTab
                            customerId={customer.id}
                            variant="v18"
                        />
                    ) : null}
                    {active === section.id && section.id === 'notes' ? (
                        <CustomerNotesTab
                            customerId={customer.id}
                            variant="v18"
                        />
                    ) : null}
                    {active === section.id && section.id === 'communication' ? (
                        <CustomerCommunicationTab
                            customer={customer}
                            onEditConsents={onEditConsents}
                        />
                    ) : null}
                    {active === section.id && section.id === 'gallery' ? (
                        <CustomerGalleryTab customerId={customer.id} />
                    ) : null}
                    {active === section.id && section.id === 'files' ? (
                        <CustomerFilesTab
                            customerId={customer.id}
                            variant="v18"
                        />
                    ) : null}
                </div>
            ))}
        </section>
    );
}
