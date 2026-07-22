import type { Language } from './translations';
import { DATA_DELETION } from './dataDeletionContent';

/**
 * Per-locale content for the legal pages (/policy, /privacy).
 *
 * IMPORTANT: PL is the legally binding version. EN/DE are machine-assisted
 * translations provided for convenience and PENDING PROFESSIONAL REVIEW —
 * they must not be relied upon as the authoritative legal text.
 */

export type LegalBlock =
    | { type: 'p'; text: string }
    | { type: 'link'; href: string; text: string }
    | { type: 'list'; ordered: boolean; items: LegalItem[] };

export interface LegalItem {
    lead?: string;
    text: string;
}

export interface LegalSection {
    heading: string;
    blocks: LegalBlock[];
}

export interface LegalDoc {
    metaTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
    eyebrow: string;
    h1: string;
    lead: string;
    sections: LegalSection[];
    effectiveLabel: string;
    /** Stable ISO date for documents that must expose a fixed revision date. */
    effectiveDate?: string;
    /** Shown for EN/DE only: a notice that PL is the binding version. */
    reviewNotice?: string;
}

const CONTACT_EMAIL = 'kontakt@salon-bw.pl';

export const LEGAL: Record<
    Language,
    { policy: LegalDoc; privacy: LegalDoc; dataDeletion: LegalDoc }
