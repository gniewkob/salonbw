import type { Language } from './translations';
import type { LegalDoc } from './legalContent';

const CONTACT_EMAIL = 'kontakt@salon-bw.pl';
const EFFECTIVE_DATE = '2026-07-22';

export const DATA_DELETION: Record<Language, LegalDoc> = {
    pl: {
        metaTitle: 'Usuwanie danych | Salon Black & White',
        metaDescription:
            'Instrukcja usunięcia konta i danych z systemu Salon Black & White, danych logowania przez Google lub Facebooka oraz danych związanych z integracją Meta i Instagram.',
        ogTitle: 'Usuwanie danych — Salon Black & White',
        ogDescription:
            'Dowiedz się, jak usunąć konto SalonBW i powiązane dane, w tym dane z logowania przez Google lub Facebooka oraz z integracji Meta i Instagram.',
        eyebrow: 'Ochrona danych',
        h1: 'Instrukcja usuwania danych',
        lead: 'Na tej stronie wyjaśniamy, jak usunąć konto klienta Salon Black & White oraz zażądać usunięcia danych osobowych, które przetwarzamy — niezależnie od sposobu założenia konta, w tym danych pobranych przy logowaniu przez Google, Facebooka lub innego dostawcę oraz danych związanych z korzystaniem z usług Meta i Instagram.',
        sections: [
            {
                heading: '1. Kogo dotyczy ta instrukcja?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Instrukcja dotyczy klientów i użytkowników serwisu Salon Black & White oraz systemu rezerwacji, niezależnie od tego, w jaki sposób powstało konto — przez formularz rejestracji z adresem e-mail i hasłem, czy przez logowanie zewnętrzne (Google, Facebook lub inny dostępny dostawca). Dane osobowe klientów przetwarzamy wyłącznie w naszym panelu (systemie CRM), a przy logowaniu zewnętrznym dodatkowo w zakresie podstawowego profilu pobranego od dostawcy logowania.',
                    },
                    {
                        type: 'p',
                        text: 'Obowiązek udostępnienia tej instrukcji wynika z korzystania przez nas z usług platformy Meta — aplikacji Instagram obsługującej galerię na stronie oraz, o ile jest udostępnione, logowania przez Facebooka. Sama integracja z Instagramem służy wyłącznie do prezentacji treści z naszego firmowego konta salon_bw i nie przetwarza danych osobowych klientów; jej odrębne zasady opisujemy w punkcie 7.',
                    },
                ],
            },
            {
                heading: '2. Jakie dane przechowuje SalonBW?',
                blocks: [
                    {
                        type: 'p',
                        text: 'W ramach konta klienta i historii korzystania z usług w panelu SalonBW możemy przechowywać następujące kategorie danych:',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                lead: 'Dane konta i profilu:',
                                text: 'imię, nazwisko, nazwa wyświetlana, adres e-mail, rola konta oraz hasło przechowywane wyłącznie w postaci zahaszowanej.',
                            },
                            {
                                lead: 'Dane kontaktowe i adresowe:',
                                text: 'numer telefonu, adres, miasto i kod pocztowy.',
                            },
                            {
                                lead: 'Dodatkowe dane profilu:',
                                text: 'data urodzenia, płeć, opis lub notatka, zdjęcie profilowe (awatar).',
                            },
                            {
                                lead: 'Zgody i preferencje komunikacji:',
                                text: 'zgody RODO i na regulamin (wraz z datami), zgody marketingowe (SMS, WhatsApp, e-mail), ustawienia powiadomień w panelu oraz zapis zmian zgód (rejestr audytowy).',
                            },
                            {
                                lead: 'Historia wizyt i rezerwacji:',
                                text: 'terminy, wybrane usługi, przypisany pracownik, statusy, kwoty, metody płatności, rabaty i napiwki.',
                            },
                            {
                                lead: 'Notatki, zalecenia i receptury:',
                                text: 'notatki do wizyt, zalecenia pozabiegowe oraz formuły i receptury (np. koloryzacji) zapisane w profilu.',
                            },
                            {
                                lead: 'Wiadomości i opinie:',
                                text: 'wątki wiadomości między klientem a salonem oraz oceny i komentarze do wizyt.',
                            },
                            {
                                lead: 'Program lojalnościowy:',
                                text: 'punkty, historia naliczeń oraz powiązane karty podarunkowe.',
                            },
                            {
                                lead: 'Załączniki:',
                                text: 'zdjęcia w galerii klienta i pliki dołączone do profilu.',
                            },
                            {
                                lead: 'Dane rozliczeniowe:',
                                text: 'faktury, paragony oraz dokumentacja sprzedaży produktów.',
                            },
                            {
                                lead: 'Dane techniczne i bezpieczeństwa:',
                                text: 'tokeny sesji i odświeżania, zapisy prób logowania, logi zdarzeń oraz identyfikatory subskrypcji powiadomień push.',
                            },
                            {
                                lead: 'Historia komunikacji:',
                                text: 'logi wysłanych wiadomości SMS i e-mail oraz zapisy odbiorców newslettera.',
                            },
                            {
                                lead: 'Identyfikatory logowania zewnętrznego:',
                                text: 'identyfikator konta u dostawcy (np. Google lub Facebook), jeżeli logowanie zewnętrzne zostało powiązane z kontem — szczegóły w punkcie 3.',
                            },
                        ],
                    },
                ],
            },
            {
                heading: '3. Dane pobierane przy logowaniu przez Google, Facebooka lub innego dostawcę',
                blocks: [
                    {
                        type: 'p',
                        text: 'Jeżeli logujesz się przez Google, Facebooka lub innego dostępnego dostawcę, przy pierwszym logowaniu kopiujemy z Twojego podstawowego profilu wyłącznie: adres e-mail, imię, nazwisko oraz zdjęcie profilowe. Zapisujemy też identyfikator Twojego konta u dostawcy (np. identyfikator Google lub Facebook), aby rozpoznać Cię przy kolejnych logowaniach.',
                    },
                    {
                        type: 'p',
                        text: 'Logowanie zewnętrzne korzysta jedynie z podstawowego zakresu profilu (np. Google: „email” i „profile”; Facebook: „email” i „public_profile”). Nie pobieramy i nie przechowujemy tokenów dostępu dostawcy, list znajomych, wiadomości prywatnych ani haseł.',
                    },
                    {
                        type: 'p',
                        text: 'Skopiowane dane stają się częścią Twojego konta klienta SalonBW i podlegają usunięciu na tych samych zasadach co pozostałe dane profilu (patrz punkty 4 i 5).',
                    },
                ],
            },
            {
                heading: '4. Jak złożyć żądanie usunięcia konta lub danych?',
                blocks: [
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            {
                                text: `Wyślij wiadomość na adres ${CONTACT_EMAIL} z tematem „Usunięcie konta SalonBW” albo „Usunięcie danych – Meta/Instagram”.`,
                            },
                            {
                                text: 'Napisz, czego dotyczy żądanie: usunięcia całego konta klienta SalonBW (niezależnie od sposobu rejestracji), wybranych danych, odłączenia logowania Facebook/Google, albo — jeżeli wyświetlamy Twój publiczny komentarz lub polubienie przy naszych postach na Instagramie — zaprzestania jego prezentacji na stronie.',
                            },
                            {
                                text: 'Podaj dane pozwalające odnaleźć konto: imię i nazwisko oraz adres e-mail lub numer telefonu użyty przy rejestracji albo logowaniu zewnętrznym. Jeżeli żądanie dotyczy integracji Meta/Instagram, możesz dodatkowo podać nazwę użytkownika Instagram.',
                            },
                            {
                                text: 'Wyślij wiadomość z adresu powiązanego z kontem, jeżeli to możliwe. Możemy poprosić o dodatkowe potwierdzenie tożsamości, ale nigdy o hasło, token dostępu ani dane logowania do Google, Facebooka, Meta lub Instagram.',
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
                heading: '5. Co usuniemy przy usunięciu konta?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Po pozytywnej weryfikacji, w zakresie, w jakim nie mamy obowiązku dalszego przechowywania danych (patrz punkt 8), usuniemy lub zanonimizujemy:',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                text: 'konto oraz dane profilu, kontaktowe i adresowe,',
                            },
                            {
                                text: 'zdjęcie profilowe oraz zdjęcia i pliki zapisane w Twoim profilu,',
                            },
                            {
                                text: 'zgody, preferencje komunikacji oraz powiązaną historię wiadomości, opinii, notatek i zaleceń,',
                            },
                            {
                                text: 'dane programu lojalnościowego powiązane z kontem,',
                            },
                            {
                                text: 'powiązanie z kontem Google, Facebooka lub innego dostawcy (odłączamy identyfikatory zewnętrzne) oraz kopie podstawowego profilu skopiowane przy logowaniu,',
                            },
                            {
                                text: 'ewentualne dane techniczne logowania Meta (Facebook) zapisane przez Salon Black & White. Galeria Instagram wyświetla wyłącznie nasze własne posty i nie przechowuje Twoich danych osobowych, więc nie zawiera danych klienta do usunięcia.',
                            },
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Usunięcie konta unieważnia również aktywne sesje oraz tokeny logowania SalonBW. Po realizacji żądania ponowne korzystanie z systemu rezerwacji wymaga założenia konta od nowa.',
                    },
                ],
            },
            {
                heading: '6. Odłączenie logowania zewnętrznego a usunięcie danych',
                blocks: [
                    {
                        type: 'p',
                        text: 'Jeżeli logowałeś się przez Facebooka lub Google, możesz odłączyć naszą aplikację w ustawieniach swojego konta (Facebook: Ustawienia → Aplikacje i witryny; Google: Konto → Bezpieczeństwo → Połączenia z aplikacjami). Odłączenie blokuje przyszłe logowanie tym połączeniem, ale nie usuwa automatycznie odrębnego konta klienta ani danych zapisanych wcześniej w systemie SalonBW. Aby usunąć te dane, złóż żądanie opisane w punkcie 4.',
                    },
                    {
                        type: 'p',
                        text: 'Galeria Instagram korzysta z naszego własnego, firmowego konta, więc zwykły odwiedzający nie ma tu nic „podłączonego”, co mógłby odłączyć. Działa to też w drugą stronę: usunięcie konta SalonBW nie usuwa Twojego konta ani danych po stronie Google, Facebooka, Meta czy Instagrama. Tymi danymi zarządzasz bezpośrednio w ustawieniach danego dostawcy, a Salon Black & White nie może usunąć danych przechowywanych wyłącznie na serwerach tych usług.',
                    },
                ],
            },
            {
                heading: '7. Instagram — integracja galerii',
                blocks: [
                    {
                        type: 'p',
                        text: 'Integracja z Instagramem służy wyłącznie do prezentacji na naszej stronie treści z firmowego konta salon_bw — postów, a także możliwych publicznych polubień i komentarzy pod naszymi postami. Pobieramy jedynie media i podpisy z naszego własnego konta; nie używamy logowania przez Instagram, nie zakładamy kont klientów i nie budujemy z tej integracji profili klientów, nie pobieramy też prywatnych wiadomości, kontaktów ani haseł.',
                    },
                    {
                        type: 'p',
                        text: `Jeżeli wyświetlamy Twój publiczny komentarz lub polubienie widoczne przy naszych postach i chcesz, abyśmy przestali je prezentować na stronie, napisz do nas na adres ${CONTACT_EMAIL} albo usuń bądź ukryj tę treść bezpośrednio na Instagramie. Nie kopiujemy takich treści do systemu CRM ani nie łączymy ich z kontami klientów.`,
                    },
                    {
                        type: 'p',
                        text: 'Jeżeli w przyszłości udostępnimy logowanie przez Instagram lub innego dostawcę, zaktualizujemy tę stronę oraz Politykę Prywatności, a takie logowanie będzie objęte tymi samymi zasadami usuwania danych co pozostali dostawcy.',
                    },
                ],
            },
            {
                heading: '8. Dane, których nie możemy usunąć od razu',
                blocks: [
                    {
                        type: 'p',
                        text: 'Prawo do usunięcia danych nie jest bezwzględne. Część informacji możemy ograniczyć i zachować przez okres wymagany przepisami, w szczególności: dane rozliczeniowe i księgowe (faktury, paragony, dokumentacja sprzedaży) przez okres wymagany prawem podatkowym, oraz dane niezbędne do ustalenia, dochodzenia lub obrony roszczeń — do czasu ich przedawnienia.',
                    },
                    {
                        type: 'p',
                        text: 'Możemy też zachować minimalny zakres danych na potrzeby przeciwdziałania nadużyciom oraz wykazania zgodności naszych działań z prawem. Jeżeli część danych musi zostać zachowana, poinformujemy o zakresie, podstawie i przewidywanym okresie dalszego przechowywania. Dane te nie będą wykorzystywane do marketingu i zostaną usunięte po upływie wymaganych okresów.',
                    },
                ],
            },
            {
                heading: '9. Termin i potwierdzenie realizacji',
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
                heading: '10. Bezpieczeństwo żądania',
                blocks: [
                    {
                        type: 'p',
                        text: 'Nie przesyłaj w żądaniu haseł, kodów jednorazowych, tokenów dostępu, danych kart płatniczych ani niezamówionych kopii dokumentów tożsamości. Poprosimy wyłącznie o informacje niezbędne do potwierdzenia tożsamości i odnalezienia danych.',
                    },
                ],
            },
            {
                heading: '11. Administrator i prawa użytkownika',
                blocks: [
                    {
                        type: 'p',
                        text: `Administratorem danych jest Salon Fryzjerski Black&White Aleksandra Bodora. W sprawach dotyczących danych osobowych skontaktuj się z nami pod adresem ${CONTACT_EMAIL}. Szczegółowe informacje o przetwarzaniu danych, w tym o kategoriach danych i okresach ich przechowywania, znajdują się w Polityce Prywatności. Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.`,
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
            'How to delete your Salon Black & White account and data, including data copied at Google or Facebook login and data connected with Meta and Instagram integrations.',
        ogTitle: 'Data Deletion — Salon Black & White',
        ogDescription:
            'Learn how to delete your SalonBW account and related data, including data from Google or Facebook login and from Meta and Instagram integrations.',
        eyebrow: 'Data protection',
        h1: 'Data deletion instructions',
        lead: 'This page explains how to delete your Salon Black & White client account and request deletion of the personal data we process — regardless of how the account was created, including data copied at login through Google, Facebook or another provider, and data connected with our use of Meta and Instagram services.',
        reviewNotice:
            'English is a convenience translation. The legally binding version is the Polish text.',
        sections: [
            {
                heading: '1. Who are these instructions for?',
                blocks: [
                    {
                        type: 'p',
                        text: 'These instructions apply to clients and users of the Salon Black & White website and booking system, regardless of how the account was created — through the registration form with an email address and password, or through external login (Google, Facebook or another available provider). We process clients’ personal data only in our panel (the CRM system) and, for external login, additionally the basic profile obtained from the login provider.',
                    },
                    {
                        type: 'p',
                        text: 'The obligation to publish these instructions arises from our use of Meta platform services — the Instagram app powering the website gallery and, where made available, Facebook login. The Instagram integration itself only displays content from our salon_bw business account and does not process clients’ personal data; its separate rules are described in section 7.',
                    },
                ],
            },
            {
                heading: '2. What data does SalonBW store?',
                blocks: [
                    {
                        type: 'p',
                        text: 'As part of your client account and your service history, the SalonBW panel may store the following categories of data:',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                lead: 'Account and profile data:',
                                text: 'first name, surname, display name, email address, account role and a password stored only in hashed form.',
                            },
                            {
                                lead: 'Contact and address data:',
                                text: 'phone number, address, city and postal code.',
                            },
                            {
                                lead: 'Additional profile data:',
                                text: 'date of birth, gender, a description or note, and a profile photo (avatar).',
                            },
                            {
                                lead: 'Consents and communication preferences:',
                                text: 'GDPR and terms consents (with dates), marketing consents (SMS, WhatsApp, email), in-panel notification settings and a record of consent changes (audit trail).',
                            },
                            {
                                lead: 'Visit and booking history:',
                                text: 'appointment times, selected services, the assigned staff member, statuses, amounts, payment methods, discounts and tips.',
                            },
                            {
                                lead: 'Notes, recommendations and formulas:',
                                text: 'visit notes, aftercare recommendations and formulas or recipes (e.g. colouring) saved in the profile.',
                            },
                            {
                                lead: 'Messages and reviews:',
                                text: 'message threads between the client and the salon, and ratings and comments about visits.',
                            },
                            {
                                lead: 'Loyalty programme:',
                                text: 'points, accrual history and linked gift cards.',
                            },
                            {
                                lead: 'Attachments:',
                                text: 'photos in the client gallery and files attached to the profile.',
                            },
                            {
                                lead: 'Billing data:',
                                text: 'invoices, receipts and product sales records.',
                            },
                            {
                                lead: 'Technical and security data:',
                                text: 'session and refresh tokens, login-attempt records, event logs and push-notification subscription identifiers.',
                            },
                            {
                                lead: 'Communication history:',
                                text: 'logs of SMS and email messages sent and newsletter recipient records.',
                            },
                            {
                                lead: 'External login identifiers:',
                                text: 'your account identifier at the provider (e.g. Google or Facebook), if external login has been linked to the account — see section 3.',
                            },
                        ],
                    },
                ],
            },
            {
                heading: '3. Data copied at login through Google, Facebook or another provider',
                blocks: [
                    {
                        type: 'p',
                        text: 'If you log in through Google, Facebook or another available provider, at first login we copy from your basic profile only: your email address, first name, surname and profile photo. We also store your account identifier at the provider (e.g. a Google or Facebook identifier) so we can recognise you at subsequent logins.',
                    },
                    {
                        type: 'p',
                        text: 'External login uses only the basic profile scope (e.g. Google: “email” and “profile”; Facebook: “email” and “public_profile”). We do not retrieve or store provider access tokens, friend lists, private messages or passwords.',
                    },
                    {
                        type: 'p',
                        text: 'The copied data becomes part of your SalonBW client account and is deleted on the same terms as the rest of your profile data (see sections 4 and 5).',
                    },
                ],
            },
            {
                heading: '4. How do I submit an account or data deletion request?',
                blocks: [
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            {
                                text: `Send an email to ${CONTACT_EMAIL} with the subject “Delete SalonBW account” or “Data deletion – Meta/Instagram”.`,
                            },
                            {
                                text: 'State what the request concerns: deletion of your entire SalonBW client account (regardless of how you registered), selected data, disconnecting Facebook/Google login, or — if we display your public comment or like under our Instagram posts — that we stop showing it on the website.',
                            },
                            {
                                text: 'Provide the information needed to locate your account: your first and last name and the email address or telephone number used during registration or external login. If your request concerns the Meta/Instagram integration, you may also provide your Instagram username.',
                            },
                            {
                                text: 'If possible, send the request from the address linked to your account. We may ask for additional identity verification, but never for your password, access token or Google, Facebook, Meta or Instagram login details.',
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
                heading: '5. What is deleted when the account is deleted?',
                blocks: [
                    {
                        type: 'p',
                        text: 'After successful verification, and to the extent we are not required to retain the data (see section 8), we will delete or anonymise:',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                text: 'the account and its profile, contact and address data,',
                            },
                            {
                                text: 'the profile photo and the photos and files stored in your profile,',
                            },
                            {
                                text: 'consents, communication preferences and the related history of messages, reviews, notes and recommendations,',
                            },
                            {
                                text: 'loyalty programme data linked to the account,',
                            },
                            {
                                text: 'the link to your Google, Facebook or other provider account (we unlink the external identifiers) and the basic profile copies made at login,',
                            },
                            {
                                text: 'any technical Meta (Facebook) login data stored by Salon Black & White. The Instagram gallery only displays our own posts and stores none of your personal data, so it contains no client data to delete.',
                            },
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Deleting the account also revokes active SalonBW sessions and login tokens. After the request is fulfilled, using the booking system again requires creating a new account.',
                    },
                ],
            },
            {
                heading: '6. Disconnecting external login vs. deleting data',
                blocks: [
                    {
                        type: 'p',
                        text: 'If you logged in through Facebook or Google, you can disconnect our app in your account settings (Facebook: Settings → Apps and Websites; Google: Account → Security → Your connections to third-party apps). Disconnecting blocks future login through that connection, but it does not automatically delete a separate client account or data previously stored in SalonBW systems. To delete that data, submit the request described in section 4.',
                    },
                    {
                        type: 'p',
                        text: 'The Instagram gallery uses our own business account, so an ordinary visitor has nothing “connected” here to disconnect. This also works the other way around: deleting your SalonBW account does not delete your account or data at Google, Facebook, Meta or Instagram. You manage that data directly in the relevant provider’s settings, and Salon Black & White cannot delete data held exclusively on those services’ servers.',
                    },
                ],
            },
            {
                heading: '7. Instagram — gallery integration',
                blocks: [
                    {
                        type: 'p',
                        text: 'The Instagram integration is used only to display content from our salon_bw business account on the website — posts, and possibly public likes and comments under our posts. We retrieve only media and captions from our own account; we do not use Instagram Login, do not create client accounts and do not build client profiles from this integration, nor do we retrieve private messages, contacts or passwords.',
                    },
                    {
                        type: 'p',
                        text: `If we display your public comment or like shown under our posts and you want us to stop showing it on the website, email us at ${CONTACT_EMAIL}, or delete or hide that content directly on Instagram. We do not copy such content into the CRM system or link it to client accounts.`,
                    },
                    {
                        type: 'p',
                        text: 'If in the future we enable login through Instagram or another provider, we will update this page and the Privacy Policy, and such login will be covered by the same data deletion rules as other providers.',
                    },
                ],
            },
            {
                heading: '8. Data we cannot delete immediately',
                blocks: [
                    {
                        type: 'p',
                        text: 'The right to erasure is not absolute. Some information may be restricted and retained for the period required by law, in particular: billing and accounting data (invoices, receipts, sales records) for the period required by tax law, and data necessary to establish, exercise or defend legal claims — until such claims become time-barred.',
                    },
                    {
                        type: 'p',
                        text: 'We may also retain a minimal set of data to prevent abuse and to demonstrate that our actions comply with the law. If any data must be retained, we will explain its scope, the legal basis and the expected retention period. Such data will not be used for marketing and will be deleted once the required periods expire.',
                    },
                ],
            },
            {
                heading: '9. Response time and confirmation',
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
                heading: '10. Request security',
                blocks: [
                    {
                        type: 'p',
                        text: 'Do not send passwords, one-time codes, access tokens, payment card data or unsolicited copies of identity documents. We will ask only for information necessary to confirm your identity and locate your data.',
                    },
                ],
            },
            {
                heading: '11. Controller and your rights',
                blocks: [
                    {
                        type: 'p',
                        text: `The data controller is Salon Fryzjerski Black&White Aleksandra Bodora. For personal data matters, contact us at ${CONTACT_EMAIL}. Detailed information about data processing, including the categories of data and their retention periods, is available in our Privacy Policy. You also have the right to lodge a complaint with the President of the Polish Personal Data Protection Office.`,
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
            'So löschen Sie Ihr Salon-Black-&-White-Konto und Ihre Daten, einschließlich der bei der Anmeldung über Google oder Facebook kopierten Daten sowie der Daten aus Meta- und Instagram-Integrationen.',
        ogTitle: 'Datenlöschung — Salon Black & White',
        ogDescription:
            'Erfahren Sie, wie Sie Ihr SalonBW-Konto und zugehörige Daten löschen, einschließlich der Daten aus der Google- oder Facebook-Anmeldung sowie aus Meta- und Instagram-Integrationen.',
        eyebrow: 'Datenschutz',
        h1: 'Anleitung zur Datenlöschung',
        lead: 'Auf dieser Seite erklären wir, wie Sie Ihr Kundenkonto bei Salon Black & White löschen und die Löschung der von uns verarbeiteten personenbezogenen Daten beantragen können — unabhängig davon, wie das Konto erstellt wurde, einschließlich der bei der Anmeldung über Google, Facebook oder einen anderen Anbieter kopierten Daten sowie der Daten im Zusammenhang mit unserer Nutzung von Meta- und Instagram-Diensten.',
        reviewNotice:
            'Die deutsche Fassung ist eine Übersetzung zur Erleichterung. Rechtlich verbindlich ist die polnische Fassung.',
        sections: [
            {
                heading: '1. Für wen gilt diese Anleitung?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Diese Anleitung gilt für Kundinnen und Kunden sowie Nutzer der Website und des Buchungssystems von Salon Black & White, unabhängig davon, wie das Konto erstellt wurde — über das Registrierungsformular mit E-Mail-Adresse und Passwort oder über eine externe Anmeldung (Google, Facebook oder ein anderer verfügbarer Anbieter). Personenbezogene Daten von Kunden verarbeiten wir ausschließlich in unserem Panel (dem CRM-System) und bei externer Anmeldung zusätzlich im Umfang des vom Anmeldeanbieter bezogenen Basisprofils.',
                    },
                    {
                        type: 'p',
                        text: 'Die Pflicht zur Bereitstellung dieser Anleitung ergibt sich aus unserer Nutzung von Diensten der Meta-Plattform — der Instagram-App für die Website-Galerie und, sofern verfügbar, der Facebook-Anmeldung. Die Instagram-Integration selbst dient ausschließlich der Darstellung von Inhalten unseres Geschäftskontos salon_bw und verarbeitet keine personenbezogenen Daten von Kunden; ihre gesonderten Regeln beschreiben wir in Abschnitt 7.',
                    },
                ],
            },
            {
                heading: '2. Welche Daten speichert SalonBW?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Im Rahmen Ihres Kundenkontos und Ihrer Nutzungshistorie kann das SalonBW-Panel folgende Datenkategorien speichern:',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                lead: 'Konto- und Profildaten:',
                                text: 'Vorname, Nachname, Anzeigename, E-Mail-Adresse, Kontorolle sowie ein ausschließlich als Hash gespeichertes Passwort.',
                            },
                            {
                                lead: 'Kontakt- und Adressdaten:',
                                text: 'Telefonnummer, Adresse, Stadt und Postleitzahl.',
                            },
                            {
                                lead: 'Zusätzliche Profildaten:',
                                text: 'Geburtsdatum, Geschlecht, eine Beschreibung oder Notiz sowie ein Profilbild (Avatar).',
                            },
                            {
                                lead: 'Einwilligungen und Kommunikationseinstellungen:',
                                text: 'DSGVO- und AGB-Einwilligungen (mit Datum), Marketingeinwilligungen (SMS, WhatsApp, E-Mail), Benachrichtigungseinstellungen im Panel sowie eine Aufzeichnung von Einwilligungsänderungen (Audit-Trail).',
                            },
                            {
                                lead: 'Besuchs- und Buchungshistorie:',
                                text: 'Termine, ausgewählte Leistungen, zugewiesene Mitarbeiterin, Status, Beträge, Zahlungsmethoden, Rabatte und Trinkgelder.',
                            },
                            {
                                lead: 'Notizen, Empfehlungen und Rezepturen:',
                                text: 'Besuchsnotizen, Nachsorgeempfehlungen sowie im Profil gespeicherte Formeln und Rezepturen (z. B. für Colorationen).',
                            },
                            {
                                lead: 'Nachrichten und Bewertungen:',
                                text: 'Nachrichtenverläufe zwischen Kunde und Salon sowie Bewertungen und Kommentare zu Besuchen.',
                            },
                            {
                                lead: 'Treueprogramm:',
                                text: 'Punkte, Gutschriftshistorie und verknüpfte Gutscheinkarten.',
                            },
                            {
                                lead: 'Anhänge:',
                                text: 'Fotos in der Kundengalerie und dem Profil beigefügte Dateien.',
                            },
                            {
                                lead: 'Abrechnungsdaten:',
                                text: 'Rechnungen, Quittungen und Verkaufsunterlagen zu Produkten.',
                            },
                            {
                                lead: 'Technische und Sicherheitsdaten:',
                                text: 'Sitzungs- und Aktualisierungstoken, Aufzeichnungen von Anmeldeversuchen, Ereignisprotokolle sowie Kennungen von Push-Benachrichtigungsabonnements.',
                            },
                            {
                                lead: 'Kommunikationshistorie:',
                                text: 'Protokolle gesendeter SMS- und E-Mail-Nachrichten sowie Aufzeichnungen von Newsletter-Empfängern.',
                            },
                            {
                                lead: 'Kennungen der externen Anmeldung:',
                                text: 'Ihre Kontokennung beim Anbieter (z. B. Google oder Facebook), sofern eine externe Anmeldung mit dem Konto verknüpft wurde — siehe Abschnitt 3.',
                            },
                        ],
                    },
                ],
            },
            {
                heading: '3. Bei der Anmeldung über Google, Facebook oder einen anderen Anbieter erhobene Daten',
                blocks: [
                    {
                        type: 'p',
                        text: 'Wenn Sie sich über Google, Facebook oder einen anderen verfügbaren Anbieter anmelden, kopieren wir bei der ersten Anmeldung aus Ihrem Basisprofil ausschließlich: Ihre E-Mail-Adresse, Ihren Vornamen, Ihren Nachnamen und Ihr Profilbild. Außerdem speichern wir Ihre Kontokennung beim Anbieter (z. B. eine Google- oder Facebook-Kennung), um Sie bei späteren Anmeldungen wiederzuerkennen.',
                    },
                    {
                        type: 'p',
                        text: 'Die externe Anmeldung nutzt nur den Basisprofil-Umfang (z. B. Google: „email” und „profile”; Facebook: „email” und „public_profile”). Wir rufen keine Zugriffstoken des Anbieters, Freundeslisten, privaten Nachrichten oder Passwörter ab und speichern diese nicht.',
                    },
                    {
                        type: 'p',
                        text: 'Die kopierten Daten werden Teil Ihres SalonBW-Kundenkontos und werden zu denselben Bedingungen gelöscht wie Ihre übrigen Profildaten (siehe Abschnitte 4 und 5).',
                    },
                ],
            },
            {
                heading: '4. Wie stelle ich einen Antrag auf Konto- oder Datenlöschung?',
                blocks: [
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            {
                                text: `Senden Sie eine E-Mail an ${CONTACT_EMAIL} mit dem Betreff „SalonBW-Konto löschen” oder „Datenlöschung – Meta/Instagram”.`,
                            },
                            {
                                text: 'Geben Sie an, was der Antrag betrifft: die Löschung Ihres gesamten SalonBW-Kundenkontos (unabhängig von der Art der Registrierung), ausgewählter Daten, die Trennung der Facebook-/Google-Anmeldung oder — falls wir Ihren öffentlichen Kommentar oder Ihr „Gefällt mir” unter unseren Instagram-Beiträgen anzeigen — dass wir dessen Anzeige auf der Website einstellen.',
                            },
                            {
                                text: 'Geben Sie die zur Identifizierung des Kontos erforderlichen Daten an: Vor- und Nachname sowie die bei der Registrierung oder externen Anmeldung verwendete E-Mail-Adresse oder Telefonnummer. Betrifft der Antrag die Meta-/Instagram-Integration, können Sie zusätzlich Ihren Instagram-Benutzernamen angeben.',
                            },
                            {
                                text: 'Senden Sie die Anfrage möglichst von der mit Ihrem Konto verknüpften Adresse. Wir können eine zusätzliche Identitätsbestätigung verlangen, jedoch niemals Ihr Passwort, Zugriffstoken oder Ihre Anmeldedaten für Google, Facebook, Meta oder Instagram.',
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
                heading: '5. Was wird bei der Kontolöschung gelöscht?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Nach erfolgreicher Überprüfung löschen oder anonymisieren wir, soweit wir nicht zur weiteren Aufbewahrung verpflichtet sind (siehe Abschnitt 8):',
                    },
                    {
                        type: 'list',
                        ordered: false,
                        items: [
                            {
                                text: 'das Konto sowie die Profil-, Kontakt- und Adressdaten,',
                            },
                            {
                                text: 'das Profilbild sowie die in Ihrem Profil gespeicherten Fotos und Dateien,',
                            },
                            {
                                text: 'Einwilligungen, Kommunikationseinstellungen und die zugehörige Historie von Nachrichten, Bewertungen, Notizen und Empfehlungen,',
                            },
                            {
                                text: 'mit dem Konto verknüpfte Daten des Treueprogramms,',
                            },
                            {
                                text: 'die Verknüpfung mit Ihrem Google-, Facebook- oder anderen Anbieterkonto (wir trennen die externen Kennungen) sowie die bei der Anmeldung kopierten Basisprofil-Daten,',
                            },
                            {
                                text: 'etwaige von Salon Black & White gespeicherte technische Daten der Meta-(Facebook-)Anmeldung. Die Instagram-Galerie zeigt ausschließlich unsere eigenen Beiträge an und speichert keine Ihrer personenbezogenen Daten, enthält also keine zu löschenden Kundendaten.',
                            },
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Die Kontolöschung widerruft außerdem aktive SalonBW-Sitzungen und Anmeldetoken. Nach Erfüllung des Antrags ist für die weitere Nutzung des Buchungssystems die Erstellung eines neuen Kontos erforderlich.',
                    },
                ],
            },
            {
                heading: '6. Trennung der externen Anmeldung vs. Löschung der Daten',
                blocks: [
                    {
                        type: 'p',
                        text: 'Wenn Sie sich über Facebook oder Google angemeldet haben, können Sie unsere App in den Einstellungen Ihres Kontos trennen (Facebook: Einstellungen → Apps und Websites; Google: Konto → Sicherheit → Ihre Verbindungen zu Drittanbieter-Apps). Die Trennung verhindert die künftige Anmeldung über diese Verbindung, löscht jedoch nicht automatisch ein separates Kundenkonto oder zuvor in SalonBW-Systemen gespeicherte Daten. Um diese Daten zu löschen, stellen Sie den in Abschnitt 4 beschriebenen Antrag.',
                    },
                    {
                        type: 'p',
                        text: 'Die Instagram-Galerie nutzt unser eigenes Geschäftskonto, sodass ein gewöhnlicher Besucher hier nichts „Verbundenes” zum Trennen hat. Dies gilt auch umgekehrt: Die Löschung Ihres SalonBW-Kontos löscht nicht Ihr Konto oder Ihre Daten bei Google, Facebook, Meta oder Instagram. Diese Daten verwalten Sie direkt in den Einstellungen des jeweiligen Anbieters, und Salon Black & White kann keine Daten löschen, die ausschließlich auf den Servern dieser Dienste gespeichert sind.',
                    },
                ],
            },
            {
                heading: '7. Instagram — Galerie-Integration',
                blocks: [
                    {
                        type: 'p',
                        text: 'Die Instagram-Integration dient ausschließlich der Darstellung von Inhalten unseres Geschäftskontos salon_bw auf der Website — Beiträge sowie möglicherweise öffentliche „Gefällt mir”-Angaben und Kommentare unter unseren Beiträgen. Wir rufen nur Medien und Bildunterschriften unseres eigenen Kontos ab; wir verwenden keine Instagram-Anmeldung, erstellen keine Kundenkonten und bilden aus dieser Integration keine Kundenprofile und rufen auch keine privaten Nachrichten, Kontakte oder Passwörter ab.',
                    },
                    {
                        type: 'p',
                        text: `Wenn wir Ihren öffentlichen Kommentar oder Ihr „Gefällt mir” unter unseren Beiträgen anzeigen und Sie möchten, dass wir die Anzeige auf der Website einstellen, schreiben Sie uns an ${CONTACT_EMAIL} oder löschen bzw. verbergen Sie diesen Inhalt direkt auf Instagram. Wir kopieren solche Inhalte nicht in das CRM-System und verknüpfen sie nicht mit Kundenkonten.`,
                    },
                    {
                        type: 'p',
                        text: 'Sollten wir künftig die Anmeldung über Instagram oder einen anderen Anbieter ermöglichen, aktualisieren wir diese Seite und die Datenschutzerklärung, und eine solche Anmeldung unterliegt denselben Löschregeln wie andere Anbieter.',
                    },
                ],
            },
            {
                heading: '8. Daten, die wir nicht sofort löschen können',
                blocks: [
                    {
                        type: 'p',
                        text: 'Das Recht auf Löschung gilt nicht uneingeschränkt. Bestimmte Informationen können für den gesetzlich vorgeschriebenen Zeitraum eingeschränkt und aufbewahrt werden, insbesondere: Abrechnungs- und Buchhaltungsdaten (Rechnungen, Quittungen, Verkaufsunterlagen) für den steuerrechtlich vorgeschriebenen Zeitraum sowie Daten, die zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich sind — bis zu deren Verjährung.',
                    },
                    {
                        type: 'p',
                        text: 'Wir können außerdem einen minimalen Datensatz aufbewahren, um Missbrauch vorzubeugen und die Rechtmäßigkeit unserer Tätigkeiten nachzuweisen. Müssen Daten aufbewahrt werden, informieren wir Sie über deren Umfang, Rechtsgrundlage und voraussichtliche Speicherdauer. Diese Daten werden nicht für Marketingzwecke verwendet und nach Ablauf der erforderlichen Fristen gelöscht.',
                    },
                ],
            },
            {
                heading: '9. Antwortfrist und Bestätigung',
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
                heading: '10. Sicherheit des Antrags',
                blocks: [
                    {
                        type: 'p',
                        text: 'Senden Sie keine Passwörter, Einmalcodes, Zugriffstoken, Zahlungskartendaten oder unaufgeforderte Kopien von Ausweisdokumenten. Wir fragen nur nach Informationen, die zur Bestätigung Ihrer Identität und zum Auffinden Ihrer Daten erforderlich sind.',
                    },
                ],
            },
            {
                heading: '11. Verantwortlicher und Ihre Rechte',
                blocks: [
                    {
                        type: 'p',
                        text: `Verantwortlicher ist Salon Fryzjerski Black&White Aleksandra Bodora. Bei Fragen zu personenbezogenen Daten kontaktieren Sie uns unter ${CONTACT_EMAIL}. Ausführliche Informationen zur Datenverarbeitung, einschließlich der Datenkategorien und ihrer Speicherfristen, finden Sie in unserer Datenschutzerklärung. Sie haben außerdem das Recht, eine Beschwerde beim Präsidenten der polnischen Datenschutzbehörde einzureichen.`,
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
