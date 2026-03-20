import type { NextApiRequest, NextApiResponse } from 'next';
import { getCalendarViews, renderCalendarViewsDropdown } from './_shared';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const views = await getCalendarViews(req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(renderCalendarViewsDropdown(views));
}
