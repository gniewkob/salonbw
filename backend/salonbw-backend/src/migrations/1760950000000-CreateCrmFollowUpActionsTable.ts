import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCrmFollowUpActionsTable1760950000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'crm_follow_up_actions',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'customerId',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'appointmentId',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'candidateReason',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '32',
                        isNullable: false,
                    },
                    {
                        name: 'note',
                        type: 'varchar',
                        length: '300',
                        isNullable: true,
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
            'crm_follow_up_actions',
            new TableIndex({
                name: 'IDX_CRM_FOLLOW_UP_ACTIONS_CUSTOMER_ID',
                columnNames: ['customerId'],
            }),
        );

        await queryRunner.createIndex(
            'crm_follow_up_actions',
            new TableIndex({
                name: 'IDX_CRM_FOLLOW_UP_ACTIONS_APPOINTMENT_ID',
                columnNames: ['appointmentId'],
            }),
        );

        await queryRunner.createIndex(
            'crm_follow_up_actions',
            new TableIndex({
                name: 'IDX_CRM_FOLLOW_UP_ACTIONS_OCCURRED_AT',
                columnNames: ['occurredAt'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'crm_follow_up_actions',
            'IDX_CRM_FOLLOW_UP_ACTIONS_OCCURRED_AT',
        );
        await queryRunner.dropIndex(
            'crm_follow_up_actions',
            'IDX_CRM_FOLLOW_UP_ACTIONS_APPOINTMENT_ID',
        );
        await queryRunner.dropIndex(
            'crm_follow_up_actions',
            'IDX_CRM_FOLLOW_UP_ACTIONS_CUSTOMER_ID',
        );
        await queryRunner.dropTable('crm_follow_up_actions');
    }
}
