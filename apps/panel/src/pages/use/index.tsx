import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: '/use/history',
        permanent: false,
    },
});

export default function UsageIndexRedirect() {
    return null;
}
