import { DataSource, In } from 'typeorm';
import { ContentSection } from '../../content/entities/content-section.entity';

export default class ContentSectionsSeed {
    async run(dataSource: DataSource): Promise<void> {
        const repo = dataSource.getRepository(ContentSection);

        const sections = [
            {
                key: 'HERO_SLIDES',
                description: 'Hero slider na stronie głównej',
                data: [
                    {
                        id: 1,
                        title: 'Witamy w Akademii Zdrowych Włosów Black & White',
                        description:
                            'Naszym celem jest dostarczanie najwyższej jakości usług fryzjerskich i dbanie o zdrowie Twoich włosów.',
                        image: '/images/hero/slider1.jpg',
                        alt: 'Wnętrze salonu Black & White - profesjonalne stanowisko fryzjerskie',
                    },
                    {
                        id: 2,
                        title: 'Nowoczesna Stylizacja',
                        description:
                            'Oferując różnorodność fryzur zgodnych z najnowszymi trendami, dbamy o to, by każdy klient wyszedł z salonem z uśmiechem.',
                        image: '/images/hero/slider2.jpg',
                        alt: 'Nowoczesne fryzury i stylizacje w salonie Black & White',
                    },
                    {
                        id: 3,
                        title: 'Serdecznie Zapraszamy',
                        description:
                            'Zapoznaj się z naszą ofertą i umów się na wizytę. Czekamy na Ciebie!',
                        image: '/images/hero/slider3.jpg',
                        alt: 'Zaproszenie do salonu fryzjerskiego Black & White w Bytomiu',
                    },
                ],
            },
            {
                key: 'FOUNDER_MESSAGE',
                description: 'Wiadomość od założycielki salonu',
                data: {
                    name: 'Aleksandra Bodora',
                    quote: 'Od wielu lat stale podnoszę swoje kwalifikacje oraz jakość moich usług, dzięki temu mam stałych zadowolonych klientów. Dołącz do nich i ciesz się pięknem swoich włosów!',
                    photo: '/images/founder/aleksandra-bodora.jpg',
                },
            },
            {
                key: 'HISTORY_ITEMS',
                description: 'Historia salonu - elementy akordeonu',
                data: [
                    {
                        id: 'historia',
                        title: 'Historia salonu',
                        content:
                            'Przez ponad 30 lat zdobywałam kompetencje w technikach strzyżenia oraz koloryzacji. Nauczyłam się, że nieodłączną częścią pracy fryzjera jest praca z ludźmi i spełnianie ich fantazji o pięknych włosach. Dzięki tym doświadczeniom, poznając różnorodne oczekiwania klientów, powstała wizja miejsca w którym każdy klient znalazłby usługę dostosowaną do indywidualnych potrzeb, dostarczoną w profesjonalny sposób oraz będzie to dla niego chwila prawdziwego relaksu.',
                    },
                    {
                        id: 'poczatek',
                        title: 'Początek',
                        content:
                            'W 2011 roku udało mi się zrealizować moje marzenie o takim właśnie miejscu. Salon Black & White urządziłam według własnego projektu bazując na nowoczesnym ale też komfortowym stylu.',
                    },
                    {
                        id: 'wartosci',
                        title: 'Nasze Wartości',
                        content:
                            'W naszym salonie kierujemy się sześcioma kluczowymi wartościami: pasją i kreatywnością, profesjonalizmem i doskonałością, indywidualnym podejściem, zadowoleniem klienta, higieną i bezpieczeństwem oraz zaangażowaniem w środowisko.',
                    },
                ],
            },
            {
                key: 'CORE_VALUES',
                description: 'Sześć filarów wartości salonu',
                data: [
                    {
                        id: 'pasja',
                        title: 'Pasja i Kreatywność',
                        icon: '🎨',
                        description:
                            'W naszym salonie fryzjerskim wkładamy całe serce w to, co robimy. Nasza pasja do sztuki fryzjerskiej jest nieodłączną częścią naszej pracy. Jesteśmy kreatywni i otwarci na nowe trendy, dzięki czemu możemy stworzyć dla Ciebie wyjątkowe i niepowtarzalne fryzury, które podkreślą Twoją indywidualność.',
                    },
                    {
                        id: 'profesjonalizm',
                        title: 'Profesjonalizm i Doskonałość',
                        icon: '⭐',
                        description:
                            'W naszym zespole mamy doświadczonych fryzjerów, którzy są mistrzami swojego fachu. Stale doskonalimy swoje umiejętności, uczestnicząc w szkoleniach i śledząc najnowsze techniki i trendy fryzjerskie. Możesz mieć pewność, że otrzymasz usługę na najwyższym poziomie.',
                    },
                    {
                        id: 'indywidualne',
                        title: 'Indywidualne Podejście',
                        icon: '👤',
                        description:
                            'Wiemy, że każdy klient jest wyjątkowy. Dlatego zawsze słuchamy uważnie Twoich potrzeb i preferencji. Nasz zespół fryzjerów jest wyszkolony, aby zrozumieć Twoje oczekiwania i zaproponować rozwiązania dopasowane do Twojego stylu życia, osobowości i indywidualnych cech.',
                    },
                    {
                        id: 'zadowolenie',
                        title: 'Zadowolenie Klienta',
                        icon: '😊',
                        description:
                            'Twoje zadowolenie jest dla nas najważniejsze. Dlatego staramy się stworzyć przyjazną i komfortową atmosferę w naszym salonie. Chcemy, abyś czuł się jak w domu i opuszczał nasz salon z uśmiechem na twarzy.',
                    },
                    {
                        id: 'higiena',
                        title: 'Higiena i Bezpieczeństwo',
                        icon: '🛡️',
                        description:
                            'Twoje zdrowie i bezpieczeństwo są dla nas priorytetem. Przestrzegamy surowych standardów higieny i dbamy o to, aby nasz salon był czysty i bezpieczny. Wszystkie nasze narzędzia i sprzęt są starannie dezynfekowane.',
                    },
                    {
                        id: 'srodowisko',
                        title: 'Zaangażowanie w Środowisko',
                        icon: '🌱',
                        description:
                            'Jesteśmy świadomi wpływu, jaki nasza branża może mieć na środowisko. Dlatego podejmujemy działania mające na celu ograniczenie naszego śladu ekologicznego. Stosujemy produkty przyjazne dla środowiska i minimalizujemy odpady.',
                    },
                ],
            },
            {
                key: 'SALON_GALLERY',
                description: 'Galeria wnętrz salonu na stronie głównej',
                data: [
                    {
                        id: 1,
                        image: '/images/salon/salon1.jpg',
                        caption: 'Recepcja',
                        alt: 'Recepcja salonu Black & White',
                    },
                    {
                        id: 2,
                        image: '/images/salon/salon2.jpg',
                        caption: 'Fryzjerstwo',
                        alt: 'Stanowisko fryzjerskie w salonie',
                    },
                    {
                        id: 3,
                        image: '/images/salon/salon3.jpg',
                        caption: 'Stylizacja',
                        alt: 'Przestrzeń stylizacyjna',
                    },
                    {
                        id: 4,
                        image: '/images/salon/salon4.jpg',
                        caption: 'Pielęgnacja włosów',
                        alt: 'Strefa pielęgnacji włosów',
                    },
                    {
                        id: 5,
                        image: '/images/salon/salon5.jpg',
                        caption: 'Kosmetyka',
                        alt: 'Gabinet kosmetyczny',
                    },
                    {
                        id: 6,
                        image: '/images/salon/salon6.jpg',
                        caption: 'Strefa relaksu',
                        alt: 'Strefa relaksu dla klientów',
                    },
                    {
                        id: 7,
                        image: '/images/salon/salon7.jpg',
                        caption: 'Profesjonalne stanowisko',
                        alt: 'Profesjonalne stanowisko fryzjerskie',
                    },
                    {
                        id: 8,
                        image: '/images/salon/salon8.jpg',
                        caption: 'Wnętrze salonu',
                        alt: 'Eleganckie wnętrze salonu',
                    },
                ],
            },
        ];

        const sectionKeys = sections.map((s) => s.key);
        const existingSections = await repo.find({
            where: { key: In(sectionKeys) },
        });

        const existingKeys = new Set(existingSections.map((s) => s.key));
        const sectionsToCreate: ContentSection[] = [];

        for (const section of sections) {
            if (!existingKeys.has(section.key)) {
                sectionsToCreate.push(
                    repo.create({
                        key: section.key,
                        description: section.description,
                        data: section.data as Record<string, unknown>,
                        isActive: true,
                    }),
                );
            } else {
                console.log(`- Content section already exists: ${section.key}`);
            }
        }

        if (sectionsToCreate.length > 0) {
            await repo.save(sectionsToCreate);
            sectionsToCreate.forEach((s) => {
                console.log(`✓ Content section created: ${s.key}`);
            });
        }

        console.log('\n✓ Content sections seeding completed!');
    }
}
