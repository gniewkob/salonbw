import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: '/calendar',
        permanent: false,
    },
});

export default function AppointmentsAliasPage() {
    return null;
}
