import { FormEvent, useEffect, useMemo, useState } from 'react';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useMyPrimaryBranch } from '@/hooks/useBranches';

const EMPTY_SECONDARY_NAV = <></>;
const SALONBW_CLIENT_NUMBER = '19581';
const SALONBW_KNOWLEDGE_BASE_URL = 'http://pomoc.versum.pl';
const SUPPORT_PHONE = '(33) 482 49 49';
const ANYDESK_MAC_URL = 'https://anydesk.com/pl/downloads/thank-you?dv=mac_dmg';
const ANYDESK_WINDOWS_URL =
    'https://anydesk.com/pl/downloads/thank-you?dv=win_exe';

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

    useSetSecondaryNav(EMPTY_SECONDARY_NAV);

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
            const recipient =
                process.env.NEXT_PUBLIC_CONTACT_RECIPIENT ||
                'kontakt@salon-bw.pl';
            const branchName = primaryBranch?.name || 'Salon Black & White';
            const attachmentValue = attachmentName || 'brak';

            await apiFetch<{ status: string }>('/emails/send-auth', {
                method: 'POST',
                body: JSON.stringify({
                    to: recipient,
                    subject: `Panel pomoc: ${branchName} (${SALONBW_CLIENT_NUMBER})`,
                    template:
                        '<p><strong>Numer klienta:</strong> {{clientNumber}}</p>' +
                        '<p><strong>Salon:</strong> {{branchName}}</p>' +
                        '<p><strong>Użytkownik:</strong> {{userName}}</p>' +
                        '<p><strong>Email do odpowiedzi:</strong> {{replyEmail}}</p>' +
                        '<p><strong>Przeglądarka:</strong> {{browser}}</p>' +
                        '<p><strong>System operacyjny:</strong> {{operatingSystem}}</p>' +
                        '<p><strong>Załącznik:</strong> {{attachmentName}}</p>' +
                        '<p><strong>Pytanie:</strong></p>' +
                        '<p>{{query}}</p>',
                    data: {
                        clientNumber: SALONBW_CLIENT_NUMBER,
                        branchName,
                        userName: user?.name || 'Nieznany użytkownik',
                        replyEmail: trimmedEmail,
                        browser: environment.browser,
                        operatingSystem: environment.operatingSystem,
                        attachmentName: attachmentValue,
                        query: trimmedQuery,
                    },
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
            <VersumBreadcrumbs
                iconClass="sprite-breadcrumbs_help"
                items={[
                    { label: 'Pomoc', href: '/helps/new' },
                    {
                        label: `Twój numer klienta: ${SALONBW_CLIENT_NUMBER}`,
                    },
                ]}
            />

            <div className="helps-page__inner">
                <h2>Baza wiedzy</h2>
                <p>
                    Aby ułatwić korzystanie z systemu SalonBW przygotowaliśmy{' '}
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href={SALONBW_KNOWLEDGE_BASE_URL}
                    >
                        Bazę Wiedzy
                    </a>
                    , która zawiera szczegółową dokumentację,
                    <br />
                    odpowiedzi na pytania oraz poradniki dotyczące wdrożenia
                    systemu.
                    <br />
                    Wygodna wyszukiwarka umożliwia szybkie odnalezienie
                    odpowiedzi na Twoje pytanie.
                </p>
                <p>
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href={SALONBW_KNOWLEDGE_BASE_URL}
                        className="button button-blue"
                    >
                        Przejdź do Bazy Wiedzy »
                    </a>
                </p>
                <h2>Formularz kontaktowy</h2>
                <p>
                    Jeśli w{' '}
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href={SALONBW_KNOWLEDGE_BASE_URL}
                    >
                        Bazie Wiedzy
                    </a>{' '}
                    nie ma odpowiedzi na Twoje pytanie, skontaktuj się z naszym
                    działem obsługi klienta.
                    <br />
                    Dane identyfikacyjne Twojego konta zostaną dołączone
                    automatycznie.
                </p>
                <form
                    className="simple_form new_physical_help helps-page__form"
                    id="new_physical_help"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <ol>
                        <li className="control-group text required physical_help_query">
                            <label
                                className="text required control-label"
                                htmlFor="physical_help_query"
                            >
                                Pytanie
                            </label>
                            <div className="controls">
                                <textarea
                                    id="physical_help_query"
                                    className="text required helps-page__textarea"
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
                                className="email required control-label"
                                htmlFor="physical_help_email"
                            >
                                Adres email
                            </label>
                            <div className="controls">
                                <input
                                    id="physical_help_email"
                                    className="string email required helps-page__email"
                                    type="email"
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
                                <p className="inline-hint">
                                    Adres email, na który należy przesłać
                                    odpowiedź
                                </p>
                                {emailError ? (
                                    <p className="helps-page__feedback helps-page__feedback--error">
                                        {emailError}
                                    </p>
                                ) : null}
                            </div>
                        </li>
                        <li className="control-group file optional physical_help_attachment">
                            <label
                                className="file optional control-label"
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
                        <p className="helps-page__feedback helps-page__feedback--error">
                            {submitError}
                        </p>
                    ) : null}
                    {submitted ? (
                        <p className="helps-page__feedback helps-page__feedback--success">
                            Pytanie zostało wysłane.
                        </p>
                    ) : null}
                </form>
                <h2>Kontakt telefoniczny</h2>
                Możesz uzyskać pomoc dzwoniąc pod numer telefonu{' '}
                <strong>{SUPPORT_PHONE}</strong>
                <br />
                Godziny pracy działu obsługi klienta: pon. - pt. 9:00 - 17:00
                <br />
                <div className="bold_spans helps-page__diagnostics">
                    Twój numer klienta: <span>{SALONBW_CLIENT_NUMBER}</span>
                    <br />
                    Przeglądarka: <span>{environment.browser}</span>
                    <br />
                    System operacyjny:{' '}
                    <span>{environment.operatingSystem}</span>
                    <br />
                    <br />
                    Program do zdalnego połączenia:
                    <b>
                        {' '}
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={ANYDESK_MAC_URL}
                        >
                            Wersja dla systemu Mac OS
                        </a>
                    </b>
                    &nbsp; &nbsp;
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href={ANYDESK_WINDOWS_URL}
                    >
                        Wersja dla systemu Windows
                    </a>
                </div>
            </div>
        </div>
    );
}
