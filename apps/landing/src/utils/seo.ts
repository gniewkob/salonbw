export function jsonLd<T extends object>(data: T): string {
    return JSON.stringify(data);
}

export function absUrl(path: string, base?: string): string {
    // Canonical/og URLs must be absolute; fall back to the production
    // domain when NEXT_PUBLIC_SITE_URL is unset (dev, misconfigured env).
    const origin =
        base || process.env.NEXT_PUBLIC_SITE_URL || 'https://salon-bw.pl';
    try {
        return new URL(path, origin).toString();
    } catch {
        return path;
    }
}
