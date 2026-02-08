import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import VersumIcon from './VersumIcon';

export default function VersumTopbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [helpMenuOpen, setHelpMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLLIElement>(null);
    const helpMenuRef = useRef<HTMLLIElement>(null);

    const initials = useMemo(() => {
        if (!user?.name) return 'SB';
        const [first, second] = user.name.trim().split(/\s+/, 2);
        return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase() || 'SB';
    }, [user?.name]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target as Node)
            ) {
                setUserMenuOpen(false);
            }
            if (
                helpMenuRef.current &&
                !helpMenuRef.current.contains(e.target as Node)
            ) {
                setHelpMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        void logout().then(() => {
            void router.push('/auth/login');
        });
    };

    return (
        <div
            className="navbar navbar-default navbar-static-top d-flex"
            id="navbar"
        >
            <div className="notification-bar-container"></div>
            
            {/* Logo - positioned absolutely like original Versum */}
            <div className="brand">
                <Link
                    href="/dashboard"
                    title="przejdź do pulpitu"
                    aria-label="Black and White - Przejdź do pulpitu"
                >
                    <span className="brand-text">versum</span>
                </Link>
            </div>

            <div className="ml-auto">
                <ul className="navbar-right simple-list d-flex">
                    <li className="d-flex">
                        <div className="omnibox-wrapper">
                            <input
                                className="omnibox"
                                data-search-url="/global_searches"
                                id="omnibox"
                                placeholder="Szukaj..."
                            />
                            <div
                                className="dropdown-menu"
                                id="omnibox-results"
                            ></div>
                        </div>
                    </li>
                    
                    {/* Notification center with counter */}
                    <li
                        className="notification_center"
                        id="notification_center_navbar"
                    >
                        <a
                            className="link"
                            href="javascript:;"
                            title="Powiadomienia"
                        >
                            <div className="notification-badge">
                                <VersumIcon
                                    id="svg-notifications"
                                    className="svg-notifications"
                                />
                                <span className="badge-count">7</span>
                            </div>
                        </a>
                    </li>
                    
                    {/* Messages with counter */}
                    <li className="all_complete tasks_tooltip">
                        <a
                            aria-expanded="false"
                            className="link"
                            href="javascript:;"
                            title="Twoje zadania"
                        >
                            <div
                                className="assigned_tasks"
                                data-assigned_tasks="0"
                            >
                                <VersumIcon
                                    id="svg-todo"
                                    className="svg-todo"
                                />
                                <span className="badge-count">0</span>
                            </div>
                        </a>
                        <div className="dropdown_cover"></div>
                        <div
                            className="dropdown-menu-tasks"
                            id="dropdownTasks"
                            role="menu"
                        ></div>
                    </li>
                    
                    <li
                        ref={helpMenuRef}
                        className={`dropdown help_tooltip right-menu ${helpMenuOpen ? 'open' : ''}`}
                    >
                        <a
                            className="ai-center d-flex dropdown-toggle"
                            data-toggle="dropdown"
                            href="javascript:;"
                            title="Pomoc"
                            onClick={() => setHelpMenuOpen(!helpMenuOpen)}
                        >
                            <div className="d-inline-block jQ_nav_chat_notification">
                                <VersumIcon
                                    id="svg-help"
                                    className="svg-help mr-xs"
                                />
                            </div>
                            <div className="d-none d-md-inline">
                                <span>Pomoc</span>
                                <b className="caret initials-arrow"></b>
                            </div>
                        </a>
                        <ul className="dropdown-menu larger-dropdown-menu nav-help">
                            <li className="divider"></li>
                            <li className="main-menu-li">
                                <a href="/helps/new">
                                    <VersumIcon
                                        id="svg-message"
                                        className="svg-message"
                                    />
                                    <span>Formularz kontaktowy</span>
                                </a>
                            </li>
                        </ul>
                    </li>
                    
                    <li
                        ref={userMenuRef}
                        className={`dropdown right-menu ${userMenuOpen ? 'open' : ''}`}
                    >
                        <a
                            className="dropdown-toggle e2e-nav-user-dropdown"
                            data-toggle="dropdown"
                            href="javascript:;"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                            <div className="border-color">
                                <div className="color1">{initials}</div>
                            </div>
                            <b className="caret color1 hidden-xs initials-arrow"></b>
                        </a>
                        <ul className="dropdown-menu larger-dropdown-menu">
                            <li className="main-menu-li">
                                <a className="profil" href="/settings/profile">
                                    {user?.avatarUrl && (
                                        <img
                                            alt="Avatar"
                                            className="avatar"
                                            src={user.avatarUrl}
                                        />
                                    )}
                                    <strong>
                                        {user?.name || 'Użytkownik'}
                                    </strong>
                                    <br />
                                    <span className="text-muted">
                                        {user?.role || 'administrator'}
                                    </span>
                                </a>
                            </li>
                            <li className="divider"></li>
                            <li className="main-menu-li">
                                <a
                                    className="e2e-user-logout"
                                    href="javascript:;"
                                    onClick={handleLogout}
                                >
                                    Wyloguj
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    );
}
