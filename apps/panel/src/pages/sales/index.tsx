import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: '/sales/history',
        permanent: false,
    },
});

export default function SalesIndexRedirect() {
    return null;
}
