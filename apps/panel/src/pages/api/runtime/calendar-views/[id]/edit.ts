import type { NextApiRequest, NextApiResponse } from 'next';
import {
    getCalendarViews,
    getEmployees,
    renderCalendarViewForm,
} from '../_shared';

function parseId(value: string | string[] | undefined) {
    const raw = Array.isArray(value) ? value[0] : value;
    const id = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(id) ? id : null;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const id = parseId(req.query.id);
    if (!id) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }

    const [views, employees] = await Promise.all([
        getCalendarViews(req),
        getEmployees(req),
    ]);
    const view = views.find((item) => item.id === id);

    if (!view) {
        res.status(404).json({ error: 'Not found' });
        return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
        renderCalendarViewForm({
            employees,
            value: view,
            action: `/api/runtime/calendar-views/${id}`,
            method: 'PUT',
        }),
    );
}
