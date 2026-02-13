import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    // Compatibility endpoint for legacy Versum navbar widgets.
    res.status(200).json([]);
}
