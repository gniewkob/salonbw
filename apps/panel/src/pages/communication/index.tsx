import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
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

    if (!role) return null;

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
                await sendSms.mutateAsync({
                    recipient,
                    content,
                });
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
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Wystąpił błąd podczas wysyłania wiadomości');
        }
        setIsSending(false);
    };

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

                    <div className="inner">
                        <div className="actions">
                            <button
                                type="button"
                                className="button button-blue"
                                onClick={() => setIsModalOpen(true)}
                            >
                                wyślij wiadomość pojedynczą
                            </button>
                            <Link
                                href="/communication/mass"
                                className="button button-blue"
                            >
                                wyślij wiadomość masową
                            </Link>
                        </div>
                    </div>

                    <div className="inner">
                        <div className="row">
                            <div className="col-md-3 col-sm-6 mb-xs">
                                <span className="mr-s">Rodzaj:</span>
                                <select
                                    className="w-full"
                                    value={kind}
                                    aria-label="Rodzaj wiadomości"
                                    onChange={(event) => {
                                        setKind(
                                            event.target.value as
                                                | 'sms'
                                                | 'email',
                                        );
                                        setStatus('');
                                        setPage(1);
                                    }}
                                >
                                    <option value="sms">SMS i email</option>
                                    <option value="email">tylko email</option>
                                </select>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-xs">
                                <span className="mr-s">Status:</span>
                                <select
                                    className="w-full"
                                    value={status}
                                    aria-label="Status wiadomości"
                                    onChange={(event) => {
                                        setStatus(event.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">
                                        odczytane i nieodczytane
                                    </option>
                                    <option value="sent">wysłane</option>
                                    <option value="delivered">
                                        dostarczone
                                    </option>
                                    <option value="failed">nieudane</option>
                                    <option value="pending">oczekujące</option>
                                </select>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-xs">
                                <Link
                                    href="/communication/templates"
                                    className="button"
                                >
                                    szablony
                                </Link>
                                <Link
                                    href="/communication/reminders"
                                    className="button ml-xs"
                                >
                                    przypomnienia
                                </Link>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="products-empty">
                            Ładowanie wiadomości...
                        </div>
                    ) : data ? (
                        <>
                            <div className="inner">
                                <div className="column_row data_table">
                                    <table className="table table-bordered">
                                        <thead>
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
                                                      (entry, i) => (
                                                          <tr
                                                              key={`sms-${entry.id}`}
                                                              className={
                                                                  i % 2 === 0
                                                                      ? 'odd row'
                                                                      : 'even row'
                                                              }
                                                          >
                                                              <td className="wrap">
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
                                                              <td className="wrap">
                                                                  <Link
                                                                      href={getCommunicationHref(
                                                                          entry.id,
                                                                          'sms',
                                                                      )}
                                                                  >
                                                                      {entry.subject ||
                                                                          'Wiadomość'}
                                                                  </Link>
                                                                  <div className="excerpt">
                                                                      {entry.content.slice(
                                                                          0,
                                                                          120,
                                                                      )}
                                                                      {entry
                                                                          .content
                                                                          .length >
                                                                      120
                                                                          ? '...'
                                                                          : ''}
                                                                  </div>
                                                              </td>
                                                              <td className="wrap">
                                                                  <span className="v2-label v2-label-info">
                                                                      {entry.channel ||
                                                                          'sms standard'}
                                                                  </span>
                                                              </td>
                                                              <td className="wrap">
                                                                  {formatDateTime(
                                                                      entry.sentAt ||
                                                                          entry.createdAt,
                                                                  )}
                                                              </td>
                                                          </tr>
                                                      ),
                                                  )
                                                : emailHistory.data.items.map(
                                                      (entry, i) => (
                                                          <tr
                                                              key={`email-${entry.id}`}
                                                              className={
                                                                  i % 2 === 0
                                                                      ? 'odd row'
                                                                      : 'even row'
                                                              }
                                                          >
                                                              <td className="wrap">
                                                                  <Link
                                                                      href={getCommunicationHref(
                                                                          entry.id,
                                                                          'email',
                                                                      )}
                                                                  >
                                                                      {entry.to}
                                                                  </Link>
                                                              </td>
                                                              <td className="wrap">
                                                                  <Link
                                                                      href={getCommunicationHref(
                                                                          entry.id,
                                                                          'email',
                                                                      )}
                                                                  >
                                                                      {entry.subject ||
                                                                          'Email'}
                                                                  </Link>
                                                                  <div className="excerpt">
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
                                                                      ).length >
                                                                      120
                                                                          ? '...'
                                                                          : ''}
                                                                  </div>
                                                              </td>
                                                              <td className="wrap">
                                                                  <span className="v2-label v2-label-info">
                                                                      email
                                                                  </span>
                                                              </td>
                                                              <td className="wrap">
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
                            </div>

                            <div className="pagination_container">
                                <div className="row">
                                    <div className="info col-xs-7">
                                        Pozycje od{' '}
                                        {Math.min(
                                            (page - 1) * data.limit + 1,
                                            data.total,
                                        )}{' '}
                                        do{' '}
                                        {Math.min(
                                            page * data.limit,
                                            data.total,
                                        )}{' '}
                                        z {data.total}
                                    </div>
                                    <div className="form_pagination col-xs-5">
                                        <button
                                            type="button"
                                            className="button button-link"
                                            aria-label="Poprzednia strona"
                                            disabled={page <= 1}
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.max(1, current - 1),
                                                )
                                            }
                                        >
                                            <span
                                                className="fc-icon fc-icon-left-single-arrow"
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <input
                                            type="text"
                                            className="pagination-page-input"
                                            aria-label="strona"
                                            value={page}
                                            readOnly
                                        />
                                        {' z '}
                                        <a className="pointer">
                                            {Math.ceil(
                                                data.total / data.limit,
                                            ) || 1}
                                        </a>
                                        <button
                                            type="button"
                                            className="button button-link button_next ml-s"
                                            aria-label="Następna strona"
                                            disabled={
                                                page * data.limit >= data.total
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (current) => current + 1,
                                                )
                                            }
                                        >
                                            <span
                                                className="fc-icon fc-icon-right-single-arrow"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="products-empty">Brak wiadomości</div>
                    )}
                </div>

                {isModalOpen && (
                    <div className="salonbw-modal-overlay">
                        <div className="salonbw-modal" role="dialog">
                            <div className="salonbw-modal__header">
                                <h3>Wyślij wiadomość ({kind})</h3>
                                <button
                                    type="button"
                                    className="salonbw-modal__close"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetCompose();
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="salonbw-modal__body">
                                <div className="salonbw-form-group">
                                    <label>
                                        Odbiorca{' '}
                                        {kind === 'sms'
                                            ? '(telefon)'
                                            : '(email)'}
                                    </label>
                                    <input
                                        value={recipient}
                                        onChange={(e) =>
                                            setRecipient(e.target.value)
                                        }
                                        placeholder={
                                            kind === 'sms'
                                                ? '+48...'
                                                : 'klient@example.com'
                                        }
                                    />
                                </div>

                                {kind === 'email' && (
                                    <div className="salonbw-form-group">
                                        <label>Temat</label>
                                        <input
                                            value={subject}
                                            onChange={(e) =>
                                                setSubject(e.target.value)
                                            }
                                            placeholder="Temat wiadomości"
                                        />
                                    </div>
                                )}

                                <div className="salonbw-form-group">
                                    <label htmlFor="comm-content">Treść</label>
                                    <textarea
                                        id="comm-content"
                                        rows={6}
                                        value={content}
                                        onChange={(e) =>
                                            setContent(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="salonbw-modal__footer">
                                <button
                                    type="button"
                                    className="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetCompose();
                                    }}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="button"
                                    className="button button-blue ml-s"
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
                        </div>
                    </div>
                )}
            </SalonShell>
        </RouteGuard>
    );
}
