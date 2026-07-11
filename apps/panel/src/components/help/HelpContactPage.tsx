import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useMyPrimaryBranch } from '@/hooks/useBranches';

const EMPTY_SECONDARY_NAV = <></>;
const DEFAULT_SUPPORT_EMAIL = 'kontakt@salon-bw.pl';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnvironmentInfo = {
    browser: string;
    operatingSystem: string;
};

function parseBrowser(userAgent: string): string {
    const browserMatchers: Array<
        [RegExp, (match: RegExpMatchArray) => string]
    > = [
        [/Chrome\/(\d+)/, (match) => `Chrome ${match[1]}`],
        [/Firefox\/(\d+)/, (match) => `Firefox ${match[1]}`],
        [/Version\/(\d+).+Safari/, (match) => `Safari ${match[1]}`],
        [/Edg\/(\d+)/, (match) => `Edge ${match[1]}`],
    ];

    for (const [pattern, formatter] of browserMatchers) {
        const match = userAgent.match(pattern);
        if (match) {
            return formatter(match);
        }
    }

    return 'Nieznana';
}

function parseOperatingSystem(userAgent: string): string {
    const macMatch = userAgent.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/);
    if (macMatch) {
        return `Mac OS ${[macMatch[1], macMatch[2], macMatch[3] ?? '0'].join('.')}`;
    }

    const windowsMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (windowsMatch) {
        const versionMap: Record<string, string> = {
            '10.0': 'Windows 10/11',
            '6.3': 'Windows 8.1',
            '6.2': 'Windows 8',
            '6.1': 'Windows 7',
        };
        return versionMap[windowsMatch[1]] ?? `Windows ${windowsMatch[1]}`;
    }

    const iosMatch = userAgent.match(
        /OS (\d+)[_.](\d+)(?:[_.](\d+))? like Mac OS X/,
    );
    if (iosMatch) {
        return `iOS ${[iosMatch[1], iosMatch[2], iosMatch[3] ?? '0'].join('.')}`;
    }

    const androidMatch = userAgent.match(/Android (\d+(?:\.\d+)?)/);
    if (androidMatch) {
        return `Android ${androidMatch[1]}`;
    }

    if (userAgent.includes('Linux')) {
        return 'Linux';
    }

    return 'Nieznany';
}

