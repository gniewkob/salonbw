import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';

export default function PrivacyPage() {
    return (
        <PublicLayout>
            <Head>
                <title>Polityka Prywatności | Salon Black & White</title>
                <meta name="description" content="Polityka prywatności Salonu Fryzjerskiego Black & White. Informacje o przetwarzaniu danych osobowych (RODO)." />
                <link rel="canonical" href="https://salon-bw.pl/privacy" />
                <meta name="robots" content="index, follow" />
            </Head>
            <div className="legal-page">
                <article className="legal-article">
                    <p className="legal-eyebrow">Dokumenty prawne</p>
                    <h1 className="legal-h1">Polityka Prywatności</h1>

                    <p className="legal-lead">
                        Poniższa Polityka Prywatności określa zasady
                        przetwarzania i ochrony danych osobowych przekazywanych
                        przez Klientów w związku z korzystaniem z usług Salonu
                        Fryzjerskiego &quot;Black &amp; White&quot; oraz systemu rezerwacji
                        wizyt online (CRM).
                    </p>

                    <h2 className="legal-h2">1. Administrator Danych Osobowych</h2>
                    <p className="legal-body">
                        Administratorem Państwa danych osobowych jest{' '}
                        <strong>
                            Salon Fryzjerski Black&amp;White Aleksandra Bodora
                        </strong>{' '}
                        z siedzibą w Radzionkowie (41-922), ul. Mikołaja
                        Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588 868.
                        W sprawach związanych z ochroną danych osobowych prosimy
                        o kontakt pod adresem e-mail:{' '}
                        <a
                            href="mailto:kontakt@salon-bw.pl"
                            className="legal-link"
                        >
                            kontakt@salon-bw.pl
                        </a>
                        .
                    </p>

                    <h2 className="legal-h2">
                        2. Cele i podstawy prawne przetwarzania danych
                    </h2>
                    <p className="legal-body">
                        Państwa dane osobowe przetwarzane są w następujących
                        celach:
                    </p>
                    <ul className="legal-list">
                        <li>
                            <strong>
                                Obsługa konta i rezerwacja wizyt (CRM):
                            </strong>{' '}
                            Umożliwienie założenia konta w systemie, zarządzanie
                            listą wizyt, przypominanie o wizytach (SMS/e-mail)
                            oraz umożliwienie Klientowi podglądu historii
                            odbytych wizyt.
                            <br />
                            <i>Podstawa prawna:</i> Niezbędność do wykonania
                            umowy o świadczenie usług elektronicznych oraz usług
                            fryzjerskich (art. 6 ust. 1 lit. b RODO).
                        </li>
                        <li>
                            <strong>Rozliczenia podatkowe:</strong> Wystawianie
                            dowodów sprzedaży (faktury, paragony).
                            <br />
                            <i>Podstawa prawna:</i> Wypełnienie obowiązku
                            prawnego (art. 6 ust. 1 lit. c RODO).
                        </li>
                        <li>
                            <strong>
                                Komunikacja i rozpatrywanie reklamacji:
                            </strong>{' '}
                            Odpowiadanie na zapytania Klientów oraz realizacja
                            procesu reklamacyjnego.
                            <br />
                            <i>Podstawa prawna:</i> Prawnie uzasadniony interes
                            Administratora (art. 6 ust. 1 lit. f RODO).
                        </li>
                        <li>
                            <strong>Marketing i Newsletter (za zgodą):</strong>{' '}
                            Przesyłanie informacji o promocjach, zniżkach i
                            nowościach.
                            <br />
                            <i>Podstawa prawna:</i> Wyraźna, dobrowolna zgoda
                            Użytkownika wyrażana podczas rejestracji lub w
                            ustawieniach konta (art. 6 ust. 1 lit. a RODO).
                        </li>
                    </ul>

                    <h2 className="legal-h2">3. Jakie dane przetwarzamy?</h2>
                    <p className="legal-body">
                        Podczas rejestracji w naszym systemie rezerwacji oraz w
                        trakcie realizacji usług zbieramy:
                    </p>
                    <ul className="legal-list">
                        <li>Imię i nazwisko</li>
                        <li>
                            Numer telefonu komórkowego (niezbędny do
                            potwierdzania i przypominania o wizytach)
                        </li>
                        <li>
                            Adres e-mail (do logowania w systemie CRM oraz
                            komunikacji)
                        </li>
                        <li>
                            Zwyczaje i preferencje związane z usługami
                            fryzjerskimi (tworzące historię zabiegów w profilu
                            Klienta)
                        </li>
                    </ul>
                    <p className="legal-body">
                        Podanie danych jest dobrowolne, jednakże brak podania
                        numeru telefonu i nazwiska może uniemożliwić prawidłową
                        weryfikację oraz rezerwację spotkania.
                    </p>

                    <h2 className="legal-h2">
                        4. Kto jest odbiorcą Państwa danych?
                    </h2>
                    <p className="legal-body">
                        Dla zapewnienia najwyższej jakości naszych usług, dane
                        mogą być powierzane wyspecjalizowanym podmiotom
                        współpracującym z Administratorem, w tym:
                    </p>
                    <ul className="legal-list">
                        <li>
                            Dostawcom usług hostingowych, na których serwerach
                            działa serwis <strong>salon-bw.pl</strong>
                        </li>
                        <li>
                            Operatorom bramek SMS oraz usług dostarczania
                            e-maili (do celów wysyłania powiadomień)
                        </li>
                        <li>
                            Biuru rachunkowemu wspierającemu kwestie księgowe
                        </li>
                    </ul>
                    <p className="legal-body">
                        Nasi partnerzy zapewniają standardy bezpieczeństwa
                        zgodne z RODO.
                    </p>

                    <h2 className="legal-h2">
                        5. Prawa osób, których dane dotyczą
                    </h2>
                    <p className="legal-body">
                        Zgodnie z przepisami RODO, posiadają Państwo prawo do:
                    </p>
                    <ul className="legal-list">
                        <li>
                            Dostępu do treści swoich danych oraz prawo ich
                            sprostowania,
                        </li>
                        <li>
                            Usunięcia (&quot;prawo do bycia zapomnianym&quot;) lub
                            ograniczenia przetwarzania,
                        </li>
                        <li>
                            <strong>Przenoszenia danych</strong> wprost ze
                            swojego profilu klienta,
                        </li>
                        <li>
                            <strong>Cofnięcia każdej wyrażonej zgody</strong>{' '}
                            (np. komunikacji marketingowej SMS/email) w dowolnym
                            momencie w panelu użytkownika. Wycofanie zgody nie
                            wpływa na zgodność z prawem przetwarzania, którego
                            dokonano przed jej wycofaniem,
                        </li>
                        <li>
                            Wniesienia skargi do organu nadzorczego (Prezesa
                            Urzędu Ochrony Danych Osobowych).
                        </li>
                    </ul>

                    <h2 className="legal-h2">6. Okres przechowywania danych</h2>
                    <p className="legal-body">
                        Dane osobowe będą przechowywane przez okres niezbędny do
                        świadczenia usług rezerwacji i prowadzenia konta w
                        systemie, a po usunięciu konta — do momentu wejścia w
                        życie przedawnienia ewentualnych roszczeń wynikających z
                        umowy lub obowiązkowego czasu archiwizacji dokumentów
                        księgowych przewidzianego przez prawo (zazwyczaj 5 lat).
                    </p>

                    <h2 className="legal-h2">7. Pliki Cookies</h2>
                    <p className="legal-body">
                        Nasz serwis internetowy zbiera w sposób automatyczny
                        wyłącznie informacje zawarte w plikach cookies. Są one
                        wykorzystywane do utrzymywania sesji logowania w panelu,
                        prawidłowego działania serwisu oraz w celach
                        analitycznych.
                    </p>

                    <div className="legal-date">
                        Ostatnia aktualizacja dokumentu:{' '}
                        {new Date().toLocaleDateString('pl-PL')}
                    </div>
                </article>
            </div>
        </PublicLayout>
    );
}
