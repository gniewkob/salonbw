import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';

interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * Serves the vendored calendar HTML with injected config for our backend.
 * This avoids script loading conflicts with Next.js hydration.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    // Check for auth token
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        res.redirect(307, '/auth/login?redirectTo=/calendar');
        return;
    }

    // Decode JWT to get user info (we don't verify here, auth is handled by backend)
    let userId = 1;
    const decoded = decodeJwtPayload(accessToken);
    if (decoded?.userId) {
        userId = decoded.userId;
    }

    try {
        const htmlPath = path.join(
            process.cwd(),
            'public',
            'versum-calendar',
            'index.html',
        );

        let html = await fs.readFile(htmlPath, 'utf8');

        // Check for PJAX request
        const isPjax =
            req.headers['x-pjax'] === 'true' ||
            req.headers['x-pjax'] === 'true';

        // START slicing logic
        if (isPjax) {
            // If PJAX, we validly assume the shell (CSS/JS) is loaded, BUT
            // the legacy calendar relies on specific global variables and scripts
            // that are in the <head> of index.html.
            // We need to return the <head> scripts/styles + #main-content.

            // Extract Main Content
            // We want everything inside #main-content. This is legacy HTML and we keep
            // the logic minimal; avoid brittle parsing unless PJAX support is revived.
            // Actually, looking at the file:
            // Line 250: <div class="main-content calendar" id="main-content" role="main">
            // ... content ...
            // Line 519 (approx): </div> (closing main-content)

            // Let's use a simpler approach: Return the innerHTML of main-content IF we can find it.
            // BUT we also need the scripts at the end of body.

            // Alternative: Return the WHOLE body but strip the sidebar and navbar.
            // This ensures we get all scripts.

            // 1. Remove Navbar
            html = html.replace(
                /<div class="navbar[\s\S]*?<div class="main-container"/,
                '<div class="main-container"',
            );

            // 2. Remove Sidebar (be careful not to remove main-content)
            // Sidebar starts at <div class="sidebar ...> and ends before <div class="main-content ...>
            html = html.replace(
                /<div class="sidebar[\s\S]*?<div class="main-content/,
                '<div class="main-content',
            );

            // 3. Remove <html>, <head>, <body> tags but keep content?
            // Actually, LegacyHtmlContainer puts it in a div.
            // If we have <html> tags inside a div, browser might strip them or handle weirdly.

            // Let's go with: Return everything, but hiding/removing the UI shells.
            // If we return the whole HTML string, `dangerouslySetInnerHTML` will try to render it.
            // <html> and <body> tags inside a div are invalid but usually ignored, content is rendered.
            // <head> content inside body/div is also invalid but often styles work.

            // Refined Strategy for PJAX:
            // 1. Get HEAD content.
            // 2. Get BODY content, stripping Navbar and Sidebar.
            // 3. Return combined.

            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
            let bodyContent = bodyMatch ? bodyMatch[1] : '';

            // Remove Navbar (generic match for the navbar block)
            bodyContent = bodyContent.replace(
                /<div class="navbar[\s\S]*?id="navbar"[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/,
                '',
            );
            // Actually the navbar div starts at line 111.
            // Let's target by ID.

            // Remove Sidebar
            // <div class="sidebar hidden-print" id="sidebar"> ... </div> (closing sidebar)
            // It's safer to use CSS to hide them if we can't strip cleanly?
            // No, strictly stripping is better to avoid duplicate ID conflicts with React Shell.

            // Strip Navbar: <div ... id="navbar"> ... </div>
            // This is hard with regex.
            // HACK: We inject a style to hide them strictly?
            // No, ID conflict is the issue.

            // Let's try to locate the specific strings from the file view.
            const navbarStart =
                '<div class="navbar navbar-default navbar-static-top d-flex" id="navbar">';
            const mainContainerStart =
                '<div class="main-container" id="main-container">';

            const nStartIdx = bodyContent.indexOf(navbarStart);
            const mStartIdx = bodyContent.indexOf(mainContainerStart);

            if (nStartIdx !== -1 && mStartIdx !== -1) {
                // Remove everything between navbar start and main container start
                // (This assumes navbar is immediately before main container, which it is mostly)
                // actually there is <script> between them?
                // Line 186 to 192 are scripts. We want to KEEP them.
                // Remove navbar strictly.
                // It ends before the script?
                // Look at file:
                // 185: </div> (closing navbar)
                // 186: <script>
                // We can find the closing div of navbar? Risky.
                // FALLBACK: Just replace the specific ID with a non-existent one and hide it via CSS?
                // No, better to try to strip.
                // Let's grab the Main Content innerHTML + Scripts.
                // And header styles.
                // Actually, let's keep it simple:
                // Inject our Config Script (with correct config).
                // Then return the whole HTML, but inject a style to hide #sidebar and #navbar.
                // AND rename their IDs to avoid conflict?
                // Better:
                // Detect start of main-content.
                // Detect end of main-content.
                // Return: headContent + mainContent + footerScripts.
            }

            // Let's implement the Config Override FIRST, then slicing.
        }
        // END slicing setup (continued below)

        // Inject our VersumConfig to override the hardcoded one
        const ourConfig = {
            branch_id: 1,
            user_id: userId,
            branch_subdomain: 'salonblackandwhite',
            is_vat_payer: true,
            lumo: false,
            medical_office: false,
            resources_activated: false,
            gift_cards_activated: false,
            tips: {
                tips_activated: true,
                tips_payment_methods: ['cash', 'credit_card'],
                tips_default_percents: '10',
            },
            prepayments_enabled: false,
            online_payments_enabled: false,
            env: 'production',
            application: {
                api: {
                    deviceToken: null,
                    graphQL: { url: '/graphql' },
                    // Skip OAuth - we use JWT via cookies
                    auth: { url: '/api/auth/token', clientId: 'salonbw' },
                },
            },
            t_net: 'netto',
            t_gross: 'brutto',
            current_branch_readonly: false,
        };

        // Inject config override script and fetch interceptor before closing </head>
        const configScript = `
<script>
// Override VersumConfig with SalonBW config
window.VersumConfig = ${JSON.stringify(ourConfig)};

// Intercept fetch to add Authorization header
(function() {
    const token = '${accessToken}';
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        options = options || {};
        options.headers = options.headers || {};

        // Add Authorization header for API calls
        if (typeof url === 'string' && (
            url.includes('/events') ||
            url.includes('/graphql') ||
            url.includes('/settings/timetable') ||
            url.includes('/track_new_events')
        )) {
            if (options.headers instanceof Headers) {
                options.headers.set('Authorization', 'Bearer ' + token);
            } else {
                options.headers['Authorization'] = 'Bearer ' + token;
            }
        }

        return originalFetch.call(this, url, options);
    };

    // Also intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
        if (this._url && (
            this._url.includes('/events') ||
            this._url.includes('/graphql') ||
            this._url.includes('/settings/timetable') ||
            this._url.includes('/track_new_events')
        )) {
            this.setRequestHeader('Authorization', 'Bearer ' + token);
        }
        return originalXHRSend.apply(this, arguments);
    };
})();
</script>

// Fix for session loss on navigation:
// Intercept clicks on sidebar links to prevent vendored scripts from handling them
// and potentially messing up the session. Force standard navigation.
document.addEventListener('DOMContentLoaded', function() {
    // We need to wait a tick to ensure vendored scripts have attached their listeners
    // so we can strip them or attach ours after/replace them.
    setTimeout(function() {
        // Select all links in the main navigation and secondary navigation
        const navLinks = document.querySelectorAll('#mainnav a, .mainnav a, #sidebar a');
        
        navLinks.forEach(function(link) {
            // Skip links that are javascript:; or #
            const href = link.getAttribute('href');
            if (!href || href.indexOf('javascript') === 0 || href === '#') return;

            // Clone the node to strip all event listeners (including JQuery ones)
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Add clean click handler
            newLink.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = href;
            });
        });
    }, 500); // 500ms delay to be safe vs vendored scripts
});
`;
        html = html.replace('</head>', `${configScript}</head>`);

        // If PJAX, Slice the HTML to remove the shell
        if (isPjax) {
            // Remove the Navbar
            // Regex to match <div ... id="navbar">...</div> including nested divs?
            // Difficult.
            // Alternative: Inject CSS to hide #navbar and #sidebar.
            // AND Remove IDs to avoid conflict with React Shell.
            html = html.replace(
                'id="navbar"',
                'id="legacy-navbar" style="display:none !important"',
            );
            html = html.replace(
                'id="sidebar"',
                'id="legacy-sidebar" style="display:none !important"',
            );
            html = html.replace('id="mainnav"', 'id="legacy-mainnav"');
            // Also hide the noscript GTM
            html = html.replace(
                '<noscript>',
                '<noscript style="display:none">',
            );
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (error) {
        console.error('Calendar embed error:', error);
        res.status(500).send('Calendar not available');
    }
}
