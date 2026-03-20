import type { NextApiRequest, NextApiResponse } from 'next';
import { getEmployees, renderCalendarViewForm } from './_shared';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const employees = await getEmployees(req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
        renderCalendarViewForm({
            employees,
            action: '/api/runtime/calendar-views',
            method: 'POST',
        }),
    );
}
