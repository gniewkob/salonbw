/**
 * The current PostgreSQL timestamp columns discard pg's encoded UTC offset.
 * Hydration reconstructs the local clock fields in this process timezone.
 * Reject instants that would come back as another occurrence of a DST fold.
 * This guard does not change the process timezone or existing stored values.
 */
export function isLosslessLocalTimestamp(instant: Date): boolean {
    if (!Number.isFinite(instant.getTime())) return false;
    const hydrated = new Date(0);
    hydrated.setFullYear(
        instant.getFullYear(),
        instant.getMonth(),
        instant.getDate(),
    );
    hydrated.setHours(
        instant.getHours(),
        instant.getMinutes(),
        instant.getSeconds(),
        instant.getMilliseconds(),
    );
    return hydrated.getTime() === instant.getTime();
}
