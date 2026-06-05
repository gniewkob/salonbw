import { useRouter } from 'next/router';

export default function CommunicationNav() {
    const router = useRouter();
    const path = router.pathname;

    const isActive = (href: string) =>
        path === href || path.startsWith(`${href}/`);

    const renderGroup = (
        heading: string,
        items: Array<{ label: string; href: string }>,
    ) => (
        <div className="column_row">
            <div className="nav-header">{heading}</div>
            <ul className="nav nav-list">
                {items.map((item) => (
                    <li key={item.href} className={isActive(item.href) ? 'active' : undefined}>
                        <a href={item.href}>{item.label}</a>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <>
            {renderGroup('AUTOMATYCZNE', [
                { label: 'Reguły automatyczne', href: '/communication/automatic' },
                { label: 'Przypomnienia', href: '/communication/reminders' },
            ])}
            {renderGroup('KAMPANIE', [
                { label: 'Wiadomości masowe', href: '/communication/mass' },
                { label: 'Newslettery', href: '/messages' },
            ])}
            {renderGroup('SZABLONY', [
                { label: 'Szablony wiadomości', href: '/communication/templates' },
            ])}
            {renderGroup('HISTORIA', [
                { label: 'Historia wiadomości', href: '/communication' },
            ])}
        </>
    );
}
