export function processRequestDuration(): () => number {
    const start = process.hrtime.bigint();
    return () => {
        const diff = process.hrtime.bigint() - start;
        return Number(diff) / 1_000_000_000;
    };
}
