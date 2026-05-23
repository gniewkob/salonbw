import { useState, useRef, useEffect, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import SalonIcon from './SalonIcon';
import { buildTopbarViewModel } from '@/lib/topbar/topbarModel';

export default function SalonTopbar() {
    const { user, logout, apiFetch } = useAuth();
    const router = useRouter();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [helpMenuOpen, setHelpMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLLIElement>(null);
    const helpMenuRef = useRef<HTMLLIElement>(null);
    const [onlinePendingCount, setOnlinePendingCount] = useState(0);
    const topbar = buildTopbarViewModel(user);

    useEffect(() => {
        if (!user || user.role === 'client') return;
        const fetchCount = () => {
            apiFetch<{ count: number }>('/appointments/online-pending-count')
                .then((data) => setOnlinePendingCount(data.count))
                .catch(() => undefined);
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60_000);
        return () => clearInterval(interval);
    }, [user, apiFetch]);

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent | globalThis.MouseEvent,
        ) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setUserMenuOpen(false);
            }
            if (
                helpMenuRef.current &&
                !helpMenuRef.current.contains(event.target as Node)
            ) {
                setHelpMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuTogglerClick = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (typeof document === 'undefined') return;
        document.body.classList.toggle('salonbw-sidebar-open');
    };

    const closeSidebar = () => {
        if (typeof document !== 'undefined') {
            document.body.classList.remove('salonbw-sidebar-open');
        }
    };

    useEffect(() => {
        const handleRouteChange = () => closeSidebar();
        router.events.on('routeChangeStart', handleRouteChange);
        return () => router.events.off('routeChangeStart', handleRouteChange);
    }, [router.events]);

    const handleLogout = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        void logout().then(() => {
            void router.push('/auth/login');
        });
    };

    return (
        <>
            {/* Mobile overlay — closes sidebar when tapped */}
            <div
                className="salonbw-nav-overlay"
                aria-hidden="true"
                onClick={closeSidebar}
            />
            <div
                className="navbar navbar-default navbar-static-top d-flex"
                id="navbar"
            >
                <div className="notification-bar-container"></div>
                <div>
                    {topbar.menuToggler.enabled ? (
                        <a
                            aria-label="Menu"
                            className="menu-toggler navbar-toggle"
                            href="#"
                            id="menu-toggler"
                            onClick={handleMenuTogglerClick}
                        >
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                        </a>
                    ) : null}
                    <div className="brand">
                        <Link
                            aria-label="Przejdź do pulpitu"
                            href={topbar.brand.href}
                            title="przejdź do pulpitu"
                        >
                            <img
                                src="/images/logo.svg"
                                alt="Salon Black &amp; White"
                                className="salon-topbar-logo"
                            />
                        </Link>
                    </div>
                </div>
                <div className="ml-auto">
                    <ul className="navbar-right simple-list d-flex">
                        <li className="d-flex">
                            <div className="omnibox-wrapper">
                                <input
                                    className="omnibox"
                                    data-search-url={topbar.search.searchUrl}
                                    id="omnibox"
                                    placeholder={topbar.search.placeholder}
                                />
                                <div
                                    className="dropdown-menu"
                                    id="omnibox-results"
                                ></div>
                            </div>
                        </li>
                        {onlinePendingCount > 0 ? (
                            <li className="d-flex align-items-center">
                                <Link
                                    href="/appointments?status=online_pending"
                                    className="link d-flex align-items-center gap-1 px-2"
                                    title="Wizyty oczekujące na potwierdzenie"
                                >
                                    <span className="badge bg-warning text-dark">
                                        {onlinePendingCount}
                                    </span>
                                    <span className="d-none d-md-inline small">
                                        oczekujące
                                    </span>
                                </Link>
                            </li>
                        ) : null}
                        {topbar.notifications.enabled ? (
                            <li
                                className="notification_center"
                                id="notification_center_navbar"
                            >
                                <a
                                    className="link e2e-notification-center-navbar"
                                    href="#"
                                    onClick={(event) => event.preventDefault()}
                                >
                                    <div
                                        className={`notification_center_icon${topbar.notifications.unreadCount ? ' notifications_unread' : ''}`}
                                        data-unread_notifications={
                                            topbar.notifications.unreadCount ??
                                            0
                                        }
                                        id="notification_center_navbar_icon"
                                    >
                                        <SalonIcon
                                            id="svg-notifications"
                                            className="svg-notifications"
                                        />
                                    </div>
                                </a>
                            </li>
                        ) : null}
                        {topbar.tasks.enabled ? (
                            <li className="all_complete tasks_tooltip">
                                <a
                                    aria-expanded="false"
                                    className="link"
                                    href="#"
                                    title="Twoje zadania"
                                    onClick={(event) => event.preventDefault()}
                                >
                                    <div
                                        className="assigned_tasks"
                                        data-assigned_tasks={
                                            topbar.tasks.count ?? 0
                                        }
                                    >
                                        <SalonIcon
                                            id="svg-todo"
                                            className="svg-todo"
                                        />
                                    </div>
                                </a>
                                <div className="dropdown_cover"></div>
                                <div
                                    className="dropdown-menu-tasks"
                                    id="dropdownTasks"
                                    role="menu"
                                ></div>
                            </li>
                        ) : null}
                        <li
                            ref={helpMenuRef}
                            className={`dropdown help_tooltip right-menu${helpMenuOpen ? ' open' : ''}`}
                        >
                            <a
                                className="ai-center d-flex dropdown-toggle"
                                data-toggle="dropdown"
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setHelpMenuOpen((value) => !value);
                                }}
                            >
                                <div className="d-inline-block jQ_nav_chat_notification">
                                    <SalonIcon
                                        id="svg-help"
                                        className="svg-help mr-xs"
                                    />
                                </div>
                                <div className="d-none d-md-inline">
                                    <span>Pomoc</span>
                                </div>
                            </a>
                            <ul className="dropdown-menu larger-dropdown-menu nav-help">
                                {topbar.help.showChat ? (
                                    <>
                                        <li className="main-menu-li">
                                            <a
                                                id="chat_widget"
                                                href="#"
                                                style={{ cursor: 'pointer' }}
                                                onClick={(event) =>
                                                    event.preventDefault()
                                                }
                                            >
                                                <div className="jQ_chat_notification">
                                                    <SalonIcon
                                                        id="svg-help"
                                                        className="svg-chat"
                                                    />
                                                </div>
                                                <span>Czat z konsultantem</span>
                                            </a>
                                        </li>
                                        <li className="divider"></li>
                                    </>
                                ) : null}
                                <li className="main-menu-li">
                                    <Link href={topbar.help.contactFormHref}>
                                        <SalonIcon
                                            id="svg-message"
                                            className="svg-message"
                                        />
                                        <span>Formularz kontaktowy</span>
                                    </Link>
                                </li>
                                {topbar.help.knowledgeBaseHref ? (
                                    <>
                                        <li className="divider"></li>
                                        <li className="main-menu-li">
                                            <a
                                                href={
                                                    topbar.help
                                                        .knowledgeBaseHref
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <span>Baza wiedzy</span>
                                            </a>
                                        </li>
                                    </>
                                ) : null}
                            </ul>
                        </li>
                        <li
                            ref={userMenuRef}
                            className={`dropdown right-menu${userMenuOpen ? ' open' : ''}`}
                        >
                            <a
                                className="dropdown-toggle e2e-nav-user-dropdown"
                                data-toggle="dropdown"
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setUserMenuOpen((value) => !value);
                                }}
                            >
                                <div className="border-color">
                                    <div className="color1">
                                        {topbar.user.initials}
                                    </div>
                                </div>
                            </a>
                            <ul className="dropdown-menu larger-dropdown-menu">
                                <li className="main-menu-li">
                                    <a
                                        className="profil"
                                        href={topbar.user.profileHref}
                                    >
                                        {topbar.user.avatarUrl ? (
                                            <img
                                                alt="Avatar"
                                                className="avatar"
                                                src={topbar.user.avatarUrl}
                                            />
                                        ) : null}
                                        <strong>{topbar.user.fullName}</strong>
                                        {topbar.user.roleLabel}
                                    </a>
                                </li>
                                <li className="divider"></li>
                                <li className="main-menu-li">
                                    <a
                                        className="e2e-user-logout"
                                        href={topbar.user.logoutHref || '#'}
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
        </>
    );
}
