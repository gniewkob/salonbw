import Head from 'next/head';
import CalendarViewsRoute from '@/components/salon/calendar/CalendarViewsRoute';

export default function CalendarViewsIndexPage() {
    return (
        <>
            <Head>
                <title>Widoki kalendarza — Salon Black &amp; White</title>
            </Head>
            <CalendarViewsRoute />
        </>
    );
}
