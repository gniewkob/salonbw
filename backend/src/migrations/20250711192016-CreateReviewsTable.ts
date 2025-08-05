import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateReviewsTable20250711192016 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'review',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'appointmentId', type: 'int' },
                    { name: 'authorId', type: 'int' },
                    { name: 'employeeId', type: 'int' },
                    { name: 'rating', type: 'int' },
                    { name: 'comment', type: 'varchar', length: '500', isNullable: true },
                    { name: 'createdAt', type: 'timestamp', default: 'now()' },
                ],
                indices: [{ columnNames: ['appointmentId'], isUnique: true }],
            }),
        );
        await queryRunner.createForeignKeys('review', [
            new TableForeignKey({
                columnNames: ['appointmentId'],
                referencedTableName: 'appointment',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
                columnNames: ['authorId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
                columnNames: ['employeeId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('review');
    }
}
