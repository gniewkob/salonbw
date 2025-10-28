export function jsonLd<T extends object>(data: T): string {
    return JSON.stringify(data);
}

export function absUrl(path: string, base?: string): string {
    const origin = base || process.env.NEXT_PUBLIC_SITE_URL || '';
    if (!origin) return path;
    try {
        return new URL(path, origin).toString();
    } catch {
        return path;
    }
}

