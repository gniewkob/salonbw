import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CommunicationNav from '@/components/salon/navs/CommunicationNav';
import { useSmsHistory, useSmsMutations } from '@/hooks/useSms';
import { useEmailHistory, useEmailMutations } from '@/hooks/useEmails';

function getCommunicationHref(id: number, kind: 'sms' | 'email') {
    return {
        pathname: '/communication/[id]',
        query: { id: String(id), kind },
    } as const;
}

function formatDateTime(value?: string) {
    if (!value) return '-';
    try {
        return format(new Date(value), 'd MMM, HH:mm');
    } catch {
        return '-';
    }
}

export default function CommunicationPage() {
    const { role } = useAuth();
    const toast = useToast();
    const [kind, setKind] = useState<'sms' | 'email'>('sms');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    const smsHistory = useSmsHistory({
        page,
        limit: 20,
        status: kind === 'sms' ? status || undefined : undefined,
    });
    const emailHistory = useEmailHistory({
        page,
        limit: 20,
        status:
            kind === 'email' && status
                ? (status as 'pending' | 'sent' | 'failed')
                : undefined,
    });

    const { sendSms } = useSmsMutations();
    const { sendEmailAuth } = useEmailMutations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const secondaryNav = useMemo(() => <CommunicationNav />, []);
    useSetSecondaryNav(secondaryNav);

    const loading = kind === 'sms' ? smsHistory.loading : emailHistory.loading;
    const data = kind === 'sms' ? smsHistory.data : emailHistory.data;

    const resetCompose = () => {
        setRecipient('');
        setSubject('');
        setContent('');
    };

    const handleSend = async () => {
        if (!recipient.trim() || !content.trim()) return;
        if (kind === 'email' && !subject.trim()) return;

        setIsSending(true);
        try {
            if (kind === 'sms') {
                await sendSms.mutateAsync({ recipient, content });
                await smsHistory.refetch();
            } else {
                await sendEmailAuth.mutateAsync({
                    to: recipient,
                    subject,
                    template: content,
                });
                await emailHistory.refetch();
            }
            setIsModalOpen(false);
            resetCompose();
        } catch {
            toast.error('Wystąpił błąd podczas wysyłania wiadomości');
        }
        setIsSending(false);
    };

    const totalPages = data ? Math.ceil(data.total / data.limit) || 1 : 1;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <SalonShell role={role}>
                <div data-testid="communication-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[
                            { label: 'Łączność', href: '/communication' },
                            { label: 'Nieprzeczytane wiadomości' },
                        ]}
                    />

                    <div className="salonbw-page__toolbar mb-3">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Wyślij wiadomość pojedynczą
                        </button>
                        <Link
                            href="/communication/mass"
                            className="btn btn-outline-secondary btn-sm"
                        >
                            Wyślij wiadomość masową
                        </Link>
                    </div>

                    <div className="row g-2 mb-3">
                        <div className="col-md-3 col-sm-6">
                            <label
                                className="form-label small mb-1"
                                htmlFor="comm-kind"
                            >
                                Rodzaj:
                            </label>
                            <select
                                id="comm-kind"
                                className="form-select form-select-sm"
                                value={kind}
                                onChange={(e) => {
                                    setKind(e.target.value as 'sms' | 'email');
                                    setStatus('');
                                    setPage(1);
                                }}
                            >
                                <option value="sms">SMS i email</option>
                                <option value="email">tylko email</option>
                            </select>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <label
                                className="form-label small mb-1"
                                htmlFor="comm-status"
                            >
                                Status:
                            </label>
                            <select
                                id="comm-status"
                                className="form-select form-select-sm"
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    odczytane i nieodczytane
                                </option>
                                <option value="sent">wysłane</option>
                                <option value="delivered">dostarczone</option>
                                <option value="failed">nieudane</option>
                                <option value="pending">oczekujące</option>
                            </select>
                        </div>
                        <div className="col-md-3 col-sm-6 d-flex align-items-end gap-2">
                            <Link
                                href="/communication/templates"
                                className="btn btn-outline-secondary btn-sm"
                            >
                                Szablony
                            </Link>
                            <Link
                                href="/communication/reminders"
                                className="btn btn-outline-secondary btn-sm"
                            >
                                Przypomnienia
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="salonbw-loading">
                            Ładowanie wiadomości...
                        </div>
                    ) : data && data.total > 0 ? (
                        <>
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover table-sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Odbiorca</th>
                                            <th>Wiadomość</th>
                                            <th>Rodzaj</th>
                                            <th>Wysłano</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kind !== 'email'
                                            ? smsHistory.data.items.map(
                                                  (entry) => (
                                                      <tr
                                                          key={`sms-${entry.id}`}
                                                      >
                                                          <td>
                                                              <Link
                                                                  href={getCommunicationHref(
                                                                      entry.id,
                                                                      'sms',
                                                                  )}
                                                              >
                                                                  {
                                                                      entry.recipient
                                                                  }
                                                              </Link>
                                                          </td>
                                                          <td>
                                                              <Link
                                                                  href={getCommunicationHref(
                                                                      entry.id,
                                                                      'sms',
                                                                  )}
                                                              >
                                                                  {entry.subject ||
                                                                      'Wiadomość'}
                                                              </Link>
                                                              <div className="text-muted small">
                                                                  {entry.content.slice(
                                                                      0,
                                                                      120,
                                                                  )}
                                                                  {entry.content
                                                                      .length >
                                                                  120
                                                                      ? '...'
                                                                      : ''}
                                                              </div>
                                                          </td>
                                                          <td>
                                                              <span className="badge text-bg-info">
                                                                  {entry.channel ||
                                                                      'sms'}
                                                              </span>
                                                          </td>
                                                          <td className="text-nowrap">
                                                              {formatDateTime(
                                                                  entry.sentAt ||
                                                                      entry.createdAt,
                                                              )}
                                                          </td>
                                                      </tr>
                                                  ),
                                              )
                                            : emailHistory.data.items.map(
                                                  (entry) => (
                                                      <tr
                                                          key={`email-${entry.id}`}
                                                      >
                                                          <td>
                                                              <Link
                                                                  href={getCommunicationHref(
                                                                      entry.id,
                                                                      'email',
                                                                  )}
                                                              >
                                                                  {entry.to}
                                                              </Link>
                                                          </td>
                                                          <td>
                                                              <Link
                                                                  href={getCommunicationHref(
                                                                      entry.id,
                                                                      'email',
                                                                  )}
                                                              >
                                                                  {entry.subject ||
                                                                      'Email'}
                                                              </Link>
                                                              <div className="text-muted small">
                                                                  {(
                                                                      entry.template ??
                                                                      ''
                                                                  ).slice(
                                                                      0,
                                                                      120,
                                                                  )}
                                                                  {(
                                                                      entry.template ??
                                                                      ''
                                                                  ).length > 120
                                                                      ? '...'
                                                                      : ''}
                                                              </div>
                                                          </td>
                                                          <td>
                                                              <span className="badge text-bg-info">
                                                                  email
                                                              </span>
                                                          </td>
                                                          <td className="text-nowrap">
                                                              {formatDateTime(
                                                                  entry.sentAt ||
                                                                      entry.createdAt,
                                                              )}
                                                          </td>
                                                      </tr>
                                                  ),
                                              )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex align-items-center justify-content-between mt-2">
                                <span className="text-muted small">
                                    Pozycje od{' '}
                                    {Math.min(
                                        (page - 1) * data.limit + 1,
                                        data.total,
                                    )}{' '}
                                    do {Math.min(page * data.limit, data.total)}{' '}
                                    z {data.total}
                                </span>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        aria-label="Poprzednia strona"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                    >
                                        ‹
                                    </button>
                                    <span className="small">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        aria-label="Następna strona"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="salonbw-empty">Brak wiadomości</div>
                    )}
                </div>

                <Modal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        resetCompose();
                    }}
                    size="sm"
                >
                    <h5 className="fw-bold mb-4">
                        Wyślij wiadomość ({kind === 'sms' ? 'SMS' : 'Email'})
                    </h5>
                    <div className="mb-3">
                        <label
                            htmlFor="compose-recipient"
                            className="form-label"
                        >
                            Odbiorca {kind === 'sms' ? '(telefon)' : '(email)'}
                        </label>
                        <input
                            id="compose-recipient"
                            className="form-control"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder={
                                kind === 'sms' ? '+48...' : 'klient@example.com'
                            }
                        />
                    </div>
                    {kind === 'email' && (
                        <div className="mb-3">
                            <label
                                htmlFor="compose-subject"
                                className="form-label"
                            >
                                Temat
                            </label>
                            <input
                                id="compose-subject"
                                className="form-control"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Temat wiadomości"
                            />
                        </div>
                    )}
                    <div className="mb-4">
                        <label htmlFor="compose-content" className="form-label">
                            Treść
                        </label>
                        <textarea
                            id="compose-content"
                            className="form-control"
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="d-flex gap-2 justify-content-end">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => {
                                setIsModalOpen(false);
                                resetCompose();
                            }}
                        >
                            Anuluj
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={
                                isSending ||
                                !recipient.trim() ||
                                !content.trim() ||
                                (kind === 'email' && !subject.trim())
                            }
                            onClick={() => void handleSend()}
                        >
                            {isSending ? 'Wysyłanie...' : 'Wyślij'}
                        </button>
                    </div>
                </Modal>
            </SalonShell>
        </RouteGuard>
    );
}
