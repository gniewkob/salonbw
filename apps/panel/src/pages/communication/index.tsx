import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
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
            <SalonBWShell role={role}>
                <div data-testid="communication-page">
                    <ul className="breadcrumb">
                        <li>Łączność / Nieprzeczytane wiadomości</li>
                    </ul>

                    <div className="row mb-l">
                        <div className="col-sm-5 input-with-select-sm mb-s mb-md-0">
                            <select
                                value={kind}
                                aria-label="Rodzaj wiadomości"
                                onChange={(event) => {
                                    setKind(
                                        event.target.value as 'sms' | 'email',
                                    );
                                    setStatus('');
                                    setPage(1);
                                }}
                            >
                                <option value="sms">SMS</option>
                                <option value="email">Email</option>
                            </select>
                            <select
                                value={status}
                                aria-label="Status wiadomości"
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">wszystkie statusy</option>
                                {kind === 'sms' ? (
                                    <>
                                        <option value="sent">wysłane</option>
                                        <option value="delivered">
                                            dostarczone
                                        </option>
                                        <option value="failed">nieudane</option>
                                        <option value="rejected">
                                            odrzucone
                                        </option>
                                        <option value="pending">
                                            oczekujące
                                        </option>
                                    </>
                                ) : (
                                    <>
                                        <option value="pending">
                                            oczekujące
                                        </option>
                                        <option value="sent">wysłane</option>
                                        <option value="failed">nieudane</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="col-sm-7">
                            <div className="d-flex flex-wrap jc-end">
                                <Link
                                    href="/communication/templates"
                                    className="button ml-xs"
                                >
                                    szablony
                                </Link>
                                <Link
                                    href="/communication/reminders"
                                    className="button ml-xs"
                                >
                                    przypomnienia
                                </Link>
                                <button
                                    type="button"
                                    className="button ml-xs"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    wyślij wiadomość
                                </button>
                                <Link
                                    href="/communication/mass"
                                    className="button button-blue ml-xs"
                                >
                                    wyślij masową
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
                            <div className="column_row data_table">
                                <table className="table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Odbiorca</th>
                                            <th>Wiadomość</th>
                                            <th>Rodzaj</th>
                                            <th>Wysłano</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kind === 'sms'
                                            ? smsHistory.data.items.map(
                                                  (entry, i) => (
                                                      <tr
                                                          key={`sms-${entry.id}`}
                                                          className={
                                                              i % 2 === 0
                                                                  ? 'odd'
                                                                  : 'even'
                                                          }
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
                                                              <strong>
                                                                  <Link
                                                                      href={getCommunicationHref(
                                                                          entry.id,
                                                                          'sms',
                                                                      )}
                                                                  >
                                                                      {entry.subject ||
                                                                          'Wiadomość'}
                                                                  </Link>
                                                              </strong>
                                                              <div className="light_text">
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
                                                              {entry.channel}
                                                          </td>
                                                          <td>
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
                                                                  ? 'odd'
                                                                  : 'even'
                                                          }
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
                                                              <strong>
                                                                  <Link
                                                                      href={getCommunicationHref(
                                                                          entry.id,
                                                                          'email',
                                                                      )}
                                                                  >
                                                                      {entry.subject ||
                                                                          'Email'}
                                                                  </Link>
                                                              </strong>
                                                              <div className="light_text">
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
                                                          <td>email</td>
                                                          <td>
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

                            <div className="pagination_container">
                                <div className="column_row">
                                    <div className="row">
                                        <div className="info col-xs-7">
                                            Pozycje{' '}
                                            {Math.min(
                                                (page - 1) * data.limit + 1,
                                                data.total,
                                            )}{' '}
                                            -{' '}
                                            {Math.min(
                                                page * data.limit,
                                                data.total,
                                            )}{' '}
                                            z {data.total}
                                        </div>
                                        <div className="form_pagination col-xs-5 text-right">
                                            <button
                                                type="button"
                                                className="button ml-s"
                                                disabled={page <= 1}
                                                onClick={() =>
                                                    setPage((current) =>
                                                        Math.max(
                                                            1,
                                                            current - 1,
                                                        ),
                                                    )
                                                }
                                            >
                                                poprzednia
                                            </button>
                                            <button
                                                type="button"
                                                className="button ml-s"
                                                disabled={
                                                    page * data.limit >=
                                                    data.total
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (current) =>
                                                            current + 1,
                                                    )
                                                }
                                            >
                                                następna
                                            </button>
                                        </div>
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
            </SalonBWShell>
        </RouteGuard>
    );
}
