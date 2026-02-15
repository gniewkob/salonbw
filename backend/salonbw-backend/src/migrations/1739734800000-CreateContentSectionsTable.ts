import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateContentSectionsTable1739734800000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'content_sections',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'key',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'data',
                        type: 'jsonb',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Seed initial data from config/content.ts
        await queryRunner.query(`
            INSERT INTO content_sections (key, data, description) VALUES
            ('business_info', '{
                "name": "Salon Black & White",
                "tagline": "Akademia Zdrowych Włosów",
                "address": {
                    "street": "ul. Webera 1a/13",
                    "city": "Bytom",
                    "postalCode": "41-902",
                    "full": "ul. Webera 1a/13, 41-902 Bytom"
                },
                "coordinates": {
                    "lat": 50.348641,
                    "lng": 18.921429
                },
                "contact": {
                    "phone": "+48 XXX XXX XXX",
                    "email": "kontakt@salon-bw.pl"
                },
                "hours": {
                    "mondayFriday": "10:00 - 19:00",
                    "saturday": "9:00 - 15:00",
                    "sunday": "Zamknięte"
                },
                "social": {
                    "facebook": "https://www.facebook.com/Salon.Fryzjerski.Black.And.White",
                    "instagram": "https://www.instagram.com/salon_bw",
                    "twitter": "https://twitter.com/salon_bw"
                },
                "booking": {
                    "url": "/appointments",
                    "text": "Umów wizytę"
                }
            }', 'Podstawowe informacje o salonie'),

            ('hero_slides', '[
                {
                    "id": 1,
                    "title": "Witamy w Akademii Zdrowych Włosów Black & White",
                    "description": "Naszym celem jest dostarczanie najwyższej jakości usług fryzjerskich i dbanie o zdrowie Twoich włosów.",
                    "image": "/images/hero/slider1.jpg",
                    "alt": "Wnętrze salonu Black & White - profesjonalne stanowisko fryzjerskie"
                },
                {
                    "id": 2,
                    "title": "Nowoczesna Stylizacja",
                    "description": "Oferując różnorodność fryzur zgodnych z najnowszymi trendami, dbamy o to, by każdy klient wyszedł z salonem z uśmiechem.",
                    "image": "/images/hero/slider2.jpg",
                    "alt": "Nowoczesne fryzury i stylizacje w salonie Black & White"
                },
                {
                    "id": 3,
                    "title": "Serdecznie Zapraszamy",
                    "description": "Zapoznaj się z naszą ofertą i umów się na wizytę. Czekamy na Ciebie!",
                    "image": "/images/hero/slider3.jpg",
                    "alt": "Zaproszenie do salonu fryzjerskiego Black & White w Bytomiu"
                }
            ]', 'Slajdy hero na stronie głównej'),

            ('founder_message', '{
                "name": "Aleksandra Bodora",
                "quote": "Od wielu lat stale podnoszę swoje kwalifikacje oraz jakość moich usług, dzięki temu mam stałych zadowolonych klientów. Dołącz do nich i ciesz się pięknem swoich włosów!",
                "photo": "/images/founder/aleksandra-bodora.jpg"
            }', 'Wiadomość od założycielki'),

            ('history_items', '[
                {
                    "id": "historia",
                    "title": "Historia salonu",
                    "content": "Przez ponad 30 lat zdobywałam kompetencje w technikach strzyżenia oraz koloryzacji. Nauczyłam się, że nieodłączną częścią pracy fryzjera jest praca z ludźmi i spełnianie ich fantazji o pięknych włosach. Dzięki tym doświadczeniom, poznając różnorodne oczekiwania klientów, powstała wizja miejsca w którym każdy klient znalazłby usługę dostosowaną do indywidualnych potrzeb, dostarczoną w profesjonalny sposób oraz będzie to dla niego chwila prawdziwego relaksu."
                },
                {
                    "id": "poczatek",
                    "title": "Początek",
                    "content": "W 2011 roku udało mi się zrealizować moje marzenie o takim właśnie miejscu. Salon Black & White urządziłam według własnego projektu bazując na nowoczesnym ale też komfortowym stylu."
                },
                {
                    "id": "wartosci",
                    "title": "Nasze Wartości",
                    "content": "W naszym salonie kierujemy się sześcioma kluczowymi wartościami: pasją i kreatywnością, profesjonalizmem i doskonałością, indywidualnym podejściem, zadowoleniem klienta, higieną i bezpieczeństwem oraz zaangażowaniem w środowisko."
                }
            ]', 'Sekcje historii salonu')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('content_sections');
    }
}
