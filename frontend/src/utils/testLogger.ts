export type TestLogger = {
    enabled: boolean;
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

function computeEnabled(): boolean {
    if (typeof window !== 'undefined') {
        // Enable in Cypress environment or when explicitly toggled for local debugging
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isCypress = !!(window as any).Cypress;
        const flag = (window as unknown as { NEXT_PUBLIC_TEST_LOG?: string })
            ?.NEXT_PUBLIC_TEST_LOG;
        return isCypress || flag === 'true' || process.env.NEXT_PUBLIC_TEST_LOG === 'true';
    }
    // On server side, rely on env flag only
    return process.env.NEXT_PUBLIC_TEST_LOG === 'true';
}

function makeLogger(): TestLogger {
    const enabled = computeEnabled();
    const prefix = '[test]';
    const mk = (fn: (...a: unknown[]) => void) =>
        (...args: unknown[]) => {
            if (enabled) fn(prefix, ...args);
        };

    return {
        enabled,
        debug: mk(console.debug.bind(console)),
        info: mk(console.info.bind(console)),
        warn: mk(console.warn.bind(console)),
        error: mk(console.error.bind(console)),
    };
}

export const testLog: TestLogger = makeLogger();

