import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import EmailList from '@/components/EmailList';

export default function EmailsPage() {
    return (
        <RouteGuard>
            <Layout>
                <EmailList />
            </Layout>
        </RouteGuard>
    );
}
