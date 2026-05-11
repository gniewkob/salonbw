import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReceptionOperationalEventsTable1760940000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'reception_operational_events',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'eventName',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'appointmentId',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'customerId',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'customerAlertSeverity',
                        type: 'varchar',
                        length: '16',
                        isNullable: true,
                    },
                    {
                        name: 'source',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'occurredAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );

        await queryRunner.createIndex(
            'reception_operational_events',
            new TableIndex({
                name: 'IDX_RECEPTION_OPERATIONAL_EVENTS_APPOINTMENT_ID',
                columnNames: ['appointmentId'],
            }),
        );

        await queryRunner.createIndex(
            'reception_operational_events',
            new TableIndex({
                name: 'IDX_RECEPTION_OPERATIONAL_EVENTS_OCCURRED_AT',
                columnNames: ['occurredAt'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'reception_operational_events',
            'IDX_RECEPTION_OPERATIONAL_EVENTS_OCCURRED_AT',
        );
        await queryRunner.dropIndex(
            'reception_operational_events',
            'IDX_RECEPTION_OPERATIONAL_EVENTS_APPOINTMENT_ID',
        );
        await queryRunner.dropTable('reception_operational_events');
    }
}
