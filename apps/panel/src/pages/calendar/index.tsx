import { useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';

interface CalendarEmbedPageProps {
    html: string;
}

export const getServerSideProps: GetServerSideProps<
    CalendarEmbedPageProps
> = async () => {
    const htmlPath = path.join(
        process.cwd(),
        'public',
        'versum-calendar',
        'index.html',
    );

    const html = await fs.readFile(htmlPath, 'utf8');

    return {
        props: { html },
    };
};

export default function CalendarEmbedPage({ html }: CalendarEmbedPageProps) {
    useEffect(() => {
        document.open();
        document.write(html);
        document.close();
    }, [html]);

    return null;
}
