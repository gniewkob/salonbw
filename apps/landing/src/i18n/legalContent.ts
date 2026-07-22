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
                                    text: '– miejsce fizycznego świadczenia usług fryzjerskich zlokalizowane pod adresem ul. Webera 1a/13, 41-902 Bytom.',
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
                            text: `Administratorem Państwa danych osobowych jest Salon Fryzjerski Black&White Aleksandra Bodora z siedzibą w Radzionkowie (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868. Usługi fryzjerskie świadczone są w salonie przy ul. Webera 1a/13, 41-902 Bytom. W sprawach związanych z ochroną danych osobowych prosimy o kontakt pod adresem e-mail: ${CONTACT_EMAIL}.`,
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
                                {
                                    lead: 'Bezpieczne wykonanie zabiegu:',
                                    text: 'jeżeli dobrowolnie przekażą nam Państwo informacje istotne dla bezpiecznego wykonania usługi (np. o alergiach lub przeciwwskazaniach), przetwarzamy je wyłącznie w tym celu. Podstawa prawna: wyraźna zgoda wyrażona poprzez dobrowolne podanie tych informacji (art. 9 ust. 2 lit. a RODO).',
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
                            text: 'Podczas rejestracji w systemie rezerwacji oraz w trakcie realizacji usług w panelu SalonBW możemy przetwarzać następujące kategorie danych:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Dane konta i profilu:',
                                    text: 'imię, nazwisko, nazwa wyświetlana, adres e-mail (służący też do logowania), rola konta oraz hasło przechowywane wyłącznie w postaci zahaszowanej.',
                                },
                                {
                                    lead: 'Dane kontaktowe i adresowe:',
                                    text: 'numer telefonu (niezbędny do potwierdzania i przypominania o wizytach), adres, miasto i kod pocztowy.',
                                },
                                {
                                    lead: 'Dodatkowe dane profilu:',
                                    text: 'data urodzenia, płeć, opis lub notatka oraz zdjęcie profilowe (awatar).',
                                },
                                {
                                    lead: 'Zgody i preferencje komunikacji:',
                                    text: 'zgody RODO i na regulamin (wraz z datami), zgody marketingowe (SMS, WhatsApp, e-mail), ustawienia powiadomień w panelu oraz zapis zmian zgód.',
                                },
                                {
                                    lead: 'Historia wizyt i rezerwacji:',
                                    text: 'terminy, wybrane usługi, przypisany pracownik, statusy, kwoty, metody płatności, rabaty i napiwki.',
                                },
                                {
                                    lead: 'Notatki, zalecenia i receptury:',
                                    text: 'notatki do wizyt, zalecenia pozabiegowe oraz formuły i receptury (np. koloryzacji) tworzące historię zabiegów w profilu Klienta — w tym dobrowolnie podane informacje o alergiach lub przeciwwskazaniach do zabiegów.',
                                },
                                {
                                    lead: 'Wiadomości i opinie:',
                                    text: 'wątki wiadomości między Klientem a salonem oraz oceny i komentarze do wizyt.',
                                },
                                {
                                    lead: 'Program lojalnościowy i rozliczenia:',
                                    text: 'punkty, historia naliczeń, karty podarunkowe oraz dokumenty sprzedaży (faktury, paragony).',
                                },
                                {
                                    lead: 'Załączniki:',
                                    text: 'zdjęcia w galerii Klienta i pliki dołączone do profilu.',
                                },
                                {
                                    lead: 'Dane techniczne, bezpieczeństwa i komunikacji:',
                                    text: 'tokeny sesji i odświeżania, zapisy prób logowania, logi zdarzeń, identyfikatory subskrypcji powiadomień push oraz logi wysłanych wiadomości SMS i e-mail.',
                                },
                                {
                                    lead: 'Identyfikatory logowania zewnętrznego:',
                                    text: 'identyfikator konta u dostawcy (np. Google lub Facebook), jeżeli logowanie zewnętrzne zostało powiązane z kontem (patrz punkt 4).',
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
                    heading: '4. Logowanie przez Google, Facebooka lub innego dostawcę',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Umożliwiamy zakładanie konta i logowanie przez dostawców zewnętrznych (Google, Facebook lub inny dostępny dostawca). W takim przypadku przy pierwszym logowaniu kopiujemy z Państwa podstawowego profilu wyłącznie: adres e-mail, imię, nazwisko oraz zdjęcie profilowe, a także zapisujemy identyfikator konta u dostawcy w celu rozpoznania przy kolejnych logowaniach.',
                        },
                        {
                            type: 'p',
                            text: 'Logowanie zewnętrzne korzysta jedynie z podstawowego zakresu profilu (np. Google: „email” i „profile”; Facebook: „email” i „public_profile”). Nie pobieramy i nie przechowujemy tokenów dostępu dostawcy, list znajomych, wiadomości prywatnych ani haseł. Podstawą prawną jest niezbędność do wykonania umowy o świadczenie usług elektronicznych (art. 6 ust. 1 lit. b RODO).',
                        },
                        {
                            type: 'p',
                            text: 'Obecna integracja z Instagramem służy wyłącznie do wyświetlania mediów z firmowego konta salon_bw i nie jest logowaniem klienta. Zasady odłączania kont zewnętrznych i usuwania danych opisujemy w osobnej Instrukcji usuwania danych (/data-deletion).',
                        },
                    ],
                },
                {
                    heading: '5. Dane osób zapisywanych na wizytę telefonicznie lub na miejscu',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Jeżeli wizyta jest umawiana telefonicznie lub osobiście w Salonie, personel może wprowadzić do systemu CRM podstawowe dane potrzebne do obsługi rezerwacji: imię i nazwisko, numer telefonu oraz — opcjonalnie — adres e-mail i notatki dotyczące usługi. Dane te przetwarzamy na tych samych zasadach, co dane kont zakładanych samodzielnie (podstawa prawna: niezbędność do wykonania umowy, art. 6 ust. 1 lit. b RODO), a niniejsza Polityka pełni wobec tych osób funkcję informacyjną zgodnie z art. 14 RODO. Osobom tym przysługują wszystkie prawa opisane w punkcie 8.',
                        },
                    ],
                },
                {
                    heading: '6. Kto jest odbiorcą Państwa danych?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Dla zapewnienia najwyższej jakości naszych usług, dane mogą być powierzane lub udostępniane wyspecjalizowanym podmiotom współpracującym z Administratorem — wyłącznie w zakresie niezbędnym do działania danej usługi:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Dostawcy usług hostingowych, na którego serwerach w Polsce działają serwis salon-bw.pl i panel klienta (obecnie MyDevil)',
                                },
                                {
                                    text: 'Operatorowi bramki SMS (SMSAPI) oraz dostawcom usług dostarczania e-maili — do wysyłki potwierdzeń i przypomnień o wizytach',
                                },
                                {
                                    text: 'Meta Platforms — wyłącznie jeżeli korzystają Państwo z logowania przez Facebooka lub wybrali powiadomienia WhatsApp',
                                },
                                {
                                    text: 'Google — wyłącznie jeżeli korzystają Państwo z logowania przez Google',
                                },
                                {
                                    text: 'Dostawcom przeglądarkowych usług powiadomień push (np. Google, Apple, Mozilla) — wyłącznie jeżeli włączą Państwo powiadomienia push',
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
                    heading: '7. Przekazywanie danych poza Europejski Obszar Gospodarczy',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Co do zasady przetwarzamy dane na serwerach zlokalizowanych w Polsce. Jeżeli jednak korzystają Państwo z logowania przez Google lub Facebooka, z powiadomień WhatsApp albo z powiadomień push, dane niezbędne do działania tych usług mogą być przekazywane przez ich dostawców (Google, Meta) do państw trzecich, w tym do USA.',
                        },
                        {
                            type: 'p',
                            text: 'Takie przekazanie odbywa się na podstawie zabezpieczeń przewidzianych w RODO — decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (EU-U.S. Data Privacy Framework) lub standardowych klauzul umownych. Korzystanie z tych kanałów jest dobrowolne: konto można założyć i obsługiwać bez logowania zewnętrznego i bez tych kanałów powiadomień.',
                        },
                    ],
                },
                {
                    heading: '8. Prawa osób, których dane dotyczą',
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
                                    lead: 'Sprzeciwu',
                                    text: 'wobec przetwarzania opartego na prawnie uzasadnionym interesie Administratora (art. 21 RODO),',
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
                        {
                            type: 'p',
                            text: 'Nie podejmujemy decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby wobec Państwa skutki prawne lub w podobny sposób istotnie na Państwa wpływały.',
                        },
                    ],
                },
                {
                    heading: '9. Okres przechowywania i usuwanie danych',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Dane osobowe będą przechowywane przez okres niezbędny do świadczenia usług rezerwacji i prowadzenia konta w systemie, a po usunięciu konta — do momentu wejścia w życie przedawnienia ewentualnych roszczeń wynikających z umowy lub obowiązkowego czasu archiwizacji dokumentów księgowych przewidzianego przez prawo (zazwyczaj 5 lat).',
                        },
                        {
                            type: 'p',
                            text: 'Prawo do usunięcia danych nie jest bezwzględne — część danych (np. rozliczeniowych, księgowych oraz niezbędnych do obrony roszczeń) możemy zachować przez wymagany przepisami okres, po którego upływie zostaną usunięte. Usunięcie konta odłącza również powiązane logowanie zewnętrzne (Google, Facebook lub inny dostawca) i unieważnia sesje w SalonBW; nie usuwa jednak danych po stronie tych dostawców. Szczegółowy tryb usunięcia konta i danych opisuje Instrukcja usuwania danych (/data-deletion).',
                        },
                        {
                            type: 'p',
                            text: 'Dane usunięte z systemu mogą przez ograniczony czas (do około 14 dni) pozostawać w automatycznych kopiach zapasowych wykonywanych przez dostawcę hostingu, po czym są cyklicznie nadpisywane. Kopie zapasowe służą wyłącznie przywracaniu systemu po awarii i nie są wykorzystywane do bieżącego przetwarzania danych.',
                        },
                    ],
                },
                {
                    heading: '10. Pliki Cookies',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Serwis wykorzystuje pliki cookies niezbędne do działania — w szczególności do utrzymania sesji logowania w panelu oraz zabezpieczenia formularzy (ochrona CSRF). Te pliki nie wymagają zgody i nie służą do śledzenia.',
                        },
                        {
                            type: 'p',
                            text: 'Analityczne pliki cookies (statystyki odwiedzin) uruchamiamy wyłącznie po wyrażeniu zgody w banerze zgód wyświetlanym przy pierwszej wizycie. Zgodę można w każdej chwili wycofać — zmieniając wybór w banerze lub usuwając pliki cookies w przeglądarce; odmowa lub wycofanie zgody powoduje usunięcie identyfikatorów analitycznych i nie ogranicza korzystania z serwisu.',
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
                                    text: '– the place where hairdressing services are physically provided, located at ul. Webera 1a/13, 41-902 Bytom.',
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
                            text: `The controller of your personal data is Salon Fryzjerski Black&White Aleksandra Bodora, registered office in Radzionków (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868. Hairdressing services are provided at the salon at ul. Webera 1a/13, 41-902 Bytom. For matters relating to the protection of personal data, please contact us at: ${CONTACT_EMAIL}.`,
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
                                {
                                    lead: 'Safe performance of the treatment:',
                                    text: 'if you voluntarily provide us with information relevant to performing the service safely (e.g. allergies or contraindications), we process it solely for that purpose. Legal basis: explicit consent expressed by voluntarily providing this information (Art. 9(2)(a) GDPR).',
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
                            text: 'During registration in our booking system and while providing services, the SalonBW panel may process the following categories of data:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Account and profile data:',
                                    text: 'first name, surname, display name, email address (also used for logging in), account role and a password stored only in hashed form.',
                                },
                                {
                                    lead: 'Contact and address data:',
                                    text: 'phone number (required to confirm and remind about visits), address, city and postal code.',
                                },
                                {
                                    lead: 'Additional profile data:',
                                    text: 'date of birth, gender, a description or note, and a profile photo (avatar).',
                                },
                                {
                                    lead: 'Consents and communication preferences:',
                                    text: 'GDPR and terms consents (with dates), marketing consents (SMS, WhatsApp, email), in-panel notification settings and a record of consent changes.',
                                },
                                {
                                    lead: 'Visit and booking history:',
                                    text: 'appointment times, selected services, the assigned staff member, statuses, amounts, payment methods, discounts and tips.',
                                },
                                {
                                    lead: 'Notes, recommendations and formulas:',
                                    text: 'visit notes, aftercare recommendations and formulas or recipes (e.g. colouring) forming the treatment history in the Client profile — including voluntarily provided information about allergies or contraindications to treatments.',
                                },
                                {
                                    lead: 'Messages and reviews:',
                                    text: 'message threads between the Client and the salon, and ratings and comments about visits.',
                                },
                                {
                                    lead: 'Loyalty programme and billing:',
                                    text: 'points, accrual history, gift cards and sales documents (invoices, receipts).',
                                },
                                {
                                    lead: 'Attachments:',
                                    text: 'photos in the Client gallery and files attached to the profile.',
                                },
                                {
                                    lead: 'Technical, security and communication data:',
                                    text: 'session and refresh tokens, login-attempt records, event logs, push-notification subscription identifiers and logs of SMS and email messages sent.',
                                },
                                {
                                    lead: 'External login identifiers:',
                                    text: 'your account identifier at the provider (e.g. Google or Facebook), if external login has been linked to the account (see section 4).',
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
                    heading: '4. Login through Google, Facebook or another provider',
                    blocks: [
                        {
                            type: 'p',
                            text: 'We allow account creation and login through external providers (Google, Facebook or another available provider). In that case, at first login we copy from your basic profile only: your email address, first name, surname and profile photo, and we store your account identifier at the provider so we can recognise you at subsequent logins.',
                        },
                        {
                            type: 'p',
                            text: 'External login uses only the basic profile scope (e.g. Google: “email” and “profile”; Facebook: “email” and “public_profile”). We do not retrieve or store provider access tokens, friend lists, private messages or passwords. The legal basis is necessity for the performance of the contract for electronic services (Art. 6(1)(b) GDPR).',
                        },
                        {
                            type: 'p',
                            text: 'The current Instagram integration only displays media from the salon_bw business account and is not a client login. The rules for disconnecting external accounts and deleting data are described in the separate Data deletion instructions (/data-deletion).',
                        },
                    ],
                },
                {
                    heading: '5. Data of persons booked by phone or in person',
                    blocks: [
                        {
                            type: 'p',
                            text: 'If a visit is booked by phone or in person at the Salon, staff may enter into the CRM system the basic data needed to handle the booking: first and last name, phone number and — optionally — an email address and notes about the service. We process this data on the same terms as data of self-created accounts (legal basis: necessity for the performance of the contract, Art. 6(1)(b) GDPR), and this Policy serves as the information notice for those persons in accordance with Art. 14 GDPR. They have all the rights described in section 8.',
                        },
                    ],
                },
                {
                    heading: '6. Who receives your data?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'To ensure the highest quality of our services, data may be entrusted or disclosed to specialised entities cooperating with the Controller — solely to the extent necessary for the given service to work:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'The hosting provider on whose servers in Poland the salon-bw.pl service and the client panel run (currently MyDevil)',
                                },
                                {
                                    text: 'The SMS gateway operator (SMSAPI) and email delivery services — for sending visit confirmations and reminders',
                                },
                                {
                                    text: 'Meta Platforms — only if you use Facebook login or have chosen WhatsApp notifications',
                                },
                                {
                                    text: 'Google — only if you use Google login',
                                },
                                {
                                    text: 'Browser push-notification service providers (e.g. Google, Apple, Mozilla) — only if you enable push notifications',
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
                    heading: '7. Transfers of data outside the European Economic Area',
                    blocks: [
                        {
                            type: 'p',
                            text: 'As a rule, we process data on servers located in Poland. However, if you use Google or Facebook login, WhatsApp notifications or push notifications, the data necessary for those services to work may be transferred by their providers (Google, Meta) to third countries, including the USA.',
                        },
                        {
                            type: 'p',
                            text: 'Such transfers take place on the basis of safeguards provided for in the GDPR — a European Commission adequacy decision (the EU-U.S. Data Privacy Framework) or standard contractual clauses. Using these channels is voluntary: an account can be created and used without external login and without these notification channels.',
                        },
                    ],
                },
                {
                    heading: '8. Rights of data subjects',
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
                                    lead: 'Object',
                                    text: 'to processing based on the Controller’s legitimate interest (Art. 21 GDPR),',
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
                        {
                            type: 'p',
                            text: 'We do not make decisions based solely on automated processing, including profiling, that would produce legal effects concerning you or similarly significantly affect you.',
                        },
                    ],
                },
                {
                    heading: '9. Data retention and deletion',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Personal data will be stored for the period necessary to provide booking services and maintain the account in the system and, after the account is deleted, until any claims arising from the contract become time-barred or until the mandatory period for archiving accounting documents required by law expires (usually 5 years).',
                        },
                        {
                            type: 'p',
                            text: 'The right to erasure is not absolute — some data (e.g. billing, accounting and data needed to defend legal claims) may be retained for the period required by law and deleted once it expires. Deleting the account also unlinks any connected external login (Google, Facebook or another provider) and revokes SalonBW sessions; it does not, however, delete data held by those providers. The detailed procedure for deleting the account and data is described in the Data deletion instructions (/data-deletion).',
                        },
                        {
                            type: 'p',
                            text: 'Data deleted from the system may remain for a limited time (up to approximately 14 days) in automatic backups made by the hosting provider, after which they are cyclically overwritten. Backups serve solely to restore the system after a failure and are not used for ongoing data processing.',
                        },
                    ],
                },
                {
                    heading: '10. Cookies',
                    blocks: [
                        {
                            type: 'p',
                            text: 'The website uses cookies necessary for its operation — in particular to maintain the login session in the panel and to secure forms (CSRF protection). These cookies do not require consent and are not used for tracking.',
                        },
                        {
                            type: 'p',
                            text: 'Analytical cookies (visit statistics) are activated only after you give consent in the consent banner shown on your first visit. You can withdraw consent at any time — by changing your choice in the banner or deleting cookies in your browser; refusing or withdrawing consent removes the analytical identifiers and does not limit your use of the website.',
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
                                    text: '– der Ort der physischen Erbringung der Friseurleistungen, gelegen in der ul. Webera 1a/13, 41-902 Bytom.',
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
                            text: `Verantwortlicher für Ihre personenbezogenen Daten ist Salon Fryzjerski Black&White Aleksandra Bodora mit Sitz in Radzionków (41-922), ul. Mikołaja Kopernika 13, NIP: 626 223 11 81, Tel. +48 723 588 868. Die Friseurleistungen werden im Salon in der ul. Webera 1a/13, 41-902 Bytom erbracht. Bei Fragen zum Schutz personenbezogener Daten kontaktieren Sie uns bitte unter: ${CONTACT_EMAIL}.`,
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
                                {
                                    lead: 'Sichere Durchführung der Behandlung:',
                                    text: 'wenn Sie uns freiwillig Informationen mitteilen, die für die sichere Erbringung der Leistung relevant sind (z. B. Allergien oder Kontraindikationen), verarbeiten wir sie ausschließlich zu diesem Zweck. Rechtsgrundlage: ausdrückliche Einwilligung durch die freiwillige Angabe dieser Informationen (Art. 9 Abs. 2 lit. a DSGVO).',
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
                            text: 'Bei der Registrierung in unserem Buchungssystem und während der Leistungserbringung kann das SalonBW-Panel folgende Datenkategorien verarbeiten:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    lead: 'Konto- und Profildaten:',
                                    text: 'Vorname, Nachname, Anzeigename, E-Mail-Adresse (auch für die Anmeldung), Kontorolle sowie ein ausschließlich als Hash gespeichertes Passwort.',
                                },
                                {
                                    lead: 'Kontakt- und Adressdaten:',
                                    text: 'Telefonnummer (erforderlich zur Bestätigung und Erinnerung an Termine), Adresse, Stadt und Postleitzahl.',
                                },
                                {
                                    lead: 'Zusätzliche Profildaten:',
                                    text: 'Geburtsdatum, Geschlecht, eine Beschreibung oder Notiz sowie ein Profilbild (Avatar).',
                                },
                                {
                                    lead: 'Einwilligungen und Kommunikationseinstellungen:',
                                    text: 'DSGVO- und AGB-Einwilligungen (mit Datum), Marketingeinwilligungen (SMS, WhatsApp, E-Mail), Benachrichtigungseinstellungen im Panel sowie eine Aufzeichnung von Einwilligungsänderungen.',
                                },
                                {
                                    lead: 'Besuchs- und Buchungshistorie:',
                                    text: 'Termine, ausgewählte Leistungen, zugewiesene Mitarbeiterin, Status, Beträge, Zahlungsmethoden, Rabatte und Trinkgelder.',
                                },
                                {
                                    lead: 'Notizen, Empfehlungen und Rezepturen:',
                                    text: 'Besuchsnotizen, Nachsorgeempfehlungen sowie Formeln und Rezepturen (z. B. für Colorationen), die die Behandlungshistorie im Kundenprofil bilden — einschließlich freiwillig angegebener Informationen zu Allergien oder Kontraindikationen für Behandlungen.',
                                },
                                {
                                    lead: 'Nachrichten und Bewertungen:',
                                    text: 'Nachrichtenverläufe zwischen Kunde und Salon sowie Bewertungen und Kommentare zu Besuchen.',
                                },
                                {
                                    lead: 'Treueprogramm und Abrechnung:',
                                    text: 'Punkte, Gutschriftshistorie, Gutscheinkarten und Verkaufsbelege (Rechnungen, Quittungen).',
                                },
                                {
                                    lead: 'Anhänge:',
                                    text: 'Fotos in der Kundengalerie und dem Profil beigefügte Dateien.',
                                },
                                {
                                    lead: 'Technische, Sicherheits- und Kommunikationsdaten:',
                                    text: 'Sitzungs- und Aktualisierungstoken, Aufzeichnungen von Anmeldeversuchen, Ereignisprotokolle, Kennungen von Push-Benachrichtigungsabonnements sowie Protokolle gesendeter SMS- und E-Mail-Nachrichten.',
                                },
                                {
                                    lead: 'Kennungen der externen Anmeldung:',
                                    text: 'Ihre Kontokennung beim Anbieter (z. B. Google oder Facebook), sofern eine externe Anmeldung mit dem Konto verknüpft wurde (siehe Abschnitt 4).',
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
                    heading: '4. Anmeldung über Google, Facebook oder einen anderen Anbieter',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Wir ermöglichen die Kontoerstellung und Anmeldung über externe Anbieter (Google, Facebook oder einen anderen verfügbaren Anbieter). In diesem Fall kopieren wir bei der ersten Anmeldung aus Ihrem Basisprofil ausschließlich: Ihre E-Mail-Adresse, Ihren Vornamen, Ihren Nachnamen und Ihr Profilbild und speichern Ihre Kontokennung beim Anbieter, um Sie bei späteren Anmeldungen wiederzuerkennen.',
                        },
                        {
                            type: 'p',
                            text: 'Die externe Anmeldung nutzt nur den Basisprofil-Umfang (z. B. Google: „email” und „profile”; Facebook: „email” und „public_profile”). Wir rufen keine Zugriffstoken des Anbieters, Freundeslisten, privaten Nachrichten oder Passwörter ab und speichern diese nicht. Rechtsgrundlage ist die Erforderlichkeit zur Erfüllung des Vertrags über elektronische Dienstleistungen (Art. 6 Abs. 1 lit. b DSGVO).',
                        },
                        {
                            type: 'p',
                            text: 'Die aktuelle Instagram-Integration zeigt lediglich Medien des Geschäftskontos salon_bw an und ist keine Kundenanmeldung. Die Regeln zur Trennung externer Konten und zur Löschung von Daten sind in der gesonderten Anleitung zur Datenlöschung (/data-deletion) beschrieben.',
                        },
                    ],
                },
                {
                    heading: '5. Daten von telefonisch oder vor Ort angemeldeten Personen',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Wird ein Termin telefonisch oder persönlich im Salon vereinbart, kann das Personal die für die Buchung erforderlichen Grunddaten in das CRM-System eintragen: Vor- und Nachname, Telefonnummer sowie — optional — E-Mail-Adresse und Notizen zur Leistung. Diese Daten verarbeiten wir zu denselben Bedingungen wie Daten selbst erstellter Konten (Rechtsgrundlage: Erforderlichkeit zur Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO); diese Erklärung dient gegenüber diesen Personen als Information gemäß Art. 14 DSGVO. Ihnen stehen alle in Abschnitt 8 beschriebenen Rechte zu.',
                        },
                    ],
                },
                {
                    heading: '6. Wer erhält Ihre Daten?',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Um die höchste Qualität unserer Leistungen sicherzustellen, können Daten an spezialisierte, mit dem Verantwortlichen kooperierende Stellen weitergegeben oder offengelegt werden — ausschließlich in dem für den jeweiligen Dienst erforderlichen Umfang:',
                        },
                        {
                            type: 'list',
                            ordered: false,
                            items: [
                                {
                                    text: 'Der Hosting-Anbieter, auf dessen Servern in Polen der Dienst salon-bw.pl und das Kundenpanel laufen (derzeit MyDevil)',
                                },
                                {
                                    text: 'Der SMS-Gateway-Betreiber (SMSAPI) und E-Mail-Zustelldienste — zum Versand von Terminbestätigungen und -erinnerungen',
                                },
                                {
                                    text: 'Meta Platforms — nur wenn Sie die Facebook-Anmeldung nutzen oder WhatsApp-Benachrichtigungen gewählt haben',
                                },
                                {
                                    text: 'Google — nur wenn Sie die Google-Anmeldung nutzen',
                                },
                                {
                                    text: 'Anbieter von Browser-Push-Benachrichtigungsdiensten (z. B. Google, Apple, Mozilla) — nur wenn Sie Push-Benachrichtigungen aktivieren',
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
                    heading: '7. Übermittlung von Daten außerhalb des Europäischen Wirtschaftsraums',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Grundsätzlich verarbeiten wir Daten auf Servern in Polen. Wenn Sie jedoch die Google- oder Facebook-Anmeldung, WhatsApp-Benachrichtigungen oder Push-Benachrichtigungen nutzen, können die für diese Dienste erforderlichen Daten von deren Anbietern (Google, Meta) in Drittländer, einschließlich der USA, übermittelt werden.',
                        },
                        {
                            type: 'p',
                            text: 'Eine solche Übermittlung erfolgt auf Grundlage der in der DSGVO vorgesehenen Garantien — eines Angemessenheitsbeschlusses der Europäischen Kommission (EU-U.S. Data Privacy Framework) oder von Standardvertragsklauseln. Die Nutzung dieser Kanäle ist freiwillig: Ein Konto kann ohne externe Anmeldung und ohne diese Benachrichtigungskanäle erstellt und genutzt werden.',
                        },
                    ],
                },
                {
                    heading: '8. Rechte der betroffenen Personen',
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
                                    lead: 'Widerspruch',
                                    text: 'gegen eine auf dem berechtigten Interesse des Verantwortlichen beruhende Verarbeitung (Art. 21 DSGVO),',
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
                        {
                            type: 'p',
                            text: 'Wir treffen keine ausschließlich auf automatisierter Verarbeitung — einschließlich Profiling — beruhenden Entscheidungen, die Ihnen gegenüber rechtliche Wirkung entfalten oder Sie in ähnlicher Weise erheblich beeinträchtigen würden.',
                        },
                    ],
                },
                {
                    heading: '9. Speicherdauer und Löschung der Daten',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Personenbezogene Daten werden für den Zeitraum gespeichert, der für die Erbringung der Buchungsleistungen und die Kontoführung im System erforderlich ist, und nach Löschung des Kontos bis zum Eintritt der Verjährung etwaiger vertraglicher Ansprüche oder bis zum Ablauf der gesetzlich vorgeschriebenen Aufbewahrungsfrist für Buchhaltungsunterlagen (in der Regel 5 Jahre).',
                        },
                        {
                            type: 'p',
                            text: 'Das Recht auf Löschung gilt nicht uneingeschränkt — bestimmte Daten (z. B. Abrechnungs-, Buchhaltungsdaten und zur Verteidigung von Rechtsansprüchen erforderliche Daten) können für den gesetzlich vorgeschriebenen Zeitraum aufbewahrt und nach dessen Ablauf gelöscht werden. Die Kontolöschung trennt außerdem eine verknüpfte externe Anmeldung (Google, Facebook oder ein anderer Anbieter) und widerruft SalonBW-Sitzungen; sie löscht jedoch keine Daten bei diesen Anbietern. Das genaue Verfahren zur Löschung des Kontos und der Daten ist in der Anleitung zur Datenlöschung (/data-deletion) beschrieben.',
                        },
                        {
                            type: 'p',
                            text: 'Aus dem System gelöschte Daten können für begrenzte Zeit (bis zu etwa 14 Tagen) in automatischen Sicherungskopien des Hosting-Anbieters verbleiben und werden anschließend zyklisch überschrieben. Sicherungskopien dienen ausschließlich der Systemwiederherstellung nach einem Ausfall und werden nicht für die laufende Datenverarbeitung verwendet.',
                        },
                    ],
                },
                {
                    heading: '10. Cookies',
                    blocks: [
                        {
                            type: 'p',
                            text: 'Die Website verwendet für den Betrieb notwendige Cookies — insbesondere zur Aufrechterhaltung der Anmeldesitzung im Panel und zur Absicherung von Formularen (CSRF-Schutz). Diese Cookies erfordern keine Einwilligung und dienen nicht dem Tracking.',
                        },
                        {
                            type: 'p',
                            text: 'Analytische Cookies (Besuchsstatistiken) werden nur aktiviert, nachdem Sie im beim ersten Besuch angezeigten Einwilligungsbanner zugestimmt haben. Die Einwilligung können Sie jederzeit widerrufen — durch Änderung Ihrer Auswahl im Banner oder Löschen der Cookies im Browser; eine Ablehnung oder ein Widerruf entfernt die analytischen Kennungen und schränkt die Nutzung der Website nicht ein.',
                        },
                    ],
                },
            ],
            effectiveLabel: 'Dokument zuletzt aktualisiert:',
        },
        dataDeletion: DATA_DELETION.de,
    },
};
