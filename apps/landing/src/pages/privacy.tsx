import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';

export default function PrivacyPage() {
    return (
        <PublicLayout>
            <Head>
                <title>Polityka Prywatności | Salon Black & White</title>
                <meta
                    name="description"
                    content="Polityka prywatności Salonu Fryzjerskiego Black & White. Informacje o przetwarzaniu danych osobowych (RODO)."
                />
            </Head>
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <article className="prose prose-slate lg:prose-lg max-w-none">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
                        Polityka Prywatności
                    </h1>

                    <p className="lead text-gray-600 mb-8">
                        Poniższa Polityka Prywatności określa zasady
                        przetwarzania i ochrony danych osobowych przekazywanych
                        przez Klientów w związku z korzystaniem z usług Salonu
                        Fryzjerskiego "Black & White" oraz systemu rezerwacji
                        wizyt online (CRM).
                    </p>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        1. Administrator Danych Osobowych
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Administratorem Państwa danych osobowych jest{' '}
                        <strong>Salon Fryzjerski Black & White</strong>{' '}
                        [uzupełnić dokładne dane firmy: NIP, adres siedziby]. W
                        sprawach związanych z ochroną danych osobowych prosimy o
                        kontakt pod adresem e-mail:
                        <a
                            href="mailto:kontakt@salon-bw.pl"
                            className="text-blue-600 hover:underline"
                        >
                            {' '}
                            kontakt@salon-bw.pl
                        </a>
                        .
                    </p>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        2. Cele i podstawy prawne przetwarzania danych
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Państwa dane osobowe przetwarzane są w następujących
                        celach:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            <strong>
                                Obsługa konta i rezerwacja wizyt (CRM):
                            </strong>{' '}
                            Umożliwienie założenia konta w systemie, zarządzanie
                            listą wizyt, przypominanie o wizytach (SMS/e-mail)
                            oraz umożliwienie Klientowi podglądu historii
                            odbytych wizyt. <br />
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

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        3. Jakie dane przetwarzamy?
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Podczas rejestracji w naszym systemie rezerwacji oraz w
                        trackie realizacji usług zbieramy:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
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
                    <p className="text-gray-700 mb-4">
                        Podanie danych jest dobrowolne, jednakże brak podania
                        numeru telefonu i nazwiska może uniemożliwić prawidłową
                        weryfikację oraz rezerwację spotkania.
                    </p>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        4. Kto jest odbiorcą Państwa danych?
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Dla zapewnienia najwyższej jakości naszych usług, dane
                        mogą być powierzane wyspecjalizowanym podmiotom
                        współpracującym z Administratorem, w tym:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
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
                    <p className="text-gray-700 mb-4">
                        Nasi partnerzy zapewniają standardy bezpieczeństwa
                        zgodne z RODO.
                    </p>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        5. Prawa osób, których dane dotyczą
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Zgodnie z przepisami RODO, posiadają Państwo prawo do:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            Dostępu do treści swoich danych oraz prawo ich
                            sprostowania,
                        </li>
                        <li>
                            Usunięcia ("prawo do bycia zapomnianym") lub
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

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        6. Okres przechowywania danych
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Dane osobowe będą przechowywane przez okres niezbędny do
                        świadczenia usług rezerwacji i prowadzenia konta w
                        systemie, a po usunięciu konta - do momentu wejścia w
                        życie przedawnienia ewentualnych roszczeń wynikających z
                        umowy lub obowiązkowego czasu archiwizacji dokumentów
                        księgowych przewidzianego przez prawo (zazwyczaj 5 lat).
                    </p>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        7. Pliki Cookies
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Nasz serwis internetowy zbiera w sposób automatyczny
                        wyłącznie informacje zawarte w plikach cookies. Są one
                        wykorzystywane do utrzymywania sesji logowania w panelu,
                        prawidłowego działania serwisu oraz w celach
                        analitycznych.
                    </p>

                    <div className="mt-12 text-sm text-gray-500">
                        Ostatnia aktualizacja dokumentu:{' '}
                        {new Date().toLocaleDateString('pl-PL')}
                    </div>
                </article>
            </div>
        </PublicLayout>
    );
}
