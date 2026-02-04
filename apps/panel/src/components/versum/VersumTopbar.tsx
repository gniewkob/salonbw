import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VersumIcon from './VersumIcon';

export default function VersumTopbar() {
    const { user } = useAuth();

    const initials = useMemo(() => {
        if (!user?.name) return 'SB';
        const [first, second] = user.name.trim().split(/\s+/, 2);
        return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase() || 'SB';
    }, [user?.name]);

    return (
        <header className="versum-topbar">
            <div className="versum-topbar__brand">Black&amp;White</div>
            <div className="versum-topbar__right">
                <label
                    className="versum-topbar__search-wrap"
                    htmlFor="versum-search"
                >
                    <input
                        id="versum-search"
                        className="versum-topbar__search"
                        type="search"
                        placeholder="Szukaj..."
                        aria-label="Szukaj"
                    />
                </label>
                <button
                    type="button"
                    className="versum-topbar__icon-btn"
                    aria-label="Zadania"
                >
                    <VersumIcon
                        id="svg-todo"
                        className="versum-icon versum-icon--sm"
                    />
                </button>
                <button
                    type="button"
                    className="versum-topbar__icon-btn"
                    aria-label="Wiadomości"
                >
                    <VersumIcon
                        id="svg-message"
                        className="versum-icon versum-icon--sm"
                    />
                </button>
                <div className="versum-topbar__help">
                    <VersumIcon
                        id="svg-help"
                        className="versum-icon versum-icon--sm"
                    />
                    <span>Pomoc</span>
                </div>
                <div
                    className="versum-topbar__initials"
                    aria-label="Użytkownik"
                >
                    {initials}
                </div>
            </div>
        </header>
    );
}
