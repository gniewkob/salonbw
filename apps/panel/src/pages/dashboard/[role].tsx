import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
        destination: '/appointments',
        permanent: false,
    },
});

export default function DashboardRoleRedirect() {
    return null;
}
