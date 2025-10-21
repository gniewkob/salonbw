import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    node: process.version,
    platform: process.platform,
    versions: process.versions,
  });
}

