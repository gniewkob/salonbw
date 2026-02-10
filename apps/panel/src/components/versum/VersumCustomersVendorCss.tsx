'use client';

/* eslint-disable @next/next/no-css-tags */
import Head from 'next/head';

/**
 * Local copies of Versum vendor stylesheets (see `apps/panel/public/versum-vendor/css/*`).
 * Intentionally loaded only on Customers/Clients views to reduce global side-effects.
 */
export default function VersumCustomersVendorCss() {
    return (
        <Head>
            {/* Match Versum typography on Customers pages */}
            <link
                rel="stylesheet"
                media="only x"
                href="https://fonts.googleapis.com/css?family=Open+Sans:400italic,600italic,700italic,400,600,700&subset=latin,latin-ext"
                onLoad={(e) => {
                    // Non-blocking font CSS loading (Versum uses a similar pattern).
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
                href="/versum-vendor/css/jquery-ui-bundle.css"
            />
            <link rel="stylesheet" href="/versum-vendor/css/new-ui.css" />
            <link rel="stylesheet" href="/versum-vendor/css/responsive.css" />
            <link rel="stylesheet" href="/versum-vendor/css/default.css" />
            <link rel="stylesheet" href="/versum-vendor/css/style.css" />
            <link rel="stylesheet" href="/versum-vendor/css/Icon.css" />
            <link rel="stylesheet" href="/versum-vendor/css/Nestable.css" />
        </Head>
    );
}
