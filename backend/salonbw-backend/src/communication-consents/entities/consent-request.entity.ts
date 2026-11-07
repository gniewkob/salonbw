import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Idempotency record: one row per (customer, Idempotency-Key). A replayed
 * request with the same key and payload returns the current state without
 * writing new events; the same key with a different payload is rejected.
 */
@Entity('consent_requests')
@Index('UQ_consent_requests_key', ['customerId', 'idempotencyKey'], {
    unique: true,
})
export class ConsentRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'customer_id', type: 'int' })
    customerId: number;

    @Column({ name: 'idempotency_key', type: 'varchar', length: 100 })
    idempotencyKey: string;

    @Column({ name: 'payload_hash', type: 'varchar', length: 64 })
    payloadHash: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