export default function HelpContactPage() {
    const { user, apiFetch } = useAuth();
    const toast = useToast();
    const { data: primaryBranch } = useMyPrimaryBranch();
    const [query, setQuery] = useState('');
    const [email, setEmail] = useState(user?.email ?? '');
    const [attachmentName, setAttachmentName] = useState('');
    const [environment, setEnvironment] = useState<EnvironmentInfo>({
        browser: 'Nieznana',
        operatingSystem: 'Nieznany',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const submittedRef = useRef<HTMLParagraphElement>(null);
    const submitErrorRef = useRef<HTMLParagraphElement>(null);

    useSetSecondaryNav(EMPTY_SECONDARY_NAV);

    // A dynamically-mounted role="status"/role="alert" node isn't reliably
    // announced by screen readers (the live region needs to exist before
    // its content changes), and a submit error rendered below a long form
    // can land outside the viewport — move focus to it explicitly, which
    // both announces it and scrolls it into view (Z9).
    useEffect(() => {
        if (submitted) {
            submittedRef.current?.focus();
        }
    }, [submitted]);

    useEffect(() => {
        if (submitError) {
            submitErrorRef.current?.focus();
        }
    }, [submitError]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const body = document.body;
        const previousId = body.id;
        body.classList.add('no_sidenav');
        body.id = 'physical_helps';

        return () => {
            body.classList.remove('no_sidenav');
            body.id = previousId;
        };
    }, []);

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user?.email]);

    useEffect(() => {
        if (typeof navigator === 'undefined') return;
        const userAgent = navigator.userAgent;
        setEnvironment({
            browser: parseBrowser(userAgent),
            operatingSystem: parseOperatingSystem(userAgent),
        });
    }, []);

    const trimmedQuery = useMemo(() => query.trim(), [query]);
    const trimmedEmail = useMemo(() => email.trim(), [email]);
    const branchName = primaryBranch?.name || 'Salon Black & White';
    const branchContact =
        primaryBranch?.phone || primaryBranch?.email || DEFAULT_SUPPORT_EMAIL;
    const accountLabel = user?.id ? `Konto #${user.id}` : 'Zalogowane konto';

    const isValid =
        trimmedQuery.length > 0 &&
        emailPattern.test(trimmedEmail) &&
        !isSubmitting;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(false);
        setSubmitError('');

        if (!trimmedQuery) {
            setSubmitError('Treść pytania jest wymagana.');
            return;
        }

        if (!emailPattern.test(trimmedEmail)) {
            setEmailError('Nieprawidłowy format adresu email');
            return;
        }

        setEmailError('');
        setIsSubmitting(true);

        try {
            const attachmentValue = attachmentName || 'brak';

            // /emails/contact ma odbiorcę skonfigurowanego po stronie serwera
            // (CONTACT_RECIPIENT) — dostępny dla każdej roli, bez otwartego relay.
            await apiFetch<{ status: string }>('/emails/contact', {
                method: 'POST',
                body: JSON.stringify({
                    name: `${user?.name || 'Użytkownik panelu'} (panel pomoc)`,
                    replyTo: trimmedEmail,
                    message: [
                        `Pytanie z panelu pomocy`,
                        `Konto: ${accountLabel}`,
                        `Salon: ${branchName}`,
                        `Przeglądarka: ${environment.browser}`,
                        `System operacyjny: ${environment.operatingSystem}`,
                        `Załącznik (tylko nazwa): ${attachmentValue}`,
                        '',
                        trimmedQuery,
                    ].join('\n'),
                }),
            });

            setSubmitted(true);
            setQuery('');
            setAttachmentName('');
            toast.success('Pytanie zostało wysłane');
            if (attachmentName) {
                toast.error(
                    'Załącznik nie został wysłany binarnie. Zapisano tylko nazwę pliku.',
                );
            }
        } catch {
            setSubmitError('Nie udało się wysłać pytania.');
            toast.error('Nie udało się wysłać pytania');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="helps-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_help"
                items={[
                    { label: 'Pomoc', href: '/helps/new' },
                    {
                        label: accountLabel,
                    },
                ]}
            />

            <div className="helps-page__inner">
                <h2>Centrum pomocy Salon Black &amp; White</h2>
                <p>
                    Opisz problem w formularzu poniżej. Do zgłoszenia dołączymy
                    dane konta, salonu, przeglądarki i systemu, żeby obsługa
                    mogła szybciej odtworzyć sytuację.
                </p>
                <h2>Formularz kontaktowy</h2>
                <p>
                    Dane identyfikacyjne Twojego konta zostaną dołączone
                    automatycznie. Wpisz adres email, na który mamy wysłać
                    odpowiedź.
                </p>
                <form
                    className="simple_form new_physical_help helps-page__form"
                    id="new_physical_help"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <ol>
                        <li className="control-group text required physical_help_query">
                            <label
                                className="text required form-label"
                                htmlFor="physical_help_query"
                            >
                                Pytanie
                            </label>
                            <div className="controls">
                                <textarea
                                    id="physical_help_query"
                                    className="text required helps-page__textarea"
                                    maxLength={1500}
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setSubmitted(false);
                                        setSubmitError('');
                                    }}
                                />
                            </div>
                        </li>
                        <li className="control-group email required physical_help_email">
                            <label
                                className="email required form-label"
                                htmlFor="physical_help_email"
                            >
                                Adres email
                            </label>
                            <div className="controls">
                                <input
                                    id="physical_help_email"
                                    className="string email required helps-page__email"
                                    type="email"
                                    autoComplete="email"
                                    aria-describedby="physical_help_email_hint"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setSubmitted(false);
                                        const nextValue =
                                            event.target.value.trim();
                                        setEmailError(
                                            !nextValue ||
                                                emailPattern.test(nextValue)
                                                ? ''
                                                : 'Nieprawidłowy format adresu email',
                                        );
                                    }}
                                />
                                <p
                                    id="physical_help_email_hint"
                                    className="inline-hint"
                                >
                                    Adres email, na który należy przesłać
                                    odpowiedź
                                </p>
                                {emailError ? (
                                    <p
                                        role="alert"
                                        className="helps-page__feedback helps-page__feedback--error"
                                    >
                                        {emailError}
                                    </p>
                                ) : null}
                            </div>
                        </li>
                        <li className="control-group file optional physical_help_attachment">
                            <label
                                className="file optional form-label"
                                htmlFor="physical_help_attachment"
                            >
                                Załącznik
                            </label>
                            <div className="controls">
                                <input
                                    id="physical_help_attachment"
                                    className="file optional"
                                    type="file"
                                    onChange={(event) => {
                                        const file =
                                            event.target.files?.[0] ?? null;
                                        setAttachmentName(file?.name ?? '');
                                    }}
                                />
                                {attachmentName ? (
                                    <p className="helps-page__attachment-name">
                                        Wybrano: {attachmentName}
                                    </p>
                                ) : null}
                            </div>
                        </li>
                    </ol>

                    <div className="form-actions-prev"></div>
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isValid}
                        >
                            {isSubmitting
                                ? 'Przetwarzanie danych...'
                                : 'wyślij pytanie'}
                        </button>
                    </div>
                    {submitError ? (
                        <p
                            ref={submitErrorRef}
                            role="alert"
                            tabIndex={-1}
                            className="helps-page__feedback helps-page__feedback--error"
                        >
                            {submitError}
                        </p>
                    ) : null}
                    {submitted ? (
                        <p
                            ref={submittedRef}
                            role="status"
                            tabIndex={-1}
                            className="helps-page__feedback helps-page__feedback--success"
                        >
                            Pytanie zostało wysłane.
                        </p>
                    ) : null}
                </form>
                <h2>Kontakt</h2>
                <p>
                    W pilnych sprawach skontaktuj się z salonem:{' '}
                    <strong>{branchContact}</strong>
                </p>
                <div className="bold_spans helps-page__diagnostics">
                    Konto: <span>{accountLabel}</span>
                    <br />
                    Salon: <span>{branchName}</span>
                    <br />
                    Przeglądarka: <span>{environment.browser}</span>
                    <br />
                    System operacyjny:{' '}
                    <span>{environment.operatingSystem}</span>
                </div>
            </div>
        </div>
    );
}
