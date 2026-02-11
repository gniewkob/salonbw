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
        <div className="flex flex-col h-full bg-gray-50/50 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <button className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded shadow-sm flex items-center justify-center gap-2 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    Dodaj klienta
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Grupy klientów
                </div>
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={{
                                pathname: '/customers',
                                query: { ...router.query, group: item.id },
                            }}
                            className={`
                                flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                                ${
                                    group === item.id ||
                                    (!group && item.id === 'all')
                                        ? 'bg-white text-sky-700 shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                }
                            `}
                        >
                            <item.icon
                                className={`w-5 h-5 ${group === item.id || (!group && item.id === 'all') ? 'text-sky-600' : 'text-gray-400'}`}
                            />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
