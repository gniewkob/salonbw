const DEFAULT_PANEL_URL = 'https://panel.salon-bw.pl';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getPanelBaseUrl = () =>
    trimTrailingSlash(
        process.env.NEXT_PUBLIC_PANEL_URL || DEFAULT_PANEL_URL,
    );

export const getPanelUrl = (path = '') => {
    const base = getPanelBaseUrl();
    if (!path) {
        return base;
    }
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};
