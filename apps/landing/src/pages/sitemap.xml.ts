import type { GetServerSideProps } from 'next';

const staticPaths: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: '/',                      priority: '1.0', changefreq: 'weekly'  },
    { path: '/about',                 priority: '0.8', changefreq: 'monthly' },
    { path: '/services',              priority: '0.9', changefreq: 'weekly'  },
    { path: '/services/coloring',     priority: '0.8', changefreq: 'monthly' },
    { path: '/services/balayage',     priority: '0.8', changefreq: 'monthly' },
    { path: '/services/highlights',   priority: '0.8', changefreq: 'monthly' },
    { path: '/gallery',               priority: '0.7', changefreq: 'weekly'  },
    { path: '/contact',               priority: '0.8', changefreq: 'monthly' },
    { path: '/policy',                priority: '0.3', changefreq: 'yearly'  },
    { path: '/privacy',               priority: '0.3', changefreq: 'yearly'  },
];

const today = new Date().toISOString().split('T')[0];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://salon-bw.pl';
    const urls = staticPaths
        .map(({ path, priority, changefreq }) =>
            `<url>` +
            `<loc>${new URL(path, base).toString()}</loc>` +
            `<lastmod>${today}</lastmod>` +
            `<changefreq>${changefreq}</changefreq>` +
            `<priority>${priority}</priority>` +
            `</url>`,
        )
        .join('');
    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.write(xml);
    res.end();

    return { props: {} };
};

export default function SiteMap() {
    return null;
}
