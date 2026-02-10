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
