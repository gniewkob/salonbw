import Link from 'next/link';
import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';
import { absUrl } from '@/utils/seo';

export default function PolicyPage() {
    return (
        <PublicLayout>
            <Head>
                <title>Regulamin Świadczenia Usług | Salon Black & White</title>
                <meta
                    name="description"
                    content="Regulamin świadczenia usług drogą elektroniczną oraz zasady korzystania z usług Salonu Fryzjerskiego Black & White."
                />
                <meta
                    property="og:title"
                    content="Regulamin Świadczenia Usług — Salon Black & White"
                />
                <meta
                    property="og:description"
                    content="Regulamin świadczenia usług drogą elektroniczną oraz zasady korzystania z usług Salonu Fryzjerskiego Black & White."
                />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="pl_PL" />
                <meta property="og:url" content={absUrl('/policy')} />
                <link rel="canonical" href={absUrl('/policy')} />
                <meta name="robots" content="index, follow" />
            </Head>
            <div className="legal-page">
                <article className="legal-article">
                    <p className="legal-eyebrow">Dokumenty prawne</p>
                    <h1 className="legal-h1">Regulamin Świadczenia Usług</h1>

                    <p className="legal-lead">
                        Niniejszy Regulamin określa ogólne warunki, zasady oraz
                        sposób świadczenia usług drogą elektroniczną przez Salon
                        Fryzjerski &quot;Black &amp; White&quot;, a także zasady
                        korzystania z systemu rezerwacji i świadczenia usług
                        kosmetyczno-fryzjerskich na miejscu.
                    </p>

                    <h2 className="legal-h2">1. Postanowienia Ogólne</h2>
                    <ol className="legal-list">
                        <li>
                            Właścicielem serwisu internetowego oraz systemu
                            rezerwacji jest{' '}
                            <strong>
                                Salon Fryzjerski Black&amp;White Aleksandra
                                Bodora
                            </strong>{' '}
                            z siedzibą w Radzionkowie (41-922), ul. Mikołaja
                            Kopernika 13, NIP: 626 223 11 81, tel. +48 723 588
                            868, zwany dalej &quot;Usługodawcą&quot;.
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
                    </ol>

                    <h2 className="legal-h2">2. Definicje</h2>
                    <ul className="legal-list">
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
                            adresem ul. Mikołaja Kopernika 13, Radzionków.
                        </li>
                    </ul>

                    <h2 className="legal-h2">
                        3. Usługi Świadczone Drogą Elektroniczną (System CRM)
                    </h2>
                    <ol className="legal-list">
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
                    </ol>

                    <h2 className="legal-h2">
                        4. Zasady Rezerwacji, Anulacji i Świadczenia Usług na
                        Miejscu
                    </h2>
                    <ol className="legal-list">
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
                            24 godziny przed zaplanowanym czasem jej
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
                    </ol>

                    <h2 className="legal-h2">
                        5. Tryb Postępowania Reklamacyjnego
                    </h2>
                    <ol className="legal-list">
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
                                className="legal-link"
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
                    </ol>

                    <h2 className="legal-h2">6. Postanowienia Końcowe</h2>
                    <ol className="legal-list">
                        <li>
                            Kwestie dotyczące ochrony danych osobowych, praw
                            Użytkownika, zbieranych logów i cookies znajdują się
                            w osobnym dokumencie na stronie{' '}
                            <Link href="/privacy" className="legal-link">
                                Polityka Prywatności
                            </Link>
                            .
                        </li>
                        <li>
                            W sprawach nieuregulowanych niniejszym Regulaminem
                            mają zastosowanie obowiązujące przepisy prawa
                            polskiego, w szczególności Kodeksu cywilnego oraz
                            Ustawy o prawach konsumenta.
                        </li>
                    </ol>

                    <div className="legal-date">
                        Regulamin obowiązuje od dnia:{' '}
                        {new Date().toLocaleDateString('pl-PL')}
                    </div>
                </article>
            </div>
        </PublicLayout>
    );
}
