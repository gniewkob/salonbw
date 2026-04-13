import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    UserGroupIcon,
    ClockIcon,
    StarIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';

export default function ClientsSidebar() {
    const router = useRouter();
    const { group } = router.query;

    const navItems = [
        { id: 'all', label: 'Wszyscy klienci', icon: UserGroupIcon },
        { id: 'recent', label: 'Ostatnio dodani', icon: ClockIcon },
        { id: 'vip', label: 'Klienci VIP', icon: StarIcon },
    ];

    return (
        <div className="d-flex flex-column h-100 bg-light border-end">
            <div className="p-3 border-bottom">
                <button className="w-100 btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-2">
                    <PlusIcon style={{ width: 16, height: 16 }} />
                    Dodaj klienta
                </button>
            </div>

            <div className="flex-fill overflow-y-auto py-3">
                <div className="px-3 mb-2 small fw-semibold text-secondary text-uppercase">
                    Grupy klientów
                </div>
                <nav className="gap-1 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={{
                                pathname: '/customers',
                                query: { ...router.query, group: item.id },
                            }}
                            className={`d-flex align-items-center gap-2 px-3 py-2 small fw-medium rounded-2 ${
                                group === item.id ||
                                (!group && item.id === 'all')
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-muted'
                            }`}
                        >
                            <item.icon
                                style={{ width: 20, height: 20 }}
                                className={
                                    group === item.id ||
                                    (!group && item.id === 'all')
                                        ? 'text-primary'
                                        : 'text-secondary'
                                }
                            />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
