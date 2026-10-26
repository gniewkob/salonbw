import { DataSource, QueryRunner } from 'typeorm';
import {
    deletionOrder,
    execute,
    plan,
    retained,
} from '../../../scripts/cleanup-production-synthetic';

it('deletes children before parents and rejects cycles', () => {
    const selection = new Map([
        ['users', new Set(['u'])],
        ['appointments', new Set(['a'])],
        ['reviews', new Set(['r'])],
    ]);
    const edge = (child: string, parent: string) => ({
        child,
        parent,
        column: 'parentId',
        parentColumn: 'id',
        width: 1,
    });
    expect(
        deletionOrder(
            {
                tables: [...selection.keys()],
                edges: [
                    edge('appointments', 'users'),
                    edge('reviews', 'appointments'),
                ],
            },
            selection,
        ),
    ).toEqual(['reviews', 'appointments', 'users']);
    expect(() =>
        deletionOrder(
            {
                tables: ['users', 'appointments'],
                edges: [
                    edge('appointments', 'users'),
                    edge('users', 'appointments'),
                ],
            },
            selection,
        ),
    ).toThrow();
});

const url = process.env.CLEANUP_TEST_DATABASE_URL;
(url ? describe : describe.skip)(
    'mixed-data production cleanup, disposable PostgreSQL',
    () => {
        let db: DataSource;
        let runner: QueryRunner;
        beforeAll(async () => {
            const parsed = new URL(url!);
            if (
                !['localhost', '127.0.0.1'].includes(parsed.hostname) ||
                parsed.pathname !== '/cleanup_synthetic'
            )
                throw Error('Disposable database required');
            db = new DataSource({ type: 'postgres', url, logging: false });
            await db.initialize();
        });
        beforeEach(async () => {
            await db.query('DROP SCHEMA public CASCADE');
            await db.query('CREATE SCHEMA public');
            await db.query(`CREATE TABLE users(id serial PRIMARY KEY,role text NOT NULL,name text NOT NULL,email text NOT NULL,"isSystemAdmin" boolean DEFAULT false);
            CREATE TABLE services(id serial PRIMARY KEY,name text);
            CREATE TABLE "query-result-cache"(id serial PRIMARY KEY,query text,result text);
            CREATE TABLE appointments(id serial PRIMARY KEY,"clientId" int REFERENCES users(id),"employeeId" int REFERENCES users(id),"serviceId" int REFERENCES services(id));
            CREATE TABLE reviews(id serial PRIMARY KEY,"appointmentId" int REFERENCES appointments(id) ON DELETE SET NULL,"clientId" int REFERENCES users(id),comment text);
            CREATE TABLE import_source_links(id serial PRIMARY KEY,source text,entity text,"externalId" text,"localId" int);
            CREATE TABLE product_categories(id serial PRIMARY KEY,name text);
            CREATE TABLE products(id serial PRIMARY KEY,sku text,name text,"categoryId" int REFERENCES product_categories(id) ON DELETE SET NULL);
            CREATE TABLE product_sales(id serial PRIMARY KEY,"productId" int REFERENCES products(id) ON DELETE RESTRICT,"appointmentId" int REFERENCES appointments(id) ON DELETE SET NULL);
            CREATE TABLE refresh_tokens(id serial PRIMARY KEY,"userId" int REFERENCES users(id) ON DELETE CASCADE);
            CREATE TABLE customer_files(id serial PRIMARY KEY,"customerId" int REFERENCES users(id) ON DELETE CASCADE);
            CREATE TABLE fixture_dependencies(token text PRIMARY KEY,"userId" int REFERENCES users(id) ON DELETE CASCADE);
            INSERT INTO users(role,name,email) VALUES ('admin','Owner fixture','owner@fixture.invalid'),('client','Imported fixture','imported@fixture.invalid'),('client','SYNTHETIC Client','synthetic.client.01@example.invalid'),('client','E2E Testowa','e2e@example.invalid'),('admin','SYNTHETIC technical label','tech@fixture.invalid');
            INSERT INTO services(name) VALUES ('Public catalog fixture');
            INSERT INTO "query-result-cache"(query,result)VALUES('fixture aggregate','cached synthetic summary');
            INSERT INTO appointments("clientId","employeeId","serviceId") VALUES(2,1,1),(3,1,1);
            INSERT INTO reviews("appointmentId","clientId",comment) VALUES(1,2,'Imported fixture'),(2,3,'SYNTHETIC fixture');
            INSERT INTO import_source_links(source,entity,"externalId","localId") VALUES('booksy','client','external-client',2),('booksy','appointment','external-visit',1),('booksy','review','external-review',1);
            INSERT INTO product_categories(name) VALUES('Public catalog'),('SYNTHETIC Category');
            INSERT INTO products(sku,name,"categoryId") VALUES('REAL-FIXTURE','Real fixture',1),('SYNTH-001','SYNTHETIC Product',2);
            INSERT INTO product_sales("productId","appointmentId") VALUES(2,2);
            INSERT INTO refresh_tokens("userId") VALUES(4);
            INSERT INTO fixture_dependencies(token,"userId") VALUES('dependent-fixture',3);`);
            runner = db.createQueryRunner();
            await runner.connect();
        });
        afterEach(async () => {
            await runner.query('ROLLBACK');
            await runner.release();
        });
        afterAll(async () => {
            await db.destroy();
        });
        it('plans in READ ONLY and includes descendants without selecting real records or administrators', async () => {
            await runner.query('BEGIN READ ONLY');
            const result = await plan(runner);
            expect(result.counts).toMatchObject({
                'query-result-cache': 1,
                users: 2,
                appointments: 1,
                reviews: 1,
                products: 1,
                product_categories: 1,
                product_sales: 1,
                refresh_tokens: 1,
                fixture_dependencies: 1,
            });
            await expect(runner.query('DELETE FROM users')).rejects.toThrow();
        });
        it('commits precisely the manifest, preserves all retained row content and is idempotent', async () => {
            await runner.query('BEGIN');
            const before = await plan(runner);
            const result = await execute(runner, before.digest);
            expect(result.retainedDataUnchanged).toBe(true);
            await runner.query('COMMIT');
            expect(
                await db.query('SELECT count(*)::int AS n FROM users'),
            ).toEqual([{ n: 3 }]);
            expect(
                await db.query('SELECT count(*)::int AS n FROM appointments'),
            ).toEqual([{ n: 1 }]);
            expect(
                await db.query(
                    'SELECT count(*)::int AS n FROM import_source_links',
                ),
            ).toEqual([{ n: 3 }]);
            await runner.query('BEGIN');
            const next = await plan(runner);
            expect(next.counts).toEqual({});
            expect((await execute(runner, next.digest)).deleted).toEqual({});
        });
        it('rejects a changed plan before deletion', async () => {
            await runner.query('BEGIN');
            const before = await plan(runner);
            await runner.query(
                `INSERT INTO services(name)VALUES('New retained record')`,
            );
            await expect(execute(runner, before.digest)).rejects.toThrow(
                'Plan changed',
            );
            expect(
                (await runner.query('SELECT count(*)::int AS n FROM users'))[0]
                    .n,
            ).toBe(5);
        });
        it.each([
            ['client', 3],
            ['appointment', 2],
            ['review', 2],
        ])(
            'protects linked %s records regardless of synthetic markers',
            async (entity, id) => {
                await runner.query('BEGIN');
                await runner.query(
                    'INSERT INTO import_source_links(source,entity,"externalId","localId") VALUES($1,$2,$3,$4)',
                    ['booksy', entity, 'protected-fixture', id],
                );
                await expect(plan(runner)).rejects.toThrow(
                    'Imported record selected',
                );
            },
        );
        it('rejects an unmarked product below a synthetic category', async () => {
            await runner.query('BEGIN');
            await runner.query(`UPDATE products SET "categoryId"=2 WHERE id=1`);
            await expect(plan(runner)).rejects.toThrow(
                'Mixed real/synthetic dependency',
            );
        });
        it('rejects a synthetic-product sale attached to a retained real appointment', async () => {
            await runner.query('BEGIN');
            await runner.query('UPDATE product_sales SET "appointmentId"=1');
            await expect(plan(runner)).rejects.toThrow('retained appointment');
        });
        it('requires a storage manifest when synthetic customers have private files', async () => {
            await runner.query('BEGIN');
            await runner.query(
                'INSERT INTO customer_files("customerId")VALUES(3)',
            );
            await expect(plan(runner)).rejects.toThrow('storage manifest');
        });
        it('detects unexpected trigger effects and rolls the entire cleanup back', async () => {
            await db.query(`CREATE FUNCTION modify_retained() RETURNS trigger AS $$ BEGIN UPDATE services SET name='Unexpected mutation'; RETURN OLD; END; $$ LANGUAGE plpgsql;
            CREATE TRIGGER fixture_side_effect BEFORE DELETE ON products FOR EACH ROW EXECUTE FUNCTION modify_retained();`);
            await runner.query('BEGIN');
            const before = await plan(runner);
            await expect(execute(runner, before.digest)).rejects.toThrow(
                'Retained data changed',
            );
            await runner.query('ROLLBACK');
            expect(
                (await db.query('SELECT count(*)::int AS n FROM users'))[0].n,
            ).toBe(5);
            expect((await db.query('SELECT name FROM services'))[0].name).toBe(
                'Public catalog fixture',
            );
            const empty = new Map(
                before.structure.tables.map((t) => [t, new Set<string>()]),
            );
            expect(
                await retained(runner, before.structure, empty),
            ).toBeDefined();
        });
    },
);
