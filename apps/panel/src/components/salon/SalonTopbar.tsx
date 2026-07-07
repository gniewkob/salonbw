import { useState, useRef, useEffect, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import SalonIcon from './SalonIcon';
import { buildTopbarViewModel } from '@/lib/topbar/topbarModel';
import { usePendingBookingsCount } from '@/hooks/useAppointments';
import { useNotifications } from '@/hooks/useNotifications';
import SalonGlobalSearch from './SalonGlobalSearch';

export default function SalonTopbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [helpMenuOpen, setHelpMenuOpen] = useState(false);
    const [tasksMenuOpen, setTasksMenuOpen] = useState(false);
    const pendingCount = usePendingBookingsCount();
    const notifications = useNotifications(user?.role !== 'client');
    const userMenuRef = useRef<HTMLLIElement>(null);
    const helpMenuRef = useRef<HTMLLIElement>(null);
    const tasksMenuRef = useRef<HTMLLIElement>(null);
    const topbar = buildTopbarViewModel(user);
    const tasksCount = Math.max(topbar.tasks.count ?? 0, pendingCount);
    const isStaff = user?.role !== 'client';
    const notificationCount =
        topbar.notifications.unreadCount ?? notifications.data?.length ?? 0;

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
            if (
                tasksMenuRef.current &&
                !tasksMenuRef.current.contains(event.target as Node)
            ) {
                setTasksMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuTogglerClick = () => {
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
            <div>
                {topbar.menuToggler.enabled ? (
                    <button
                        type="button"
                        aria-label="Menu"
                        className="menu-toggler navbar-toggle"
                        id="menu-toggler"
                        onClick={handleMenuTogglerClick}
                    >
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                ) : null}
                <div className="brand">
                    <Link
                        aria-label="Przejdź do pulpitu"
                        href={topbar.brand.href}
                        title="przejdź do pulpitu"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/logo.svg"
                            alt="Salon BW"
                            className="salon-topbar-logo"
                        />
                    </Link>
                </div>
            </div>
            <div className="ms-auto">
                <ul className="navbar-right simple-list d-flex">
                    {isStaff && (
                        <li className="d-flex">
                            <SalonGlobalSearch />
                        </li>
                    )}
                    {isStaff && topbar.notifications.enabled ? (
                        <li
                            className="notification_center"
                            id="notification_center_navbar"
                        >
                            <Link
                                className="link e2e-notification-center-navbar"
                                href="/notifications"
                                aria-label="Powiadomienia"
                            >
                                <div
                                    className={`notification_center_icon${notificationCount ? ' notifications_unread' : ''}`}
                                    data-unread_notifications={
                                        notificationCount
                                    }
                                    id="notification_center_navbar_icon"
                                >
                                    <SalonIcon
                                        id="svg-notifications"
                                        className="svg-notifications"
                                    />
                                </div>
                            </Link>
                        </li>
                    ) : null}
                    {isStaff && topbar.tasks.enabled ? (
                        <li
                            ref={tasksMenuRef}
                            className={`all_complete tasks_tooltip dropdown right-menu${tasksMenuOpen ? ' open' : ''}`}
                        >
                            <button
                                type="button"
                                aria-expanded={tasksMenuOpen}
                                className="link"
                                title="Twoje zadania"
                                aria-label="Twoje zadania"
                                onClick={() =>
                                    setTasksMenuOpen((value) => !value)
                                }
                            >
                                <div
                                    className="assigned_tasks"
                                    data-assigned_tasks={tasksCount}
                                >
                                    <SalonIcon
                                        id="svg-todo"
                                        className="svg-todo"
                                    />
                                </div>
                            </button>
                            <div className="dropdown_cover"></div>
                            <ul
                                className="dropdown-menu dropdown-menu-tasks"
                                id="dropdownTasks"
                                role="menu"
                            >
                                <li className="main-menu-li">
                                    <Link
                                        href="/appointments?status=online_pending"
                                        onClick={() => setTasksMenuOpen(false)}
                                    >
                                        Wizyty oczekujące na potwierdzenie
                                        <span className="tasks-menu-count">
                                            {pendingCount}
                                        </span>
                                    </Link>
                                </li>
                                {pendingCount === 0 ? (
                                    <>
                                        <li className="divider"></li>
                                        <li className="main-menu-li">
                                            <span className="tasks-menu-empty">
                                                Brak oczekujących wizyt.
                                            </span>
                                        </li>
                                    </>
                                ) : null}
                            </ul>
                        </li>
                    ) : null}
                    <li
                        ref={helpMenuRef}
                        className={`dropdown help_tooltip right-menu${helpMenuOpen ? ' open' : ''}`}
                    >
                        <button
                            type="button"
                            className="ai-center d-flex dropdown-toggle"
                            aria-label="Pomoc"
                            aria-expanded={helpMenuOpen}
                            onClick={() => setHelpMenuOpen((value) => !value)}
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
                        </button>
                        <ul className="dropdown-menu larger-dropdown-menu nav-help">
                            {topbar.help.showChat ? (
                                <>
                                    <li className="main-menu-li">
                                        <button type="button" id="chat_widget">
                                            <div className="jQ_chat_notification">
                                                <SalonIcon
                                                    id="svg-help"
                                                    className="svg-chat"
                                                />
                                            </div>
                                            <span>Czat z konsultantem</span>
                                        </button>
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
                                            href={topbar.help.knowledgeBaseHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
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
                        <button
                            type="button"
                            className="dropdown-toggle e2e-nav-user-dropdown"
                            aria-label="Menu użytkownika"
                            aria-expanded={userMenuOpen}
                            onClick={() => setUserMenuOpen((value) => !value)}
                        >
                            <div className="border-color" aria-hidden="true">
                                {topbar.user.avatarUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        alt=""
                                        className="color1 color1--img"
                                        src={topbar.user.avatarUrl}
                                    />
                                ) : (
                                    <div className="color1">
                                        {topbar.user.initials}
                                    </div>
                                )}
                            </div>
                        </button>
                        <ul className="dropdown-menu larger-dropdown-menu topbar-user-menu">
                            <li className="main-menu-li topbar-user-head">
                                <div className="topbar-user-card">
                                    {topbar.user.avatarUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            alt=""
                                            className="topbar-user-avatar topbar-user-avatar--img"
                                            src={topbar.user.avatarUrl}
                                        />
                                    ) : (
                                        <span
                                            className="topbar-user-avatar"
                                            aria-hidden="true"
                                        >
                                            {topbar.user.initials}
                                        </span>
                                    )}
                                    <span className="topbar-user-meta">
                                        <strong>{topbar.user.fullName}</strong>
                                        <span className="topbar-user-role">
                                            {topbar.user.roleLabel}
                                        </span>
                                        {user?.email ? (
                                            <span className="topbar-user-email">
                                                {user.email}
                                            </span>
                                        ) : null}
                                    </span>
                                </div>
                            </li>
                            <li className="divider"></li>
                            <li className="main-menu-li">
                                <Link
                                    href="/account"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    Edytuj profil
                                </Link>
                            </li>
                            <li className="main-menu-li">
                                <Link
                                    href="/account"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    Zmień hasło
                                </Link>
                            </li>
                            {user?.role === 'employee' ? (
                                <li className="main-menu-li">
                                    <Link
                                        href="/schedule"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        Mój grafik
                                    </Link>
                                </li>
                            ) : null}
                            <li className="divider"></li>
                            <li className="main-menu-li">
                                <button
                                    type="button"
                                    className="e2e-user-logout"
                                    onClick={handleLogout}
                                >
                                    Wyloguj
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    );
}
