import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddCommissionsAndCommunications20250711192015 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'employee_commission',
                columns: [
                    { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                    { name: 'employeeId', type: 'int' },
                    { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
                    { name: 'percent', type: 'float' },
                    { name: 'createdAt', type: 'timestamp', default: 'now()' },
                ],
                indices: [
                    { columnNames: ['employeeId'] },
                ],
            }),
        );
        await queryRunner.createForeignKey(
            'employee_commission',
            new TableForeignKey({
                columnNames: ['employeeId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'communication',
                columns: [
                    { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                    { name: 'customerId', type: 'int', isNullable: true },
                    { name: 'medium', type: 'varchar' },
                    { name: 'content', type: 'text' },
                    { name: 'timestamp', type: 'timestamp', default: 'now()' },
                ],
                indices: [
                    { columnNames: ['customerId'] },
                    { columnNames: ['medium'] },
                ],
            }),
        );
        await queryRunner.createForeignKey(
            'communication',
            new TableForeignKey({
                columnNames: ['customerId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('communication');
        await queryRunner.dropTable('employee_commission');
    }
}
