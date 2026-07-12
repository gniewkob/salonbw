import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PanelButton from '@/components/ui/PanelButton';

export interface AppointmentMessage {
    id: number;
    appointmentId: number;
    authorId: number | null;
    authorRole: 'client' | 'employee' | 'receptionist' | 'admin';
    body: string;
    createdAt: string;
}

export interface MessageThreadHandle {
    /** Scrolls the compose textarea into view and focuses it. */
    focusCompose: () => void;
}

interface Props {
    appointmentId: number;
    /** Fires whenever the thread (re)loads, with the current message list. */
    onThreadLoaded?: (messages: AppointmentMessage[]) => void;
}

function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function MessageThread(
    { appointmentId, onThreadLoaded }: Props,
    ref: React.Ref<MessageThreadHandle>,
) {
    const { apiFetch, role } = useAuth();
    const toast = useToast();
    const [messages, setMessages] = useState<AppointmentMessage[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const textareaId = `msg-thread-body-${appointmentId}`;
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const focusPendingRef = useRef(false);
    // Gates the very first load of a thread out of auto-scroll.
    // Before Z7, MessageThread only mounted once a user explicitly expanded
    // it, so scrolling to the bottom on load was the point. Now it mounts
    // immediately inside VisitDetailsPanel, so a visit with existing
    // messages would otherwise yank the panel's scroll position to the
    // bottom of the thread the instant it opens, fighting the "focus on
    // the panel heading" behavior. Reset per-thread (not just once ever)
    // so switching to a different visit's thread skips its first load too.
    const initialLoadDoneRef = useRef(false);

    const loadMessages = useCallback(() => {
        setLoading(true);
        apiFetch<AppointmentMessage[]>(
            `/appointments/${appointmentId}/messages`,
        )
            .then((data) => {
                setMessages(data);
                onThreadLoaded?.(data);
            })
            .catch(() => toast.error('Nie udało się pobrać wiadomości.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFetch, appointmentId, toast]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        initialLoadDoneRef.current = false;
    }, [appointmentId]);

    useEffect(() => {
        if (!messages) return;
        // Consume the first-load skip on ANY load, including an empty one —
        // otherwise an initially-empty thread's post-send reload would be
        // the "first non-empty load" and swallow the scroll the user's own
        // send should produce.
        if (!initialLoadDoneRef.current) {
            initialLoadDoneRef.current = true;
            return;
        }
        if (messages.length === 0) return;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // The textarea is `disabled` while sending, so a synchronous
    // .focus() call right after the API resolves is a no-op (disabled
    // elements can't take focus). Defer it to the render where `sending`
    // has actually flipped back to false and the DOM is enabled again.
    useEffect(() => {
        if (!sending && focusPendingRef.current) {
            focusPendingRef.current = false;
            textareaRef.current?.focus();
        }
    }, [sending]);

    useImperativeHandle(ref, () => ({
        focusCompose: () => {
            textareaRef.current?.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
            });
            textareaRef.current?.focus();
        },
    }));

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
            // Sending is button-triggered — return focus to the textarea so
            // the client can keep typing without hunting for the field
            // again, on both success AND failure (a failed send leaves the
            // draft in place, ready to retry). Deferred to the post-send
            // effect: the textarea is still `disabled` here, and disabled
            // elements refuse focus().
            focusPendingRef.current = true;
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
                    ref={textareaRef}
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
                    <PanelButton
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={!body.trim() || sending}
                        aria-busy={sending}
                        onClick={() => void sendMessage()}
                    >
                        {sending ? 'Wysyłanie…' : 'Wyślij'}
                    </PanelButton>
                </div>
            </div>
        </div>
    );
}

export default forwardRef(MessageThread);
