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
                    { name: 'reservationId', type: 'int' },
                    { name: 'clientId', type: 'int' },
                    { name: 'rating', type: 'int' },
                    { name: 'comment', type: 'text', isNullable: true },
                    { name: 'createdAt', type: 'timestamp', default: 'now()' },
                ],
                indices: [{ columnNames: ['reservationId'], isUnique: true }],
            }),
        );
        await queryRunner.createForeignKeys('review', [
            new TableForeignKey({
                columnNames: ['reservationId'],
                referencedTableName: 'appointment',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
                columnNames: ['clientId'],
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
