import Head from 'next/head';
import CalendarViewsRoute from '@/components/salon/calendar/CalendarViewsRoute';

export default function CalendarViewsNewPage() {
    return (
        <>
            <Head>
                <title>Nowy widok kalendarza — Salon Black &amp; White</title>
            </Head>
            <CalendarViewsRoute nestedCreate />
        </>
    );
}
