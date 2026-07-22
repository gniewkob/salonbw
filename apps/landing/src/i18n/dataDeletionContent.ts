import type { Language } from './translations';
import type { LegalDoc } from './legalContent';

const CONTACT_EMAIL = 'kontakt@salon-bw.pl';
const EFFECTIVE_DATE = '2026-07-22';

export const DATA_DELETION: Record<Language, LegalDoc> = {
    pl: {
        metaTitle: 'Usuwanie danych | Salon Black & White',
        metaDescription:
            'Instrukcja żądania usunięcia danych z systemu Salon Black & White oraz danych związanych z integracją Meta i Instagram.',
        ogTitle: 'Usuwanie danych — Salon Black & White',
        ogDescription:
            'Dowiedz się, jak zażądać usunięcia danych z systemu Salon Black & White i danych związanych z integracją Meta i Instagram.',
        eyebrow: 'Ochrona danych',
        h1: 'Instrukcja usuwania danych',
        lead: 'Na tej stronie wyjaśniamy, jak zażądać usunięcia danych osobowych przetwarzanych przez Salon Black & White, w tym danych związanych z korzystaniem z naszych usług Meta i Instagram.',
        sections: [
            {
                heading: '1. Kogo dotyczy ta instrukcja?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Instrukcja dotyczy klientów i użytkowników serwisu Salon Black & White, systemu rezerwacji oraz osób, których dane mogły zostać przetworzone w związku z integracją salonu z usługami Meta lub Instagram.',
                    },
                    {
                        type: 'p',
                        text: 'Obecna integracja Instagram służy do wyświetlania mediów z firmowego konta salon_bw. Nie używamy logowania przez Instagram do zakładania kont klientów i nie pobieramy prywatnych wiadomości, kontaktów ani haseł użytkowników Instagrama.',
                    },
                ],
            },
            {
                heading: '2. Jak złożyć żądanie usunięcia danych?',
                blocks: [
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            {
                                text: `Wyślij wiadomość na adres ${CONTACT_EMAIL} z tematem „Usunięcie danych – Meta/Instagram” albo „Usunięcie konta SalonBW”.`,
                            },
                            {
                                text: 'Napisz, czy żądanie dotyczy konta klienta SalonBW, danych związanych z Meta/Instagram, czy obu tych zakresów.',
                            },
                            {
                                text: 'Podaj dane pozwalające odnaleźć konto: imię i nazwisko oraz adres e-mail lub numer telefonu użyty przy rejestracji. Jeżeli żądanie dotyczy integracji Meta/Instagram, możesz dodatkowo podać nazwę użytkownika Instagram.',
                            },
                            {
                                text: 'Wyślij wiadomość z adresu powiązanego z kontem, jeżeli jest to możliwe. Możemy poprosić o dodatkowe potwierdzenie tożsamości, ale nigdy o hasło, token dostępu ani dane logowania do Meta lub Instagram.',
                            },
                        ],
                    },
                    {
                        type: 'link',
                        href: `mailto:${CONTACT_EMAIL}`,
                        text: `Napisz do nas: ${CONTACT_EMAIL}`,
                    },
                ],
            },
            {
                heading: '3. Co usuniemy?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Po pozytywnej weryfikacji usuniemy lub zanonimizujemy dane, których nie musimy dalej przechowywać, odpowiednio do zakresu żądania.',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                text: 'profil i dane kontaktowe konta klienta SalonBW,',
                            },
                            {
                                text: 'zgody marketingowe i ustawienia komunikacji,',
                            },
                            {
                                text: 'dane techniczne lub identyfikatory integracji Meta/Instagram zapisane przez Salon Black & White, jeżeli takie dane istnieją,',
                            },
                            {
                                text: 'kopie danych pozyskanych z Meta/Instagram i przechowywanych w naszych systemach, jeżeli takie dane istnieją i nie zachodzi obowiązek ich dalszego przechowywania.',
                            },
                        ],
                    },
                ],
            },
            {
                heading: '4. Dane, których nie możemy usunąć od razu',
                blocks: [
                    {
                        type: 'p',
                        text: 'Prawo do usunięcia danych nie jest bezwzględne. Niektóre informacje mogą zostać ograniczone i zachowane przez okres wymagany przez prawo, w szczególności dla rozliczeń podatkowych, dokumentacji księgowej, obsługi roszczeń, przeciwdziałania nadużyciom lub wykazania zgodności działań z prawem.',
                    },
                    {
                        type: 'p',
                        text: 'Jeżeli część danych musi zostać zachowana, poinformujemy o zakresie, podstawie i przewidywanym okresie dalszego przechowywania. Dane te nie będą wykorzystywane do marketingu.',
                    },
                ],
            },
            {
                heading: '5. Termin i potwierdzenie realizacji',
                blocks: [
                    {
                        type: 'p',
                        text: 'Na żądanie odpowiemy bez zbędnej zwłoki, co do zasady nie później niż w ciągu jednego miesiąca od jego otrzymania i potwierdzenia tożsamości. Jeżeli sprawa jest złożona lub wpłynęło wiele żądań, termin może zostać przedłużony zgodnie z prawem; poinformujemy o tym wraz z przyczyną.',
                    },
                    {
                        type: 'p',
                        text: 'Po zakończeniu procesu wyślemy potwierdzenie realizacji. Jeżeli nie znajdziemy danych odpowiadających przekazanym informacjom albo nie będziemy mogli wykonać żądania w całości, również o tym poinformujemy.',
                    },
                ],
            },
            {
                heading: '6. Odłączenie aplikacji Meta lub Instagram',
                blocks: [
                    {
                        type: 'p',
                        text: 'Możesz niezależnie usunąć dostęp aplikacji w ustawieniach swojego konta Meta lub Instagram. Odłączenie aplikacji blokuje przyszły dostęp przy użyciu danego połączenia, ale nie musi automatycznie usuwać odrębnego konta klienta ani danych zapisanych wcześniej w systemie SalonBW. Aby usunąć te dane, złóż żądanie opisane w punkcie 2.',
                    },
                    {
                        type: 'p',
                        text: 'Treści i dane przechowywane wyłącznie przez Meta lub Instagram, w tym konto Instagram, należy usuwać lub zarządzać nimi bezpośrednio w ustawieniach odpowiedniej usługi. Salon Black & White nie może usunąć danych znajdujących się wyłącznie na serwerach Meta.',
                    },
                ],
            },
            {
                heading: '7. Bezpieczeństwo żądania',
                blocks: [
                    {
                        type: 'p',
                        text: 'Nie przesyłaj w żądaniu haseł, kodów jednorazowych, tokenów dostępu, danych kart płatniczych ani niezamówionych kopii dokumentów tożsamości. Poprosimy wyłącznie o informacje niezbędne do potwierdzenia tożsamości i odnalezienia danych.',
                    },
                ],
            },
            {
                heading: '8. Administrator i prawa użytkownika',
                blocks: [
                    {
                        type: 'p',
                        text: `Administratorem danych jest Salon Fryzjerski Black&White Aleksandra Bodora. W sprawach dotyczących danych osobowych skontaktuj się z nami pod adresem ${CONTACT_EMAIL}. Szczegółowe informacje o przetwarzaniu danych znajdują się w Polityce Prywatności. Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.`,
                    },
                    {
                        type: 'link',
                        href: '/privacy',
                        text: 'Przeczytaj Politykę Prywatności',
                    },
                ],
            },
        ],
        effectiveLabel: 'Ostatnia aktualizacja dokumentu:',
        effectiveDate: EFFECTIVE_DATE,
    },
    en: {
        metaTitle: 'Data Deletion | Salon Black & White',
        metaDescription:
            'Instructions for requesting deletion of data from Salon Black & White systems and data connected with Meta and Instagram integrations.',
        ogTitle: 'Data Deletion — Salon Black & White',
        ogDescription:
            'Learn how to request deletion of data from Salon Black & White systems and data connected with Meta and Instagram integrations.',
        eyebrow: 'Data protection',
        h1: 'Data deletion instructions',
        lead: 'This page explains how to request deletion of personal data processed by Salon Black & White, including data connected with our use of Meta and Instagram services.',
        reviewNotice:
            'English is a convenience translation. The legally binding version is the Polish text.',
        sections: [
            {
                heading: '1. Who are these instructions for?',
                blocks: [
                    {
                        type: 'p',
                        text: 'These instructions apply to clients and users of the Salon Black & White website and booking system, and to people whose data may have been processed in connection with the salon’s Meta or Instagram integration.',
                    },
                    {
                        type: 'p',
                        text: 'The current Instagram integration displays media from the salon_bw business account. We do not use Instagram Login to create client accounts and we do not retrieve private messages, contacts or Instagram passwords.',
                    },
                ],
            },
            {
                heading: '2. How do I submit a deletion request?',
                blocks: [
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            {
                                text: `Send an email to ${CONTACT_EMAIL} with the subject “Data deletion – Meta/Instagram” or “Delete SalonBW account”.`,
                            },
                            {
                                text: 'State whether your request concerns your SalonBW client account, Meta/Instagram-related data, or both.',
                            },
                            {
                                text: 'Provide the information needed to locate your account: your first and last name and the email address or telephone number used during registration. If your request concerns Meta/Instagram, you may also provide your Instagram username.',
                            },
                            {
                                text: 'If possible, send the request from the address linked to your account. We may ask for additional identity verification, but never for your password, access token or Meta or Instagram login details.',
                            },
                        ],
                    },
                    {
                        type: 'link',
                        href: `mailto:${CONTACT_EMAIL}`,
                        text: `Email us: ${CONTACT_EMAIL}`,
                    },
                ],
            },
            {
                heading: '3. What will we delete?',
                blocks: [
                    {
                        type: 'p',
                        text: 'After successful verification, we will delete or anonymise data that we are not required to retain, according to the scope of your request.',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            { text: 'your SalonBW client profile and contact data,' },
                            { text: 'marketing consents and communication settings,' },
                            {
                                text: 'technical data or Meta/Instagram integration identifiers stored by Salon Black & White, if any exist,',
                            },
                            {
                                text: 'copies of data obtained from Meta/Instagram and stored in our systems, if any exist and there is no obligation to retain them.',
                            },
                        ],
                    },
                ],
            },
            {
                heading: '4. Data we cannot delete immediately',
                blocks: [
                    {
                        type: 'p',
                        text: 'The right to erasure is not absolute. Some information may be restricted and retained for the period required by law, particularly for tax settlements, accounting records, handling legal claims, preventing abuse or demonstrating legal compliance.',
                    },
                    {
                        type: 'p',
                        text: 'If any data must be retained, we will explain its scope, the legal basis and the expected retention period. Such data will not be used for marketing.',
                    },
                ],
            },
            {
                heading: '5. Response time and confirmation',
                blocks: [
                    {
                        type: 'p',
                        text: 'We will respond without undue delay and, as a rule, no later than one month after receiving the request and confirming your identity. If the matter is complex or we have received many requests, the period may be extended as permitted by law; we will inform you and explain why.',
                    },
                    {
                        type: 'p',
                        text: 'We will send confirmation when the process is complete. We will also notify you if we cannot find data matching the information provided or cannot fulfil the request in full.',
                    },
                ],
            },
            {
                heading: '6. Disconnecting the Meta or Instagram app',
                blocks: [
                    {
                        type: 'p',
                        text: 'You can separately remove the app’s access in your Meta or Instagram account settings. Disconnecting the app prevents future access through that connection, but it may not automatically delete a separate client account or data previously stored in SalonBW systems. To delete that data, submit the request described in section 2.',
                    },
                    {
                        type: 'p',
                        text: 'Content and data stored exclusively by Meta or Instagram, including your Instagram account, must be deleted or managed directly in the relevant service settings. Salon Black & White cannot delete data held exclusively on Meta servers.',
                    },
                ],
            },
            {
                heading: '7. Request security',
                blocks: [
                    {
                        type: 'p',
                        text: 'Do not send passwords, one-time codes, access tokens, payment card data or unsolicited copies of identity documents. We will ask only for information necessary to confirm your identity and locate your data.',
                    },
                ],
            },
            {
                heading: '8. Controller and your rights',
                blocks: [
                    {
                        type: 'p',
                        text: `The data controller is Salon Fryzjerski Black&White Aleksandra Bodora. For personal data matters, contact us at ${CONTACT_EMAIL}. Detailed information about data processing is available in our Privacy Policy. You also have the right to lodge a complaint with the President of the Polish Personal Data Protection Office.`,
                    },
                    {
                        type: 'link',
                        href: '/privacy',
                        text: 'Read the Privacy Policy',
                    },
                ],
            },
        ],
        effectiveLabel: 'Document last updated:',
        effectiveDate: EFFECTIVE_DATE,
    },
    de: {
        metaTitle: 'Datenlöschung | Salon Black & White',
        metaDescription:
            'Anleitung zur Löschung von Daten aus den Systemen von Salon Black & White und von Daten im Zusammenhang mit Meta- und Instagram-Integrationen.',
        ogTitle: 'Datenlöschung — Salon Black & White',
        ogDescription:
            'Erfahren Sie, wie Sie die Löschung von Daten aus den Systemen von Salon Black & White und aus Meta- und Instagram-Integrationen beantragen.',
        eyebrow: 'Datenschutz',
        h1: 'Anleitung zur Datenlöschung',
        lead: 'Auf dieser Seite erklären wir, wie Sie die Löschung personenbezogener Daten beantragen können, die von Salon Black & White verarbeitet werden, einschließlich Daten im Zusammenhang mit unserer Nutzung von Meta- und Instagram-Diensten.',
        reviewNotice:
            'Die deutsche Fassung ist eine Übersetzung zur Erleichterung. Rechtlich verbindlich ist die polnische Fassung.',
        sections: [
            {
                heading: '1. Für wen gilt diese Anleitung?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Diese Anleitung gilt für Kundinnen und Kunden sowie Nutzer der Website und des Buchungssystems von Salon Black & White und für Personen, deren Daten im Zusammenhang mit der Meta- oder Instagram-Integration des Salons verarbeitet worden sein könnten.',
                    },
                    {
                        type: 'p',
                        text: 'Die aktuelle Instagram-Integration zeigt Medien des Geschäftskontos salon_bw an. Wir verwenden Instagram Login nicht zur Erstellung von Kundenkonten und rufen keine privaten Nachrichten, Kontakte oder Instagram-Passwörter ab.',
                    },
                ],
            },
            {
                heading: '2. Wie stelle ich einen Löschantrag?',
                blocks: [
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            {
                                text: `Senden Sie eine E-Mail an ${CONTACT_EMAIL} mit dem Betreff „Datenlöschung – Meta/Instagram” oder „SalonBW-Konto löschen”.`,
                            },
                            {
                                text: 'Geben Sie an, ob Ihr Antrag das SalonBW-Kundenkonto, Meta-/Instagram-bezogene Daten oder beide Bereiche betrifft.',
                            },
                            {
                                text: 'Geben Sie die zur Identifizierung des Kontos erforderlichen Daten an: Vor- und Nachname sowie die bei der Registrierung verwendete E-Mail-Adresse oder Telefonnummer. Betrifft der Antrag Meta/Instagram, können Sie zusätzlich Ihren Instagram-Benutzernamen angeben.',
                            },
                            {
                                text: 'Senden Sie die Anfrage möglichst von der mit Ihrem Konto verknüpften Adresse. Wir können eine zusätzliche Identitätsbestätigung verlangen, jedoch niemals Ihr Passwort, Zugriffstoken oder Ihre Meta- bzw. Instagram-Anmeldedaten.',
                            },
                        ],
                    },
                    {
                        type: 'link',
                        href: `mailto:${CONTACT_EMAIL}`,
                        text: `Schreiben Sie uns: ${CONTACT_EMAIL}`,
                    },
                ],
            },
            {
                heading: '3. Was löschen wir?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Nach erfolgreicher Überprüfung löschen oder anonymisieren wir entsprechend dem Umfang Ihres Antrags alle Daten, zu deren weiterer Speicherung wir nicht verpflichtet sind.',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            { text: 'Ihr SalonBW-Kundenprofil und Ihre Kontaktdaten,' },
                            { text: 'Marketingeinwilligungen und Kommunikationseinstellungen,' },
                            {
                                text: 'von Salon Black & White gespeicherte technische Daten oder Kennungen der Meta-/Instagram-Integration, sofern solche Daten vorhanden sind,',
                            },
                            {
                                text: 'Kopien von aus Meta/Instagram bezogenen und in unseren Systemen gespeicherten Daten, sofern solche Daten vorhanden sind und keine Pflicht zur Aufbewahrung besteht.',
                            },
                        ],
                    },
                ],
            },
            {
                heading: '4. Daten, die wir nicht sofort löschen können',
                blocks: [
                    {
                        type: 'p',
                        text: 'Das Recht auf Löschung gilt nicht uneingeschränkt. Bestimmte Informationen können für den gesetzlich vorgeschriebenen Zeitraum eingeschränkt und gespeichert werden, insbesondere für Steuerabrechnungen, Buchhaltungsunterlagen, die Bearbeitung von Rechtsansprüchen, die Verhinderung von Missbrauch oder den Nachweis der Rechtmäßigkeit unserer Tätigkeiten.',
                    },
                    {
                        type: 'p',
                        text: 'Müssen Daten aufbewahrt werden, informieren wir Sie über deren Umfang, Rechtsgrundlage und voraussichtliche Speicherdauer. Diese Daten werden nicht für Marketingzwecke verwendet.',
                    },
                ],
            },
            {
                heading: '5. Antwortfrist und Bestätigung',
                blocks: [
                    {
                        type: 'p',
                        text: 'Wir antworten unverzüglich und grundsätzlich spätestens innerhalb eines Monats nach Eingang des Antrags und Bestätigung Ihrer Identität. Ist die Angelegenheit komplex oder sind zahlreiche Anträge eingegangen, kann die Frist im gesetzlich zulässigen Umfang verlängert werden; wir informieren Sie darüber und nennen den Grund.',
                    },
                    {
                        type: 'p',
                        text: 'Nach Abschluss des Vorgangs senden wir eine Bestätigung. Wir informieren Sie auch, wenn wir keine zu den angegebenen Informationen passenden Daten finden oder den Antrag nicht vollständig erfüllen können.',
                    },
                ],
            },
            {
                heading: '6. Trennung der Meta- oder Instagram-App',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sie können den Zugriff der App separat in den Einstellungen Ihres Meta- oder Instagram-Kontos entfernen. Die Trennung verhindert den zukünftigen Zugriff über diese Verbindung, löscht jedoch nicht zwingend ein separates Kundenkonto oder zuvor in SalonBW-Systemen gespeicherte Daten. Um diese Daten zu löschen, stellen Sie den in Abschnitt 2 beschriebenen Antrag.',
                    },
                    {
                        type: 'p',
                        text: 'Inhalte und Daten, die ausschließlich von Meta oder Instagram gespeichert werden, einschließlich Ihres Instagram-Kontos, müssen direkt in den Einstellungen des jeweiligen Dienstes gelöscht oder verwaltet werden. Salon Black & White kann keine Daten löschen, die ausschließlich auf Meta-Servern gespeichert sind.',
                    },
                ],
            },
            {
                heading: '7. Sicherheit des Antrags',
                blocks: [
                    {
                        type: 'p',
                        text: 'Senden Sie keine Passwörter, Einmalcodes, Zugriffstoken, Zahlungskartendaten oder unaufgeforderte Kopien von Ausweisdokumenten. Wir fragen nur nach Informationen, die zur Bestätigung Ihrer Identität und zum Auffinden Ihrer Daten erforderlich sind.',
                    },
                ],
            },
            {
                heading: '8. Verantwortlicher und Ihre Rechte',
                blocks: [
                    {
                        type: 'p',
                        text: `Verantwortlicher ist Salon Fryzjerski Black&White Aleksandra Bodora. Bei Fragen zu personenbezogenen Daten kontaktieren Sie uns unter ${CONTACT_EMAIL}. Ausführliche Informationen zur Datenverarbeitung finden Sie in unserer Datenschutzerklärung. Sie haben außerdem das Recht, eine Beschwerde beim Präsidenten der polnischen Datenschutzbehörde einzureichen.`,
                    },
                    {
                        type: 'link',
                        href: '/privacy',
                        text: 'Datenschutzerklärung lesen',
                    },
                ],
            },
        ],
        effectiveLabel: 'Dokument zuletzt aktualisiert:',
        effectiveDate: EFFECTIVE_DATE,
    },
};
