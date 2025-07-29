import Head from 'next/head';

export default function HomePage() {
    return (
        <>
            <Head>
                <title>
                    Salon Black &amp; White | Professional Hair &amp; Beauty
                </title>
                <meta
                    name="description"
                    content="Home of Salon Black &amp; White offering professional hair and beauty services."
                />
            </Head>
            <div className="p-4 space-y-4">
                <h1 className="text-2xl font-bold">
                    Welcome to Salon Black &amp; White
                </h1>
                <p>Professional hair and beauty services for every occasion.</p>
            </div>
        </>
    );
}
