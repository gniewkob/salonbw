import { useEffect } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';

export default function AdminWarehouseRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/products');
    }, [router]);

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <div className="p-6 text-sm text-gray-500">
                Przekierowanie do magazynu...
            </div>
        </RouteGuard>
    );
}
