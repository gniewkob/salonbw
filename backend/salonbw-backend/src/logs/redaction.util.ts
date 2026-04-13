const SENSITIVE_KEY_PATTERN =
    /(password|token|authorization|cookie|secret|smtp|api[_-]?key)/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._-]+\b/gi;

function sanitizeString(value: string): string {
    return value
        .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
        .replace(BEARER_PATTERN, 'Bearer [REDACTED_TOKEN]');
}

export function sanitizeLogValue(value: unknown): unknown {
    if (typeof value === 'string') {
        return sanitizeString(value);
    }

    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeLogValue(entry));
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(
                ([key, entry]) => {
                    if (SENSITIVE_KEY_PATTERN.test(key)) {
                        return [key, '[REDACTED]'];
                    }
                    return [key, sanitizeLogValue(entry)];
                },
            ),
        );
    }

    return value;
}

export function maskEmail(value: string): string {
    const [localPart, domain] = value.split('@');
    if (!localPart || !domain) {
        return '[REDACTED_EMAIL]';
    }
    const visible = localPart.slice(0, 2);
    return `${visible}***@${domain}`;
}

export function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 4) {
        return '[REDACTED_PHONE]';
    }
    const visibleSuffix = digits.slice(-3);
    return `***${visibleSuffix}`;
}

export function maskGiftCardCode(value: string): string {
    if (!value || value.length < 4) {
        return '[REDACTED_GIFT_CARD]';
    }
    const visiblePrefix = value.slice(0, 2);
    const visibleSuffix = value.slice(-2);
    return `${visiblePrefix}***${visibleSuffix}`;
}
