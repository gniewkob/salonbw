import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSmsTables1710017000000 implements MigrationInterface {
    name = 'CreateSmsTables1710017000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create message_templates table
        await queryRunner.createTable(
            new Table({
                name: 'message_templates',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: [
                            'appointment_reminder',
                            'appointment_confirmation',
                            'appointment_cancellation',
                            'birthday_wish',
                            'follow_up',
                            'marketing',
                            'custom',
                        ],
                        default: "'custom'",
                    },
                    {
                        name: 'channel',
                        type: 'enum',
                        enum: ['sms', 'email', 'whatsapp'],
                        default: "'sms'",
                    },
                    {
                        name: 'content',
                        type: 'text',
                    },
                    {
                        name: 'subject',
                        type: 'varchar',
                        length: '200',
                        isNullable: true,
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
                        name: 'isDefault',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'availableVariables',
                        type: 'text',
                        isNullable: true,
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

        // Create sms_logs table
        await queryRunner.createTable(
            new Table({
                name: 'sms_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'recipient',
                        type: 'varchar',
                        length: '20',
                    },
                    {
                        name: 'channel',
                        type: 'enum',
                        enum: ['sms', 'email', 'whatsapp'],
                        default: "'sms'",
                    },
                    {
                        name: 'content',
                        type: 'text',
                    },
                    {
                        name: 'subject',
                        type: 'varchar',
                        length: '200',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'sent', 'delivered', 'failed', 'rejected'],
                        default: "'pending'",
                    },
                    {
                        name: 'externalId',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'errorMessage',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'partsCount',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'cost',
                        type: 'decimal',
                        precision: 10,
                        scale: 4,
                        default: 0,
                    },
                    {
                        name: 'templateId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'recipientId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'appointmentId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'sentById',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'sentAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'deliveredAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                indices: [
                    { columnNames: ['recipient'] },
                    { columnNames: ['status'] },
                    { columnNames: ['recipientId'] },
                    { columnNames: ['appointmentId'] },
                    { columnNames: ['createdAt'] },
                ],
            }),
            true,
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'sms_logs',
            new TableForeignKey({
                columnNames: ['templateId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'message_templates',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'sms_logs',
            new TableForeignKey({
                columnNames: ['recipientId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'sms_logs',
            new TableForeignKey({
                columnNames: ['appointmentId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'appointments',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'sms_logs',
            new TableForeignKey({
                columnNames: ['sentById'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );

        // Insert default templates
        await queryRunner.query(`
            INSERT INTO message_templates (name, type, channel, content, "isDefault", "availableVariables")
            VALUES
            (
                'Przypomnienie o wizycie',
                'appointment_reminder',
                'sms',
                'Przypominamy o wizycie {{date}} o {{time}}. Usługa: {{service_name}}. {{salon_name}}',
                true,
                'client_name,service_name,date,time,employee_name,salon_name,salon_phone'
            ),
            (
                'Potwierdzenie rezerwacji',
                'appointment_confirmation',
                'sms',
                'Twoja wizyta została potwierdzona na {{date}} o {{time}}. {{service_name}} u {{employee_name}}. {{salon_name}}',
                true,
                'client_name,service_name,date,time,employee_name,salon_name,salon_phone'
            ),
            (
                'Anulowanie wizyty',
                'appointment_cancellation',
                'sms',
                'Wizyta {{date}} o {{time}} została anulowana. Zapraszamy do ponownej rezerwacji. {{salon_name}}',
                true,
                'client_name,service_name,date,time,employee_name,salon_name,salon_phone'
            ),
            (
                'Życzenia urodzinowe',
                'birthday_wish',
                'sms',
                'Wszystkiego najlepszego z okazji urodzin! {{salon_name}} życzy Ci wspaniałego dnia!',
                true,
                'client_name,salon_name,salon_phone'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        const smsLogsTable = await queryRunner.getTable('sms_logs');
        if (smsLogsTable) {
            const foreignKeys = smsLogsTable.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('sms_logs', fk);
            }
        }

        // Drop tables
        await queryRunner.dropTable('sms_logs', true);
        await queryRunner.dropTable('message_templates', true);
    }
}
