import type { GetServerSideProps } from 'next';

import { buildRobotsTxt } from '@/utils/robots';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    const body = buildRobotsTxt({ host: req.headers.host });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Short cache: the answer depends on which host served the request, and
    // it flips once at cutover.
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.write(body);
    res.end();

    return { props: {} };
};

export default function Robots() {
    return null;
}
