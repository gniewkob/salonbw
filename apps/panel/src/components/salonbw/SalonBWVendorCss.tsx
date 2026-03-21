'use client';

/* eslint-disable @next/next/no-css-tags */
import Head from 'next/head';

/**
 * Local copies of source vendor stylesheets from the compatibility folder
 * `apps/panel/public/salonbw-vendor/css/*`.
 * Loaded only on legacy-heavy content views (customers/products) and followed by
 * shell-lock overrides so shared nav/topbar proportions stay aligned with `/calendar`.
 */
export default function SalonBWVendorCss() {
    return (
        <Head>
            {/* Match source typography on Customers pages */}
            <link
                rel="stylesheet"
                media="only x"
                href="https://fonts.googleapis.com/css?family=Open+Sans:400italic,600italic,700italic,400,600,700&subset=latin,latin-ext"
                onLoad={(e) => {
                    // Non-blocking font CSS loading (źródłowy system używa a similar pattern).
                    e.currentTarget.media = 'all';
                }}
            />
            <link
                rel="stylesheet"
                media="only x"
                href="https://fonts.googleapis.com/css?family=Lato:300&subset=latin,latin-ext"
                onLoad={(e) => {
                    e.currentTarget.media = 'all';
                }}
            />
            <link
                rel="stylesheet"
                href="/salonbw-vendor/css/jquery-ui-bundle.css"
            />
            <link rel="stylesheet" href="/salonbw-vendor/css/new-ui.css" />
            <link rel="stylesheet" href="/salonbw-vendor/css/responsive.css" />
            <link rel="stylesheet" href="/salonbw-vendor/css/default.css" />
            <link rel="stylesheet" href="/salonbw-vendor/css/style.css" />
            <link rel="stylesheet" href="/salonbw-vendor/css/Icon.css" />
            <link rel="stylesheet" href="/salonbw-vendor/css/Nestable.css" />
            <style>{`
                /* Keep the shared shell visually aligned with /calendar even when
                   page-level source vendor CSS is loaded for customers/products. */
                #navbar.navbar.navbar-default {
                    height: var(--salonbw-topbar-h) !important;
                    min-height: var(--salonbw-topbar-h) !important;
                    padding-left: var(--salonbw-mainnav-w) !important;
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 30 !important;
                    margin: 0 !important;
                    border-bottom: 1px solid #d9dfe5 !important;
                    background: #fff !important;
                }

                #navbar.navbar.navbar-default .brand {
                    left: 75px !important;
                    top: 0 !important;
                    height: var(--salonbw-mainnav-item-h) !important;
                    display: flex !important;
                    align-items: center !important;
                }

                #navbar.navbar.navbar-default .navbar-right {
                    display: flex !important;
                    align-items: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                #mainnav.mainnav,
                .mainnav#mainnav {
                    width: var(--salonbw-mainnav-w) !important;
                    background: var(--salonbw-mainnav-bg) !important;
                    color: #93a1b0 !important;
                    border-right: 1px solid #1b1e22 !important;
                }

                #mainnav.mainnav .nav {
                    display: flex !important;
                    flex-direction: column !important;
                    min-height: 100vh !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                #mainnav.mainnav .nav li {
                    min-height: var(--salonbw-mainnav-item-h) !important;
                }

                #mainnav.mainnav .nav li a {
                    min-height: var(--salonbw-mainnav-item-h) !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 4px !important;
                    padding: 6px 4px !important;
                    color: inherit !important;
                    font-size: 12px !important;
                    line-height: 1.1 !important;
                    text-transform: lowercase !important;
                    text-decoration: none !important;
                }

                #mainnav.mainnav .nav li svg {
                    width: 24px !important;
                    height: 24px !important;
                }

                #sidenav.sidenav {
                    width: var(--salonbw-sidenav-w) !important;
                }

                #main-content.main-content .inner {
                    max-width: none !important;
                }
            `}</style>
        </Head>
    );
}
