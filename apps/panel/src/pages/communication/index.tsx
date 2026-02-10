import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useSmsHistory, useSmsMutations } from '@/hooks/useSms';
import { useEmailHistory, useEmailMutations } from '@/hooks/useEmails';

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
            <VersumShell role={role}>
                <div className="versum-page" data-testid="communication-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Łączność / Nieprzeczytane wiadomości
                        </h1>
                        <div className="flex gap-2">
                            <Link
                                href="/communication/templates"
                                className="versum-btn versum-btn--light"
                            >
                                Szablony
                            </Link>
                            <Link
                                href="/communication/reminders"
                                className="versum-btn versum-btn--light"
                            >
                                Przypomnienia
                            </Link>
                            <button
                                type="button"
                                className="versum-btn versum-btn--default"
                                onClick={() => setIsModalOpen(true)}
                            >
                                wyślij wiadomość pojedynczą
                            </button>
                            <Link
                                href="/communication/mass"
                                className="versum-btn versum-btn--primary"
                            >
                                wyślij wiadomość masową
                            </Link>
                        </div>
                    </header>

                    <div className="versum-page__toolbar">
                        <label className="versum-label">
                            Status:
                            <select
                                className="versum-select ml-2"
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">wszystkie</option>
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
                        </label>
                        <label className="versum-label">
                            Rodzaj:
                            <select
                                className="versum-select ml-2"
                                value={kind}
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
                        </label>
                    </div>

                    {loading ? (
                        <div className="versum-loading">
                            Ładowanie wiadomości...
                        </div>
                    ) : data ? (
                        <>
                            <div className="versum-table-wrap">
                                <table className="versum-table">
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
                                                  (entry) => (
                                                      <tr
                                                          key={`sms-${entry.id}`}
                                                      >
                                                          <td>
                                                              {entry.recipient}
                                                          </td>
                                                          <td>
                                                              <strong>
                                                                  {entry.subject ||
                                                                      'Wiadomość'}
                                                              </strong>
                                                              <div className="versum-muted text-xs mt-1">
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
                                                              <span className="versum-badge versum-badge--info">
                                                                  {
                                                                      entry.channel
                                                                  }
                                                              </span>
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
                                                  (entry) => (
                                                      <tr
                                                          key={`email-${entry.id}`}
                                                      >
                                                          <td>{entry.to}</td>
                                                          <td>
                                                              <strong>
                                                                  {entry.subject ||
                                                                      'Email'}
                                                              </strong>
                                                              <div className="versum-muted text-xs mt-1">
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
                                                              <span className="versum-badge versum-badge--info">
                                                                  email
                                                              </span>
                                                          </td>
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

                            <div className="versum-pagination">
                                <span className="versum-pagination__info">
                                    Pozycje{' '}
                                    {Math.min(
                                        (page - 1) * data.limit + 1,
                                        data.total,
                                    )}{' '}
                                    - {Math.min(page * data.limit, data.total)}{' '}
                                    z {data.total}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="versum-btn versum-btn--sm versum-btn--light"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(1, current - 1),
                                            )
                                        }
                                    >
                                        poprzednia
                                    </button>
                                    <button
                                        type="button"
                                        className="versum-btn versum-btn--sm versum-btn--light"
                                        disabled={
                                            page * data.limit >= data.total
                                        }
                                        onClick={() =>
                                            setPage((current) => current + 1)
                                        }
                                    >
                                        następna
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="versum-empty">Brak wiadomości</div>
                    )}
                </div>

                {isModalOpen && (
                    <div className="versum-modal-overlay">
                        <div className="versum-modal" role="dialog">
                            <div className="versum-modal__header">
                                <h3>Wyślij wiadomość ({kind})</h3>
                                <button
                                    type="button"
                                    className="versum-modal__close"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetCompose();
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="versum-modal__body">
                                <div className="versum-form-group">
                                    <label>
                                        Odbiorca{' '}
                                        {kind === 'sms'
                                            ? '(telefon)'
                                            : '(email)'}
                                    </label>
                                    <input
                                        className="versum-input"
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
                                    <div className="versum-form-group">
                                        <label>Temat</label>
                                        <input
                                            className="versum-input"
                                            value={subject}
                                            onChange={(e) =>
                                                setSubject(e.target.value)
                                            }
                                            placeholder="Temat wiadomości"
                                        />
                                    </div>
                                )}

                                <div className="versum-form-group">
                                    <label>Treść</label>
                                    <textarea
                                        className="versum-textarea"
                                        rows={6}
                                        value={content}
                                        onChange={(e) =>
                                            setContent(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="versum-modal__footer">
                                <button
                                    type="button"
                                    className="versum-btn versum-btn--light"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetCompose();
                                    }}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="button"
                                    className="versum-btn versum-btn--primary"
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
            </VersumShell>
        </RouteGuard>
    );
}
