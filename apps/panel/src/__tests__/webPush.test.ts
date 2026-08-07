import {
    describePushState,
    isPushSupported,
    resolvePermissionState,
    urlBase64ToUint8Array,
} from '@/utils/webPush';

describe('urlBase64ToUint8Array', () => {
    // VAPID keys arrive base64url-encoded; plain atob would choke on the
    // `-`/`_` alphabet and the stripped padding.
    it('decodes base64url with missing padding', () => {
        // "Hello" -> "SGVsbG8" in base64url (padding stripped).
        const out = urlBase64ToUint8Array('SGVsbG8');
        expect(Array.from(out)).toEqual([72, 101, 108, 108, 111]);
    });

    it('maps the base64url alphabet back to standard base64', () => {
        // 0xFB 0xFF decodes from "-_8" (base64url) but not from plain base64.
        const out = urlBase64ToUint8Array('-_8');
        expect(Array.from(out)).toEqual([251, 255]);
    });
});

describe('isPushSupported', () => {
    const full = {
        isSecureContext: true,
        Notification: {},
        navigator: { serviceWorker: {} },
        PushManager: {},
    };

    it('accepts a secure context with the full push API', () => {
        expect(isPushSupported(full)).toBe(true);
    });

    // Service Workers do not exist over plain http, so the button must not
    // appear there — otherwise it fails only after the user taps it.
    it('rejects an insecure context', () => {
        expect(isPushSupported({ ...full, isSecureContext: false })).toBe(
            false,
        );
    });

    it('rejects a browser without PushManager', () => {
        expect(isPushSupported({ ...full, PushManager: undefined })).toBe(
            false,
        );
    });

    it('rejects a browser without service worker support', () => {
        expect(isPushSupported({ ...full, navigator: {} })).toBe(false);
    });
});

describe('resolvePermissionState', () => {
    it('reports unsupported regardless of permission', () => {
        expect(resolvePermissionState(false, 'granted')).toBe('unsupported');
    });

    it.each([
        ['granted', 'granted'],
        ['denied', 'denied'],
        ['default', 'default'],
        [undefined, 'default'],
    ])('maps permission %s to %s', (permission, expected) => {
        expect(resolvePermissionState(true, permission as string)).toBe(
            expected,
        );
    });
});

describe('describePushState', () => {
    // "denied" is materially different from "default": the browser will not
    // show a prompt again, so the copy has to send the user to settings
    // instead of implying another tap will work.
    it('tells a blocked user to unblock in browser settings', () => {
        expect(describePushState('denied', false)).toMatch(/zablokowane/i);
    });

    it('points iPhone users to the home screen when unsupported', () => {
        expect(describePushState('unsupported', false)).toMatch(
            /ekranu głównego/i,
        );
    });

    it('distinguishes granted-and-subscribed from granted-only', () => {
        expect(describePushState('granted', true)).toMatch(/włączone/i);
        expect(describePushState('granted', false)).not.toMatch(/włączone/i);
    });
});
