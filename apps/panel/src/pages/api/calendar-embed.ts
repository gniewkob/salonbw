import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';

const BACKEND_URL = process.env.API_PROXY_URL || 'https://api.salon-bw.pl';

interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

interface CalendarEmbedProfile {
    id?: number;
    role?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

type CalendarEmbedConfig = {
    branch_id: number;
    user_id: number;
    branch_subdomain: string;
    is_vat_payer: boolean;
    lumo: boolean;
    medical_office: boolean;
    resources_activated: boolean;
    gift_cards_activated: boolean;
    tips: {
        tips_activated: boolean;
        tips_payment_methods: string[];
        tips_default_percents: string;
    };
    prepayments_enabled: boolean;
    online_payments_enabled: boolean;
    env: string;
    application: {
        api: {
            deviceToken: null;
            graphQL: { url: string };
            auth: { url: string; clientId: string };
        };
    };
    t_net: string;
    t_gross: string;
    current_branch_readonly: boolean;
};

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

export function buildCalendarEmbedConfig(userId: number): CalendarEmbedConfig {
    return {
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
                auth: { url: '/api/auth/token', clientId: 'salonbw' },
            },
        },
        t_net: 'netto',
        t_gross: 'brutto',
        current_branch_readonly: false,
    };
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function deriveCalendarEmbedIdentity(
    profile?: CalendarEmbedProfile | null,
) {
    const fullName =
        profile?.name?.trim() ||
        [profile?.firstName, profile?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
    const [first = '', second = ''] = fullName.split(/\s+/, 2);
    const initials =
        `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || 'SB';

    return {
        fullName: fullName || 'Użytkownik',
        initials,
        roleLabel: profile?.role || 'administrator',
        profileHref: '/settings/profile',
        avatarUrl: profile?.avatarUrl?.trim() || null,
    };
}

export function rewriteCalendarEmbedUserIdentity(
    html: string,
    profile?: CalendarEmbedProfile | null,
) {
    const identity = deriveCalendarEmbedIdentity(profile);
    const escapedName = escapeHtml(identity.fullName);
    const escapedRole = escapeHtml(identity.roleLabel);
    const escapedHref = escapeHtml(identity.profileHref);
    const escapedInitials = escapeHtml(identity.initials);

    let nextHtml = html.replace(
        /<a class="profil" href="[^"]*">[\s\S]*?<strong>[\s\S]*?<\/strong>[\s\S]*?<\/a>/,
        `<a class="profil" href="${escapedHref}">${
            identity.avatarUrl
                ? `<img alt="Avatar" class="avatar" src="${escapeHtml(identity.avatarUrl)}"/>`
                : ''
        }<strong>${escapedName}</strong>${escapedRole}</a>`,
    );

    nextHtml = nextHtml.replace(
        /<div class="color1">[\s\S]*?<\/div>/,
        `<div class="color1">${escapedInitials}</div>`,
    );

    return nextHtml;
}

async function fetchCalendarEmbedProfile(accessToken: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Cache-Control': 'no-store',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as CalendarEmbedProfile;
    } catch {
        return null;
    }
}

export function buildCalendarEmbedScript(
    config: CalendarEmbedConfig,
    accessToken: string,
) {
    return `
<script>
// Expose SalonBW config while preserving the legacy global expected by vendored runtime
window.SalonBWConfig = ${JSON.stringify(config)};
window.VersumConfig = window.SalonBWConfig;

// Intercept fetch to add Authorization header
(function() {
    const token = '${accessToken}';
    const rewriteCalendarViewUrl = function(url, method) {
        if (typeof url !== 'string') return url;
        const upperMethod = (method || 'GET').toUpperCase();
        const normalized = url.replace(window.location.origin, '');
        const cleanPath = normalized.replace(/^\\/salonblackandwhite/, '');

        if (upperMethod === 'GET' && cleanPath === '/calendar/views') {
            return '/api/runtime/calendar-views';
        }
        if (upperMethod === 'GET' && cleanPath === '/calendar/views/list') {
            return '/api/runtime/calendar-views/list';
        }
        if (upperMethod === 'GET' && cleanPath === '/calendar/views/new') {
            return '/api/runtime/calendar-views/new';
        }
        const editMatch = cleanPath.match(/^\\/calendar\\/views\\/(\\d+)\\/edit$/);
        if (upperMethod === 'GET' && editMatch) {
            return '/api/runtime/calendar-views/' + editMatch[1] + '/edit';
        }

        return url;
    };
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        const rewrittenUrl = rewriteCalendarViewUrl(
            typeof url === 'string' ? url : String(url),
            options.method
        );

        // Add Authorization header for API calls
        if (typeof rewrittenUrl === 'string' && (
            rewrittenUrl.includes('/events') ||
            rewrittenUrl.includes('/graphql') ||
            rewrittenUrl.includes('/settings/timetable') ||
            rewrittenUrl.includes('/track_new_events')
        )) {
            if (options.headers instanceof Headers) {
                options.headers.set('Authorization', 'Bearer ' + token);
            } else {
                options.headers['Authorization'] = 'Bearer ' + token;
            }
        }

        return originalFetch.call(this, rewrittenUrl, options);
    };

    // Also intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        const rewrittenUrl = rewriteCalendarViewUrl(url, method);
        this._url = rewrittenUrl;
        const args = Array.prototype.slice.call(arguments);
        args[1] = rewrittenUrl;
        return originalXHROpen.apply(this, args);
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
<script>
// Fix for session loss on navigation.
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const navLinks = document.querySelectorAll('#mainnav a, .mainnav a, #sidebar a');
        
        navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (!href || href.indexOf('javascript') === 0 || href === '#') return;

            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = href;
            });
        });
    }, 500);
});
</script>
`;
}

export function rewriteCalendarEmbedAssetPaths(html: string) {
    return html
        .replaceAll('/versum-calendar/', '/salonbw-calendar/')
        .replaceAll('/versum-vendor/', '/salonbw-vendor/');
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
        html = rewriteCalendarEmbedAssetPaths(html);
        const profile = await fetchCalendarEmbedProfile(accessToken);
        html = rewriteCalendarEmbedUserIdentity(html, profile);

        // Vendored calendar template contains `user_id:userId` placeholder.
        // Resolve it server-side to avoid runtime `ReferenceError: userId is not defined`.
        html = html.replace(/"user_id":userId/g, `"user_id":${userId}`);

        const ourConfig = buildCalendarEmbedConfig(userId);
        const configScript = buildCalendarEmbedScript(ourConfig, accessToken);
        html = html.replace('</head>', `${configScript}</head>`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (error) {
        console.error('Calendar embed error:', error);
        res.status(500).send('Calendar not available');
    }
}
