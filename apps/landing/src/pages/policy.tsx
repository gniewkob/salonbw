import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';

export default function PolicyPage() {
    return (
        <PublicLayout>
            <Head>
                <title>Regulamin Świadczenia Usług | Salon Black & White</title>
                <meta
                    name="description"
                    content="Regulamin świadczenia usług drogą elektroniczną oraz zasady korzystania z usług Salonu Fryzjerskiego Black & White."
                />
            </Head>
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <article className="prose prose-slate lg:prose-lg max-w-none">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
                        Regulamin Świadczenia Usług
                    </h1>

                    <p className="lead text-gray-600 mb-8">
                        Niniejszy Regulamin określa ogólne warunki, zasady oraz
                        sposób świadczenia usług drogą elektroniczną przez Salon
                        Fryzjerski "Black & White", a także zasady korzystania z
                        systemu rezerwacji i świadczenia usług
                        kosmetyczno-fryzjerskich na miejscu.
                    </p>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        1. Postanowienia Ogólne
                    </h2>
                    <ul className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            Właścicielem serwisu internetowego oraz systemu
                            rezerwacji jest{' '}
                            <strong>Salon Fryzjerski Black & White</strong>{' '}
                            [uzupełnić dane firmy, NIP, adres siedziby], zwany
                            dalej "Usługodawcą".
                        </li>
                        <li>
                            Regulamin udostępniany jest nieprzerwanie na stronie
                            internetowej w sposób umożliwiający jego pozyskanie,
                            odtwarzanie i utrwalanie jego treści poprzez
                            wydrukowanie lub zapisanie na nośniku.
                        </li>
                        <li>
                            Każdy Klient zobowiązany jest do zapoznania się z
                            Regulaminem przed dokonaniem rezerwacji za pomocą
                            systemu online (odznaczenie zgody podczas
                            rejestracji).
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        2. Definicje
                    </h2>
                    <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            <strong>Klient</strong> – osoba fizyczna, osoba
                            prawna lub jednostka organizacyjna posiadająca co
                            najmniej ograniczoną zdolność do czynności prawnych,
                            korzystająca z Usług.
                        </li>
                        <li>
                            <strong>Konto Klienta</strong> – zindywidualizowany
                            panel w systemie informatycznym, umożliwiający
                            Klientowi przeglądanie historii swoich wizyt,
                            umawianie nowych spotkań oraz zarządzanie swoimi
                            danymi.
                        </li>
                        <li>
                            <strong>Usługa Elektroniczna</strong> – usługa
                            świadczona drogą elektroniczną w rozumieniu ustawy o
                            świadczeniu usług drogą elektroniczną, oferowana
                            przez Usługodawcę na rzecz Klientów (m.in. system
                            rezerwacji, własne Konto Klienta).
                        </li>
                        <li>
                            <strong>Salon</strong> – miejsce fizycznego
                            świadczenia usług fryzjerskich zlokalizowane pod
                            adresem [Wpisać adres salonu].
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        3. Usługi Świadczone Drogą Elektroniczną (System CRM)
                    </h2>
                    <ul className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            Usługodawca ułatwia Klientom zarządzanie swoimi
                            wizytami udostępniając dedykowany system
                            informatyczny.
                        </li>
                        <li>
                            Do założenia Konta Klienta niezbędne jest podanie
                            prawdziwych danych: imienia, nazwiska, adresu e-mail
                            oraz numeru telefonu kontaktowego w celu weryfikacji
                            tożsamości.
                        </li>
                        <li>
                            W ramach systemu CRM Klient ma możliwość m.in.:
                            wyboru terminu usługi, pracownika (stylisty),
                            odwoływania wizyt zgodnie z regulacjami dotyczącymi
                            anulacji oraz wglądu w chronologiczną historię
                            zrealizowanych usług.
                        </li>
                        <li>
                            <strong>Wymagania techniczne:</strong> przeglądarka
                            internetowa (Chrome, Firefox, Safari, Edge) ze
                            wsparciem JavaScript oraz Cookies.
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        4. Zasady Rezerwacji, Anulacji i Świadczenia Usług na
                        Miejscu
                    </h2>
                    <ul className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            Rezerwacji na zabiegi oferowane przez Salon można
                            dokonywać online przez 24 godziny na dobę, 7 dni w
                            tygodniu poprzez Konto Klienta.
                        </li>
                        <li>
                            Po dokonaniu rezerwacji online Klient otrzymuje
                            e-mail/SMS z potwierdzeniem jej wpisania do grafiku.
                        </li>
                        <li>
                            <strong>Anulacja:</strong> Klient może bezkosztowo
                            odwołać wizytę lub zmienić jej termin na minimalnie
                            [np. 24 godziny] przed zaplanowanym czasem jej
                            rozpoczęcia.
                        </li>
                        <li>
                            W przypadku nieodwołania wizyty w wyznaczonym wyżej
                            czasie, nagłego niepojawienia się (tzw. No-Show) lub
                            drastycznych spóźnień, Usługodawca zastrzega sobie
                            prawo do zablokowania możliwości rezerwacji online
                            dla takiego Konta Klienta lub obciążenia go opłatą
                            manipulacyjną zgodną z aktualnym cennikiem.
                        </li>
                        <li>
                            Ceny wszystkich usług podawane w systemie to kwoty
                            brutto wyrażone w polskich złotych (PLN).
                            Zastrzegamy zmianę ostatecznej ceny w Salonie po
                            uprzedniej konsultacji stanu i długości włosa przed
                            rozpoczęciem zabiegu.
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        5. Tryb Postępowania Reklamacyjnego
                    </h2>
                    <ul className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            Każdemu Klientowi przysługuje prawo do zgłaszania
                            reklamacji uwag dotyczących usług świadczonych na
                            miejscu (najpóźniej do 3 dni po wizycie polecamy
                            niezwłoczny kontakt) oraz Usług Elektronicznych
                            (system CRM).
                        </li>
                        <li>
                            Zgłoszenia w sprawie działalności serwisu
                            internetowego oraz uwag dotyczących zabiegów można
                            kierować elektronicznie na adres:{' '}
                            <a
                                href="mailto:kontakt@salon-bw.pl"
                                className="text-blue-600 hover:underline"
                            >
                                kontakt@salon-bw.pl
                            </a>
                            .
                        </li>
                        <li>
                            Zalecamy uwzględnić w reklamacji opis przedmiotu i
                            daty jego wystąpienia oraz dane kontaktowe
                            ułatwiające sprawne jej rozpatrzenie.
                        </li>
                        <li>
                            Usługodawca zobowiązuje się rozpatrzyć każdą
                            reklamację w terminie do 14 dni kalendarzowych.
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">
                        6. Postanowienia Końcowe
                    </h2>
                    <ul className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                        <li>
                            Kwestie dotyczące ochrony danych osobowych, praw
                            Użytkownika, zbieranych logów i cookies znajdują się
                            w osobnym dokumencie na stronie{' '}
                            <a
                                href="/privacy"
                                className="text-blue-600 hover:underline"
                            >
                                Polityka Prywatności
                            </a>
                            .
                        </li>
                        <li>
                            W sprawach nieuregulowanych niniejszym Regulaminem
                            mają zastosowanie obowiązujące przepisy prawa
                            polskiego, w szczególności Kodeksu cywilnego oraz
                            Ustawy o prawach konsumenta.
                        </li>
                    </ul>
                    <div className="mt-12 text-sm text-gray-500">
                        Regulamin obowiązuje od dnia:{' '}
                        {new Date().toLocaleDateString('pl-PL')}
                    </div>
                </article>
            </div>
        </PublicLayout>
    );
}
