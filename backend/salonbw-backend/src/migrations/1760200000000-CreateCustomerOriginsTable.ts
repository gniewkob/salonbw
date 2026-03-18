import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerOriginsTable1760200000000
    implements MigrationInterface
{
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS customer_origins (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_system BOOLEAN NOT NULL DEFAULT FALSE,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS customer_origins_name_unique
            ON customer_origins (name)
        `);

        await queryRunner.query(`
            INSERT INTO customer_origins (name, is_system, sort_order) VALUES
                ('Facebook', TRUE, 1),
                ('Polecenie przez innego klienta', TRUE, 2),
                ('Portal Booksy', TRUE, 3),
                ('Portal moment.pl', TRUE, 4),
                ('Przechodzień', TRUE, 5),
                ('Reklama w internecie', TRUE, 6),
                ('Reklama w prasie', TRUE, 7),
                ('Tablica reklamowa/banner', TRUE, 8),
                ('Ulotki', TRUE, 9),
                ('Zakupy grupowe', TRUE, 10)
            ON CONFLICT (name) DO NOTHING
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS customer_origins`);
    }
}
