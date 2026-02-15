import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: '/deliveries/history',
        permanent: false,
    },
});

export default function DeliveriesIndexRedirect() {
    return null;
}
