'use client';

import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import NewsletterEditorModal from '@/components/newsletters/NewsletterEditorModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterMutations } from '@/hooks/useNewsletters';
import type { CreateNewsletterRequest } from '@/types';

export default function NewsletterNewPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { createNewsletter } = useNewsletterMutations();
    const rawRecipientId = Array.isArray(router.query.recipientId)
        ? router.query.recipientId[0]
        : router.query.recipientId;
    const rawPlatform = Array.isArray(router.query.platform)
        ? router.query.platform[0]
        : router.query.platform;
    const rawSingle = Array.isArray(router.query.single)
        ? router.query.single[0]
        : router.query.single;

    const initialRecipientId = rawRecipientId ? Number(rawRecipientId) : null;
    const initialChannel = rawPlatform === 'sms' ? 'sms' : 'email';
    const initialFilterMode =
        rawSingle === '1' && initialRecipientId ? 'manual' : 'filter';

    if (!role) return null;

    const handleClose = () => {
        void router.push('/messages');
    };

    const handleSave = async (data: CreateNewsletterRequest) => {
        await createNewsletter.mutateAsync(data);
        await router.push('/messages');
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[
                            { label: 'Komunikacja', href: '/communication' },
                            { label: 'Nowy newsletter' },
                        ]}
                    />

                    <NewsletterEditorModal
                        isOpen
                        newsletter={null}
                        initialData={{
                            channel: initialChannel,
                            recipientIds:
                                initialFilterMode === 'manual' &&
                                initialRecipientId
                                    ? [initialRecipientId]
                                    : [],
                            filterMode: initialFilterMode,
                            recipientFilter:
                                initialFilterMode === 'filter'
                                    ? { hasEmailConsent: true }
                                    : undefined,
                        }}
                        onClose={handleClose}
                        onSave={handleSave}
                    />
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
