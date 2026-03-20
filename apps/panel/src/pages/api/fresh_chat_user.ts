import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    // Legacy vendor scripts may poll this endpoint; return a stable empty payload.
    res.status(200).json({});
}
