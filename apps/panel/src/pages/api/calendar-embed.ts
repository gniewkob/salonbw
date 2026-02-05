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
`;
        html = html.replace('</head>', `${configScript}</head>`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (error) {
        console.error('Calendar embed error:', error);
        res.status(500).send('Calendar not available');
    }
}
