/**
 * Choose a future V18 real-stack UAT slot using actual weekly opening hours.
 * Pure Node/Playwright helper; no browser, database or network dependencies.
 * Dates are calendar dates in Europe/Warsaw (ISO YYYY-MM-DD).
 */
export function chooseOwnerUatSlot(hours, firstDate) {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    if (typeof firstDate !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(firstDate)) {
        throw new Error('OWNER_BROWSER_UAT_INVALID_DATE');
    }
    const startNoonUtc = new Date(firstDate + 'T12:00:00Z');
    if (!Number.isFinite(startNoonUtc.getTime()) ||
        startNoonUtc.toISOString().slice(0, 10) !== firstDate) {
        throw new Error('OWNER_BROWSER_UAT_INVALID_DATE');
    }
    const parseTime = (value) => {
        if (typeof value !== 'string' ||
            !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) return null;
        const [hour, minute] = value.split(':').map(Number);
        return hour * 60 + minute;
    };
    for (let offset = 0; offset < 14; offset += 1) {
        const date = new Date(startNoonUtc);
        date.setUTCDate(date.getUTCDate() + offset);
        const weekday = keys[date.getUTCDay()];
        for (const range of hours?.[weekday] ?? []) {
            const open = parseTime(range.open);
            const close = parseTime(range.close);
            if (open === null || close === null) continue;
            // A 15-minute grid lane fully inside a 45-minute service window.
            const start = Math.ceil(open / 15) * 15 + 15;
            if (start + 45 > close) continue;
            const hour = String(Math.floor(start / 60)).padStart(2, '0');
            const minute = String(start % 60).padStart(2, '0');
            return {
                date: date.toISOString().slice(0, 10),
                time: hour + ':' + minute + ':00',
            };
        }
    }
    throw new Error('OWNER_BROWSER_UAT_NO_BOOKABLE_WEEKLY_SLOT');
}
