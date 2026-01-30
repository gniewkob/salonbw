import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserCRMFields1710012000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('users', [
            new TableColumn({
                name: 'firstName',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'lastName',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'birthDate',
                type: 'date',
                isNullable: true,
            }),
            new TableColumn({
                name: 'gender',
                type: 'varchar',
                length: '10',
                isNullable: true,
            }),
            new TableColumn({
                name: 'address',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'city',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'postalCode',
                type: 'varchar',
                length: '20',
                isNullable: true,
            }),
            new TableColumn({
                name: 'description',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'smsConsent',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'emailConsent',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'gdprConsent',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'gdprConsentDate',
                type: 'timestamp',
                isNullable: true,
            }),
            new TableColumn({
                name: 'createdAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updatedAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('users', [
            'firstName',
            'lastName',
            'birthDate',
            'gender',
            'address',
            'city',
            'postalCode',
            'description',
            'smsConsent',
            'emailConsent',
            'gdprConsent',
            'gdprConsentDate',
            'createdAt',
            'updatedAt',
        ]);
    }
}
