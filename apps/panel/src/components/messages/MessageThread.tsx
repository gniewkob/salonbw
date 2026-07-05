import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface AppointmentMessage {
    id: number;
    appointmentId: number;
    authorId: number | null;
    authorRole: 'client' | 'employee' | 'receptionist' | 'admin';
    body: string;
    createdAt: string;
}

interface Props {
    appointmentId: number;
}

function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function MessageThread({ appointmentId }: Props) {
    const { apiFetch, role } = useAuth();
    const toast = useToast();
    const [messages, setMessages] = useState<AppointmentMessage[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const textareaId = `msg-thread-body-${appointmentId}`;
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(() => {
        setLoading(true);
        apiFetch<AppointmentMessage[]>(
            `/appointments/${appointmentId}/messages`,
        )
            .then((data) => setMessages(data))
            .catch(() => toast.error('Nie udało się pobrać wiadomości.'))
            .finally(() => setLoading(false));
    }, [apiFetch, appointmentId, toast]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        if (messages && messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = async () => {
        const trimmed = body.trim();
        if (!trimmed) return;
        setSending(true);
        try {
            await apiFetch(`/appointments/${appointmentId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: trimmed }),
            });
            setBody('');
            loadMessages();
        } catch {
            toast.error('Nie udało się wysłać wiadomości. Spróbuj ponownie.');
        } finally {
            setSending(false);
        }
    };

    const isOwnMessage = (msg: AppointmentMessage): boolean => {
        if (!role) return false;
        // Client sees their own messages as "Ty"; all staff roles are "Salon"
        if (role === 'client') return msg.authorRole === 'client';
        // Staff: own messages are anything that is not client
        return msg.authorRole !== 'client';
    };

    const senderLabel = (msg: AppointmentMessage): string => {
        if (role === 'client') {
            return msg.authorRole === 'client' ? 'Ty' : 'Salon';
        }
        // Staff view
        return msg.authorRole === 'client' ? 'Klient' : 'Salon';
    };

    return (
        <div className="message-thread">
            {loading && messages === null && (
                <div className="message-thread__loading text-muted small py-2">
                    Ładowanie wiadomości…
                </div>
            )}

            {!loading && messages !== null && messages.length === 0 && (
                <div className="message-thread__empty text-muted small py-2">
                    Brak wiadomości. Napisz pierwszą.
                </div>
            )}

            {messages !== null && messages.length > 0 && (
                <div
                    className="message-thread__list"
                    role="log"
                    aria-live="polite"
                    aria-label="Wiadomości"
                >
                    {messages.map((msg) => {
                        const own = isOwnMessage(msg);
                        return (
                            <div
                                key={msg.id}
                                className={`message-thread__row ${own ? 'message-thread__row--own' : 'message-thread__row--other'}`}
                            >
                                <div className="message-thread__bubble-wrap">
                                    <span className="message-thread__sender small text-muted">
                                        {senderLabel(msg)}
                                    </span>
                                    <div
                                        className={`message-thread__bubble ${own ? 'message-thread__bubble--own' : 'message-thread__bubble--other'}`}
                                    >
                                        {msg.body}
                                    </div>
                                    <time
                                        dateTime={msg.createdAt}
                                        className="message-thread__time small text-muted"
                                    >
                                        {formatTime(msg.createdAt)}
                                    </time>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} aria-hidden="true" />
                </div>
            )}

            <div className="message-thread__compose mt-2">
                <label htmlFor={textareaId} className="visually-hidden">
                    Treść wiadomości
                </label>
                <textarea
                    id={textareaId}
                    className="form-control form-control-sm"
                    rows={2}
                    maxLength={2000}
                    placeholder="Napisz wiadomość…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            void sendMessage();
                        }
                    }}
                    disabled={sending}
                />
                <div className="d-flex justify-content-end mt-1">
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={!body.trim() || sending}
                        aria-busy={sending}
                        onClick={() => void sendMessage()}
                    >
                        {sending ? 'Wysyłanie…' : 'Wyślij'}
                    </button>
                </div>
            </div>
        </div>
    );
}