> = {
    pl: {
        policy: {
            metaTitle: 'Regulamin Świadczenia Usług | Salon Black & White',
            metaDescription:
                'Regulamin świadczenia usług drogą elektroniczną oraz zasady korzystania z usług Salonu Fryzjerskiego Black & White.',
            ogTitle: 'Regulamin Świadczenia Usług — Salon Black & White',
            ogDescription:
                'Regulamin świadczenia usług drogą elektroniczną oraz zasady korzystania z usług Salonu Fryzjerskiego Black & White.',
            eyebrow: 'Dokumenty prawne',
            h1: 'Regulamin Świadczenia Usług',
            lead: 'Niniejszy Regulamin określa ogólne warunki, zasady oraz sposób świadczenia usług drogą elektroniczną przez Salon Fryzjerski „Black & White", a także zasady korzystania z systemu rezerwacji i świadczenia usług kosmetyczno-fryzjerskich na miejscu.',
            sections: [
                {
                    heading: '1. Postanowienia Ogólne',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Właścicielem serwisu internetowego oraz systemu rezerwacji jest Salon Fryzjerski Black&White Aleksandra Bodora z siedzibą w Radzionkowie (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868, zwany dalej „Usługodawcą".',
                                },
                                {
                                    text: 'Regulamin udostępniany jest nieprzerwanie na stronie internetowej w sposób umożliwiający jego pozyskanie, odtwarzanie i utrwalanie jego treści poprzez wydrukowanie lub zapisanie na nośniku.',
                                },
                                {
                                    text: 'Każdy Klient zobowiązany jest do zapoznania się z Regulaminem przed dokonaniem rezerwacji za pomocą systemu online (odznaczenie zgody podczas rejestracji).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '2. Definicje',
                    blocks: [
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Klient',
                                    text: '– osoba fizyczna, osoba prawna lub jednostka organizacyjna posiadająca co najmniej ograniczoną zdolność do czynności prawnych, korzystająca z Usług.',
                                },
                                {
                                    lead: 'Konto Klienta',
                                    text: '– zindywidualizowany panel w systemie informatycznym, umożliwiający Klientowi przeglądanie historii swoich wizyt, umawianie nowych spotkań oraz zarządzanie swoimi danymi.',
                                },
                                {
                                    lead: 'Usługa Elektroniczna',
                                    text: '– usługa świadczona drogą elektroniczną w rozumieniu ustawy o świadczeniu usług drogą elektroniczną, oferowana przez Usługodawcę na rzecz Klientów (m.in. system rezerwacji, własne Konto Klienta).',
                                },
                                {
                                    lead: 'Salon',
                                    text: '– miejsce fizycznego świadczenia usług fryzjerskich zlokalizowane pod adresem ul. Mikołaja Kopernika 13, Radzionków.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '3. Usługi Świadczone Drogą Elektroniczną (System CRM)',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Usługodawca ułatwia Klientom zarządzanie swoimi wizytami udostępniając dedykowany system informatyczny.',
                                },
                                {
                                    text: 'Do założenia Konta Klienta niezbędne jest podanie prawdziwych danych: imienia, nazwiska, adresu e-mail oraz numeru telefonu kontaktowego w celu weryfikacji tożsamości.',
                                },
                                {
                                    text: 'W ramach systemu CRM Klient ma możliwość m.in.: wyboru terminu usługi, pracownika (stylisty), odwoływania wizyt zgodnie z regulacjami dotyczącymi anulacji oraz wglądu w chronologiczną historię zrealizowanych usług.',
                                },
                                {
                                    lead: 'Wymagania techniczne:',
                                    text: 'przeglądarka internetowa (Chrome, Firefox, Safari, Edge) ze wsparciem JavaScript oraz Cookies.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '4. Zasady Rezerwacji, Anulacji i Świadczenia Usług na Miejscu',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Rezerwacji na zabiegi oferowane przez Salon można dokonywać online przez 24 godziny na dobę, 7 dni w tygodniu poprzez Konto Klienta.',
                                },
                                {
                                    text: 'Po dokonaniu rezerwacji online Klient otrzymuje e-mail/SMS z potwierdzeniem jej wpisania do grafiku.',
                                },
                                {
                                    lead: 'Anulacja:',
                                    text: 'Klient może bezkosztowo odwołać wizytę lub zmienić jej termin na minimalnie 24 godziny przed zaplanowanym czasem jej rozpoczęcia.',
                                },
                                {
                                    text: 'W przypadku nieodwołania wizyty w wyznaczonym wyżej czasie, nagłego niepojawienia się (tzw. No-Show) lub drastycznych spóźnień, Usługodawca zastrzega sobie prawo do zablokowania możliwości rezerwacji online dla takiego Konta Klienta lub obciążenia go opłatą manipulacyjną zgodną z aktualnym cennikiem.',
                                },
                                {
                                    text: 'Ceny wszystkich usług podawane w systemie to kwoty brutto wyrażone w polskich złotych (PLN). Zastrzegamy zmianę ostatecznej ceny w Salonie po uprzedniej konsultacji stanu i długości włosa przed rozpoczęciem zabiegu.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '5. Tryb Postępowania Reklamacyjnego',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Każdemu Klientowi przysługuje prawo do zgłaszania reklamacji uwag dotyczących usług świadczonych na miejscu (najpóźniej do 3 dni po wizycie polecamy niezwłoczny kontakt) oraz Usług Elektronicznych (system CRM).',
                                },
                                {
                                    text: `Zgłoszenia w sprawie działalności serwisu internetowego oraz uwag dotyczących zabiegów można kierować elektronicznie na adres: ${CONTACT_EMAIL}.`,
                                },
                                {
                                    text: 'Zalecamy uwzględnić w reklamacji opis przedmiotu i daty jego wystąpienia oraz dane kontaktowe ułatwiające sprawne jej rozpatrzenie.',
                                },
                                {
                                    text: 'Usługodawca zobowiązuje się rozpatrzyć każdą reklamację w terminie do 14 dni kalendarzowych.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '6. Postanowienia Końcowe',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Kwestie dotyczące ochrony danych osobowych, praw Użytkownika, zbieranych logów i cookies znajdują się w osobnym dokumencie „Polityka Prywatności" (/privacy).',
                                },
                                {
                                    text: 'W sprawach nieuregulowanych niniejszym Regulaminem mają zastosowanie obowiązujące przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz Ustawy o prawach konsumenta.',
                                },
                            ],
                        },
                    ],
                },
            ],
            effectiveLabel: 'Regulamin obowiązuje od dnia:',
        },
        privacy: {
            metaTitle: 'Polityka Prywatności | Salon Black & White',
            metaDescription:
                'Polityka prywatności Salonu Fryzjerskiego Black & White. Informacje o przetwarzaniu danych osobowych (RODO).',
            ogTitle: 'Polityka Prywatności — Salon Black & White',
            ogDescription:
                'Polityka prywatności Salonu Fryzjerskiego Black & White. Informacje o przetwarzaniu danych osobowych (RODO).',
            eyebrow: 'Dokumenty prawne',
            h1: 'Polityka Prywatności',
            lead: 'Poniższa Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazywanych przez Klientów w związku z korzystaniem z usług Salonu Fryzjerskiego „Black & White" oraz systemu rezerwacji wizyt online (CRM).',
            sections: [
                {
                    heading: '1. Administrator Danych Osobowych',
                    blocks: [
                        {
                            type: 'p',
                            text: `Administratorem Państwa danych osobowych jest Salon Fryzjerski Black&White Aleksandra Bodora z siedzibą w Radzionkowie (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868. W sprawach związanych z ochroną danych osobowych prosimy o kontakt pod adresem e-mail: ${CONTACT_EMAIL}.`,
                        },
                    ],
                },
                {
                    heading: '2. Cele i podstawy prawne przetwarzania danych',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Państwa dane osobowe przetwarzane są w następujących celach:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Obsługa konta i rezerwacja wizyt (CRM):',
                                    text: 'Umożliwienie założenia konta w systemie, zarządzanie listą wizyt, przypominanie o wizytach (SMS/e-mail) oraz umożliwienie Klientowi podglądu historii odbytych wizyt. Podstawa prawna: niezbędność do wykonania umowy o świadczenie usług elektronicznych oraz usług fryzjerskich (art. 6 ust. 1 lit. b RODO).',
                                },
                                {
                                    lead: 'Rozliczenia podatkowe:',
                                    text: 'Wystawianie dowodów sprzedaży (faktury, paragony). Podstawa prawna: wypełnienie obowiązku prawnego (art. 6 ust. 1 lit. c RODO).',
                                },
                                {
                                    lead: 'Komunikacja i rozpatrywanie reklamacji:',
                                    text: 'Odpowiadanie na zapytania Klientów oraz realizacja procesu reklamacyjnego. Podstawa prawna: prawnie uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO).',
                                },
                                {
                                    lead: 'Marketing i Newsletter (za zgodą):',
                                    text: 'Przesyłanie informacji o promocjach, zniżkach i nowościach. Podstawa prawna: wyraźna, dobrowolna zgoda Użytkownika wyrażana podczas rejestracji lub w ustawieniach konta (art. 6 ust. 1 lit. a RODO).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '3. Jakie dane przetwarzamy?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Podczas rejestracji w naszym systemie rezerwacji oraz w trakcie realizacji usług zbieramy:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                { text: 'Imię i nazwisko' },
                                {
                                    text: 'Numer telefonu komórkowego (niezbędny do potwierdzania i przypominania o wizytach)',
                                },
                                {
                                    text: 'Adres e-mail (do logowania w systemie CRM oraz komunikacji)',
                                },
                                {
                                    text: 'Zwyczaje i preferencje związane z usługami fryzjerskimi (tworzące historię zabiegów w profilu Klienta)',
                                },
                            ],
                        },
                        {
                            type: 'p',
                            text: 'Podanie danych jest dobrowolne, jednakże brak podania numeru telefonu i nazwiska może uniemożliwić prawidłową weryfikację oraz rezerwację spotkania.',
                        },
                    ],
                },
                {
                    heading: '4. Kto jest odbiorcą Państwa danych?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Dla zapewnienia najwyższej jakości naszych usług, dane mogą być powierzane wyspecjalizowanym podmiotom współpracującym z Administratorem, w tym:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Dostawcom usług hostingowych, na których serwerach działa serwis salon-bw.pl',
                                },
                                {
                                    text: 'Operatorom bramek SMS oraz usług dostarczania e-maili (do celów wysyłania powiadomień)',
                                },
                                {
                                    text: 'Biuru rachunkowemu wspierającemu kwestie księgowe',
                                },
                            ],
                        },
                        {
                            type: 'p',
                            text: 'Nasi partnerzy zapewniają standardy bezpieczeństwa zgodne z RODO.',
                        },
                    ],
                },
                {
                    heading: '5. Prawa osób, których dane dotyczą',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Zgodnie z przepisami RODO, posiadają Państwo prawo do:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Dostępu do treści swoich danych oraz prawo ich sprostowania,',
                                },
                                {
                                    text: 'Usunięcia („prawo do bycia zapomnianym") lub ograniczenia przetwarzania,',
                                },
                                {
                                    lead: 'Przenoszenia danych',
                                    text: 'wprost ze swojego profilu klienta,',
                                },
                                {
                                    lead: 'Cofnięcia każdej wyrażonej zgody',
                                    text: '(np. komunikacji marketingowej SMS/email) w dowolnym momencie w panelu użytkownika. Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania, którego dokonano przed jej wycofaniem,',
                                },
                                {
                                    text: 'Wniesienia skargi do organu nadzorczego (Prezesa Urzędu Ochrony Danych Osobowych).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '6. Okres przechowywania danych',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Dane osobowe będą przechowywane przez okres niezbędny do świadczenia usług rezerwacji i prowadzenia konta w systemie, a po usunięciu konta — do momentu wejścia w życie przedawnienia ewentualnych roszczeń wynikających z umowy lub obowiązkowego czasu archiwizacji dokumentów księgowych przewidzianego przez prawo (zazwyczaj 5 lat).',
                        },
                    ],
                },
                {
                    heading: '7. Pliki Cookies',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Nasz serwis internetowy zbiera w sposób automatyczny wyłącznie informacje zawarte w plikach cookies. Są one wykorzystywane do utrzymywania sesji logowania w panelu, prawidłowego działania serwisu oraz w celach analitycznych.',
                        },
                    ],
                },
            ],
            effectiveLabel: 'Ostatnia aktualizacja dokumentu:',
        },
        dataDeletion: DATA_DELETION.pl,
    },
    en: {
        policy: {
            metaTitle: 'Terms of Service | Salon Black & White',
            metaDescription:
                'Terms of electronic service and the rules for using the services of Salon Black & White hair studio.',
            ogTitle: 'Terms of Service — Salon Black & White',
            ogDescription:
                'Terms of electronic service and the rules for using the services of Salon Black & White hair studio.',
            eyebrow: 'Legal documents',
            h1: 'Terms of Service',
            lead: 'These Terms set out the general conditions, rules and manner of providing electronic services by the "Black & White" hair studio, as well as the rules for using the booking system and for the on-site provision of hairdressing services.',
            reviewNotice:
                'English is a convenience translation. The legally binding version is the Polish text.',
            sections: [
                {
                    heading: '1. General Provisions',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'The owner of the website and booking system is Salon Fryzjerski Black&White Aleksandra Bodora, registered office in Radzionków (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868, hereinafter the "Service Provider".',
                                },
                                {
                                    text: 'These Terms are made permanently available on the website in a way that allows them to be obtained, reproduced and stored by printing or saving to a medium.',
                                },
                                {
                                    text: 'Every Client is required to read these Terms before making a booking via the online system (ticking the consent box during registration).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '2. Definitions',
                    blocks: [
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Client',
                                    text: '– a natural person, legal person or organisational unit with at least limited legal capacity who uses the Services.',
                                },
                                {
                                    lead: 'Client Account',
                                    text: '– an individual panel in the IT system that allows the Client to view the history of their visits, book new appointments and manage their data.',
                                },
                                {
                                    lead: 'Electronic Service',
                                    text: '– a service provided by electronic means within the meaning of the Act on the provision of electronic services, offered by the Service Provider to Clients (including the booking system and the Client Account).',
                                },
                                {
                                    lead: 'Salon',
                                    text: '– the place where hairdressing services are physically provided, located at ul. Mikołaja Kopernika 13, Radzionków.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '3. Services Provided by Electronic Means (CRM System)',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'The Service Provider makes it easier for Clients to manage their visits by providing a dedicated IT system.',
                                },
                                {
                                    text: 'To create a Client Account it is necessary to provide accurate data: first name, surname, e-mail address and contact phone number for identity verification.',
                                },
                                {
                                    text: 'Within the CRM system the Client can, among other things: choose an appointment time and a staff member (stylist), cancel visits in line with the cancellation rules and view the chronological history of completed services.',
                                },
                                {
                                    lead: 'Technical requirements:',
                                    text: 'a web browser (Chrome, Firefox, Safari, Edge) with JavaScript and Cookies support.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '4. Booking, Cancellation and On-Site Service Rules',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Treatments offered by the Salon can be booked online 24 hours a day, 7 days a week via the Client Account.',
                                },
                                {
                                    text: 'After booking online, the Client receives an e-mail/SMS confirming that the appointment has been added to the schedule.',
                                },
                                {
                                    lead: 'Cancellation:',
                                    text: 'the Client may cancel a visit or change its date free of charge at least 24 hours before its scheduled start time.',
                                },
                                {
                                    text: 'If a visit is not cancelled within the time stated above, in the event of a no-show or significant lateness, the Service Provider reserves the right to block online booking for that Client Account or to charge a handling fee in line with the current price list.',
                                },
                                {
                                    text: 'All service prices shown in the system are gross amounts expressed in Polish zloty (PLN). We reserve the right to adjust the final price at the Salon after a prior assessment of the condition and length of the hair before the treatment begins.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '5. Complaints Procedure',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Every Client has the right to submit complaints regarding on-site services (we recommend prompt contact, at the latest within 3 days of the visit) and Electronic Services (the CRM system).',
                                },
                                {
                                    text: `Reports concerning the website and remarks about treatments can be sent electronically to: ${CONTACT_EMAIL}.`,
                                },
                                {
                                    text: 'We recommend including in the complaint a description of the matter and the date it occurred, as well as contact details to help process it efficiently.',
                                },
                                {
                                    text: 'The Service Provider undertakes to consider each complaint within 14 calendar days.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '6. Final Provisions',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Matters concerning the protection of personal data, user rights, collected logs and cookies are set out in a separate document, the "Privacy Policy" (/privacy).',
                                },
                                {
                                    text: 'In matters not regulated by these Terms, the applicable provisions of Polish law shall apply, in particular the Civil Code and the Consumer Rights Act.',
                                },
                            ],
                        },
                    ],
                },
            ],
            effectiveLabel: 'These Terms are effective from:',
        },
        privacy: {
            metaTitle: 'Privacy Policy | Salon Black & White',
            metaDescription:
                'Privacy policy of Salon Black & White hair studio. Information on the processing of personal data (GDPR).',
            ogTitle: 'Privacy Policy — Salon Black & White',
            ogDescription:
                'Privacy policy of Salon Black & White hair studio. Information on the processing of personal data (GDPR).',
            eyebrow: 'Legal documents',
            h1: 'Privacy Policy',
            lead: 'This Privacy Policy sets out the rules for processing and protecting the personal data provided by Clients in connection with the use of the services of the "Black & White" hair studio and the online booking system (CRM).',
            reviewNotice:
                'English is a convenience translation. The legally binding version is the Polish text.',
            sections: [
                {
                    heading: '1. Personal Data Controller',
                    blocks: [
                        {
                            type: 'p',
                            text: `The controller of your personal data is Salon Fryzjerski Black&White Aleksandra Bodora, registered office in Radzionków (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868. For matters relating to the protection of personal data, please contact us at: ${CONTACT_EMAIL}.`,
                        },
                    ],
                },
                {
                    heading: '2. Purposes and legal bases for processing',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Your personal data is processed for the following purposes:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Account handling and appointment booking (CRM):',
                                    text: 'enabling account creation, managing the list of visits, sending visit reminders (SMS/e-mail) and allowing the Client to view the history of past visits. Legal basis: necessity for the performance of the contract for electronic and hairdressing services (Art. 6(1)(b) GDPR).',
                                },
                                {
                                    lead: 'Tax settlements:',
                                    text: 'issuing proof of sale (invoices, receipts). Legal basis: compliance with a legal obligation (Art. 6(1)(c) GDPR).',
                                },
                                {
                                    lead: 'Communication and handling complaints:',
                                    text: 'responding to Client enquiries and carrying out the complaints process. Legal basis: the legitimate interest of the Controller (Art. 6(1)(f) GDPR).',
                                },
                                {
                                    lead: 'Marketing and Newsletter (with consent):',
                                    text: 'sending information about promotions, discounts and news. Legal basis: the explicit, voluntary consent of the User given during registration or in account settings (Art. 6(1)(a) GDPR).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '3. What data do we process?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'During registration in our booking system and while providing services we collect:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                { text: 'First name and surname' },
                                {
                                    text: 'Mobile phone number (required to confirm and remind about visits)',
                                },
                                {
                                    text: 'E-mail address (for logging in to the CRM system and for communication)',
                                },
                                {
                                    text: 'Habits and preferences related to hairdressing services (forming the treatment history in the Client profile)',
                                },
                            ],
                        },
                        {
                            type: 'p',
                            text: 'Providing data is voluntary; however, failure to provide a phone number and surname may prevent correct verification and appointment booking.',
                        },
                    ],
                },
                {
                    heading: '4. Who receives your data?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'To ensure the highest quality of our services, data may be entrusted to specialised entities cooperating with the Controller, including:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Hosting providers on whose servers the salon-bw.pl service runs',
                                },
                                {
                                    text: 'SMS gateway operators and e-mail delivery services (for sending notifications)',
                                },
                                {
                                    text: 'An accounting office supporting bookkeeping matters',
                                },
                            ],
                        },
                        {
                            type: 'p',
                            text: 'Our partners maintain security standards compliant with the GDPR.',
                        },
                    ],
                },
                {
                    heading: '5. Rights of data subjects',
                    blocks: [
                        {
                            type: 'p',
                            text: 'In accordance with the GDPR, you have the right to:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Access your data and to rectify it,',
                                },
                                {
                                    text: 'Erasure (the "right to be forgotten") or restriction of processing,',
                                },
                                {
                                    lead: 'Data portability',
                                    text: 'directly from your client profile,',
                                },
                                {
                                    lead: 'Withdrawal of any consent given',
                                    text: '(e.g. SMS/email marketing communication) at any time in the user panel. Withdrawing consent does not affect the lawfulness of processing carried out before its withdrawal,',
                                },
                                {
                                    text: 'Lodge a complaint with the supervisory authority (the President of the Personal Data Protection Office).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '6. Data retention period',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Personal data will be stored for the period necessary to provide booking services and maintain the account in the system and, after the account is deleted, until any claims arising from the contract become time-barred or until the mandatory period for archiving accounting documents required by law expires (usually 5 years).',
                        },
                    ],
                },
                {
                    heading: '7. Cookies',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Our website automatically collects only the information contained in cookies. They are used to maintain the login session in the panel, for the correct operation of the website and for analytical purposes.',
                        },
                    ],
                },
            ],
            effectiveLabel: 'Document last updated:',
        },
        dataDeletion: DATA_DELETION.en,
    },
    de: {
        policy: {
            metaTitle: 'Nutzungsbedingungen | Salon Black & White',
            metaDescription:
                'Bedingungen für die elektronische Diensterbringung und Regeln für die Nutzung der Leistungen des Friseursalons Black & White.',
            ogTitle: 'Nutzungsbedingungen — Salon Black & White',
            ogDescription:
                'Bedingungen für die elektronische Diensterbringung und Regeln für die Nutzung der Leistungen des Friseursalons Black & White.',
            eyebrow: 'Rechtsdokumente',
            h1: 'Nutzungsbedingungen',
            lead: 'Diese Bedingungen legen die allgemeinen Voraussetzungen, Regeln und die Art der elektronischen Diensterbringung durch den Friseursalon „Black & White" fest sowie die Regeln für die Nutzung des Buchungssystems und die Erbringung der Friseurleistungen vor Ort.',
            reviewNotice:
                'Die deutsche Fassung ist eine Übersetzung zur Erleichterung. Rechtlich verbindlich ist die polnische Fassung.',
            sections: [
                {
                    heading: '1. Allgemeine Bestimmungen',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Inhaber der Website und des Buchungssystems ist Salon Fryzjerski Black&White Aleksandra Bodora mit Sitz in Radzionków (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, Tel. +48 723 588 868, nachfolgend „Diensteanbieter".',
                                },
                                {
                                    text: 'Die Bedingungen werden auf der Website dauerhaft so bereitgestellt, dass sie abgerufen, wiedergegeben und durch Ausdrucken oder Speichern auf einem Datenträger gesichert werden können.',
                                },
                                {
                                    text: 'Jeder Kunde ist verpflichtet, die Bedingungen vor einer Buchung über das Online-System zu lesen (Ankreuzen der Einwilligung bei der Registrierung).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '2. Definitionen',
                    blocks: [
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Kunde',
                                    text: '– eine natürliche Person, juristische Person oder Organisationseinheit mit mindestens beschränkter Geschäftsfähigkeit, die die Leistungen nutzt.',
                                },
                                {
                                    lead: 'Kundenkonto',
                                    text: '– ein individuelles Panel im IT-System, das es dem Kunden ermöglicht, die Historie seiner Besuche einzusehen, neue Termine zu buchen und seine Daten zu verwalten.',
                                },
                                {
                                    lead: 'Elektronische Dienstleistung',
                                    text: '– eine auf elektronischem Wege erbrachte Leistung im Sinne des Gesetzes über die Erbringung elektronischer Dienstleistungen, die der Diensteanbieter den Kunden anbietet (u. a. Buchungssystem und Kundenkonto).',
                                },
                                {
                                    lead: 'Salon',
                                    text: '– der Ort der physischen Erbringung der Friseurleistungen, gelegen in der ul. Mikołaja Kopernika 13, Radzionków.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '3. Elektronisch erbrachte Leistungen (CRM-System)',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Der Diensteanbieter erleichtert den Kunden die Verwaltung ihrer Besuche durch Bereitstellung eines speziellen IT-Systems.',
                                },
                                {
                                    text: 'Für die Einrichtung eines Kundenkontos sind wahrheitsgemäße Angaben erforderlich: Vorname, Nachname, E-Mail-Adresse und Kontakttelefonnummer zur Identitätsprüfung.',
                                },
                                {
                                    text: 'Im Rahmen des CRM-Systems kann der Kunde u. a.: einen Termin und eine Mitarbeiterin (Stylistin) wählen, Besuche gemäß den Stornoregeln absagen und die chronologische Historie der erbrachten Leistungen einsehen.',
                                },
                                {
                                    lead: 'Technische Anforderungen:',
                                    text: 'ein Webbrowser (Chrome, Firefox, Safari, Edge) mit Unterstützung für JavaScript und Cookies.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '4. Regeln für Buchung, Stornierung und Leistung vor Ort',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Die vom Salon angebotenen Behandlungen können rund um die Uhr, 7 Tage die Woche über das Kundenkonto online gebucht werden.',
                                },
                                {
                                    text: 'Nach der Online-Buchung erhält der Kunde eine E-Mail/SMS mit der Bestätigung der Eintragung in den Terminplan.',
                                },
                                {
                                    lead: 'Stornierung:',
                                    text: 'Der Kunde kann einen Besuch kostenlos absagen oder den Termin mindestens 24 Stunden vor dem geplanten Beginn ändern.',
                                },
                                {
                                    text: 'Wird ein Besuch nicht fristgerecht abgesagt, bei Nichterscheinen (No-Show) oder erheblicher Verspätung behält sich der Diensteanbieter das Recht vor, die Online-Buchung für dieses Kundenkonto zu sperren oder eine Bearbeitungsgebühr gemäß der aktuellen Preisliste zu erheben.',
                                },
                                {
                                    text: 'Alle im System angegebenen Preise sind Bruttobeträge in polnischen Zloty (PLN). Wir behalten uns vor, den Endpreis im Salon nach vorheriger Beurteilung von Zustand und Länge des Haares vor Behandlungsbeginn anzupassen.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '5. Beschwerdeverfahren',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Jeder Kunde hat das Recht, Beschwerden zu den vor Ort erbrachten Leistungen (wir empfehlen eine umgehende Kontaktaufnahme, spätestens innerhalb von 3 Tagen nach dem Besuch) sowie zu den elektronischen Leistungen (CRM-System) einzureichen.',
                                },
                                {
                                    text: `Meldungen zur Website und Anmerkungen zu Behandlungen können elektronisch gesendet werden an: ${CONTACT_EMAIL}.`,
                                },
                                {
                                    text: 'Wir empfehlen, in der Beschwerde eine Beschreibung des Sachverhalts und das Datum des Auftretens sowie Kontaktdaten anzugeben, um eine zügige Bearbeitung zu erleichtern.',
                                },
                                {
                                    text: 'Der Diensteanbieter verpflichtet sich, jede Beschwerde innerhalb von 14 Kalendertagen zu bearbeiten.',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '6. Schlussbestimmungen',
                    blocks: [
                        {
                            type: 'list',
                            ordered: true,
                            items: [
                                {
                                    text: 'Fragen zum Schutz personenbezogener Daten, zu Nutzerrechten, erhobenen Logs und Cookies sind in einem separaten Dokument, der „Datenschutzerklärung" (/privacy), geregelt.',
                                },
                                {
                                    text: 'In Angelegenheiten, die in diesen Bedingungen nicht geregelt sind, gelten die geltenden Vorschriften des polnischen Rechts, insbesondere das Zivilgesetzbuch und das Verbraucherrechtegesetz.',
                                },
                            ],
                        },
                    ],
                },
            ],
            effectiveLabel: 'Diese Bedingungen gelten ab:',
        },
        privacy: {
            metaTitle: 'Datenschutzerklärung | Salon Black & White',
            metaDescription:
                'Datenschutzerklärung des Friseursalons Black & White. Informationen zur Verarbeitung personenbezogener Daten (DSGVO).',
            ogTitle: 'Datenschutzerklärung — Salon Black & White',
            ogDescription:
                'Datenschutzerklärung des Friseursalons Black & White. Informationen zur Verarbeitung personenbezogener Daten (DSGVO).',
            eyebrow: 'Rechtsdokumente',
            h1: 'Datenschutzerklärung',
            lead: 'Die folgende Datenschutzerklärung legt die Grundsätze der Verarbeitung und des Schutzes personenbezogener Daten fest, die von Kunden im Zusammenhang mit der Nutzung der Leistungen des Friseursalons „Black & White" und des Online-Buchungssystems (CRM) bereitgestellt werden.',
            reviewNotice:
                'Die deutsche Fassung ist eine Übersetzung zur Erleichterung. Rechtlich verbindlich ist die polnische Fassung.',
            sections: [
                {
                    heading: '1. Verantwortlicher für die Datenverarbeitung',
                    blocks: [
                        {
                            type: 'p',
                            text: `Verantwortlicher für Ihre personenbezogenen Daten ist Salon Fryzjerski Black&White Aleksandra Bodora mit Sitz in Radzionków (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, Tel. +48 723 588 868. Bei Fragen zum Schutz personenbezogener Daten kontaktieren Sie uns bitte unter: ${CONTACT_EMAIL}.`,
                        },
                    ],
                },
                {
                    heading: '2. Zwecke und Rechtsgrundlagen der Verarbeitung',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Ihre personenbezogenen Daten werden zu folgenden Zwecken verarbeitet:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Kontoverwaltung und Terminbuchung (CRM):',
                                    text: 'Ermöglichung der Kontoerstellung, Verwaltung der Besuchsliste, Erinnerung an Termine (SMS/E-Mail) sowie Einsicht des Kunden in die Historie vergangener Besuche. Rechtsgrundlage: Erforderlichkeit zur Erfüllung des Vertrags über elektronische und Friseurleistungen (Art. 6 Abs. 1 lit. b DSGVO).',
                                },
                                {
                                    lead: 'Steuerliche Abrechnungen:',
                                    text: 'Ausstellung von Verkaufsbelegen (Rechnungen, Quittungen). Rechtsgrundlage: Erfüllung einer rechtlichen Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO).',
                                },
                                {
                                    lead: 'Kommunikation und Bearbeitung von Beschwerden:',
                                    text: 'Beantwortung von Kundenanfragen und Durchführung des Beschwerdeprozesses. Rechtsgrundlage: berechtigtes Interesse des Verantwortlichen (Art. 6 Abs. 1 lit. f DSGVO).',
                                },
                                {
                                    lead: 'Marketing und Newsletter (mit Einwilligung):',
                                    text: 'Versand von Informationen über Aktionen, Rabatte und Neuigkeiten. Rechtsgrundlage: ausdrückliche, freiwillige Einwilligung des Nutzers bei der Registrierung oder in den Kontoeinstellungen (Art. 6 Abs. 1 lit. a DSGVO).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '3. Welche Daten verarbeiten wir?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Bei der Registrierung in unserem Buchungssystem und während der Leistungserbringung erheben wir:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                { text: 'Vor- und Nachname' },
                                {
                                    text: 'Mobiltelefonnummer (erforderlich zur Bestätigung und Erinnerung an Termine)',
                                },
                                {
                                    text: 'E-Mail-Adresse (für die Anmeldung im CRM-System und für die Kommunikation)',
                                },
                                {
                                    text: 'Gewohnheiten und Vorlieben in Bezug auf Friseurleistungen (bilden die Behandlungshistorie im Kundenprofil)',
                                },
                            ],
                        },
                        {
                            type: 'p',
                            text: 'Die Angabe der Daten ist freiwillig; das Fehlen von Telefonnummer und Nachname kann jedoch eine korrekte Verifizierung und Terminbuchung verhindern.',
                        },
                    ],
                },
                {
                    heading: '4. Wer erhält Ihre Daten?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Um die höchste Qualität unserer Leistungen sicherzustellen, können Daten an spezialisierte, mit dem Verantwortlichen kooperierende Stellen weitergegeben werden, darunter:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Hosting-Anbieter, auf deren Servern der Dienst salon-bw.pl läuft',
                                },
                                {
                                    text: 'Betreiber von SMS-Gateways und E-Mail-Zustelldiensten (zum Versand von Benachrichtigungen)',
                                },
                                {
                                    text: 'Ein Buchhaltungsbüro zur Unterstützung buchhalterischer Angelegenheiten',
                                },
                            ],
                        },
                        {
                            type: 'p',
                            text: 'Unsere Partner gewährleisten Sicherheitsstandards gemäß der DSGVO.',
                        },
                    ],
                },
                {
                    heading: '5. Rechte der betroffenen Personen',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Gemäß der DSGVO haben Sie das Recht auf:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Zugang zu Ihren Daten und deren Berichtigung,',
                                },
                                {
                                    text: 'Löschung (das „Recht auf Vergessenwerden") oder Einschränkung der Verarbeitung,',
                                },
                                {
                                    lead: 'Datenübertragbarkeit',
                                    text: 'direkt aus Ihrem Kundenprofil,',
                                },
                                {
                                    lead: 'Widerruf jeder erteilten Einwilligung',
                                    text: '(z. B. SMS-/E-Mail-Marketingkommunikation) jederzeit im Nutzerpanel. Der Widerruf der Einwilligung berührt nicht die Rechtmäßigkeit der vor dem Widerruf erfolgten Verarbeitung,',
                                },
                                {
                                    text: 'Beschwerde bei der Aufsichtsbehörde (dem Präsidenten des Amtes für den Schutz personenbezogener Daten).',
                                },
                            ],
                        },
                    ],
                },
                {
                    heading: '6. Speicherdauer der Daten',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Personenbezogene Daten werden für den Zeitraum gespeichert, der für die Erbringung der Buchungsleistungen und die Kontoführung im System erforderlich ist, und nach Löschung des Kontos bis zum Eintritt der Verjährung etwaiger vertraglicher Ansprüche oder bis zum Ablauf der gesetzlich vorgeschriebenen Aufbewahrungsfrist für Buchhaltungsunterlagen (in der Regel 5 Jahre).',
                        },
                    ],
                },
                {
                    heading: '7. Cookies',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Unsere Website erfasst automatisch ausschließlich die in Cookies enthaltenen Informationen. Sie dienen der Aufrechterhaltung der Anmeldesitzung im Panel, dem ordnungsgemäßen Betrieb der Website und analytischen Zwecken.',
                        },
                    ],
                },
            ],
            effectiveLabel: 'Dokument zuletzt aktualisiert:',
        },
        dataDeletion: DATA_DELETION.de,
    },
};
