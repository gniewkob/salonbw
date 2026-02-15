import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: '/orders/history',
        permanent: false,
    },
});

export default function OrdersIndexRedirect() {
    return null;
}
