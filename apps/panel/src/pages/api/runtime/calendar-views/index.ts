import type { NextApiRequest, NextApiResponse } from 'next';
import {
    createCalendarView,
    getCalendarViews,
    getEmployees,
    normalizeCalendarViewPayload,
    renderCalendarViewsIndex,
    renderCalendarViewForm,
    validateCalendarViewPayload,
} from './_shared';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === 'GET') {
        const [views, employees] = await Promise.all([
            getCalendarViews(req),
            getEmployees(req),
        ]);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(renderCalendarViewsIndex(views, employees));
        return;
    }

    if (req.method === 'POST') {
        const payload = normalizeCalendarViewPayload(req.body);
        const validationError = validateCalendarViewPayload(payload);

        if (validationError) {
            const employees = await getEmployees(req);
            res.status(422).json({
                html: renderCalendarViewForm({
                    employees,
                    value: payload,
                    error: validationError,
                    action: '/api/runtime/calendar-views',
                    method: 'POST',
                }),
            });
            return;
        }

        await createCalendarView(req, payload);
        res.status(200).json({ success: true });
        return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method not allowed' });
}
