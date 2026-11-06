import { useState, type FormEvent } from 'react';
import Modal from '@/components/Modal';
import {
    useCreateCustomerTag,
    useCustomerTags,
    useUpdateCustomerTag,
} from '@/hooks/useCustomers';
import type { CustomerTag } from '@/types';
import styles from '@/styles/V18CustomerGroupsManager.module.css';

type Props = {
    onClose: () => void;
};

const DEFAULT_COLOR = '#67538a';

const cleanName = (name: string) => name.trim().toLocaleLowerCase('pl-PL');

/**
 * Admin-only catalog operations backed by the existing customer-tags API.
 * Editing preserves tag identity and all current customer assignments.
 * Global delete is intentionally excluded because it affects many customers.
 */
export default function V18CustomerTagCatalog({ onClose }: Props) {
    const {
        data: tags = [],
        isLoading,
        isError,
        refetch,
    } = useCustomerTags();
    const create = useCreateCustomerTag();
    const update = useUpdateCustomerTag();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const busy = create.isPending || update.isPending;
    const trimmedName = name.trim();
    const duplicated = tags.some(
        (tag) =>
            tag.id !== editingId &&
            cleanName(tag.name) === cleanName(trimmedName),
    );
    const validColor = /^#[0-9a-fA-F]{6}$/.test(color);
    const canSave =
        !busy &&
        !isLoading &&
        !isError &&
        trimmedName.length > 0 &&
        trimmedName.length <= 60 &&
        !duplicated &&
        validColor;
    const orderedTags = [...tags].sort((a, b) =>
        a.name.localeCompare(b.name, 'pl'),
    );

    const startCreate = () => {
        setEditingId(null);
        setName('');
        setColor(DEFAULT_COLOR);
        setError('');
        setSuccess('');
    };

    const startEdit = (tag: CustomerTag) => {
        setEditingId(tag.id);
        setName(tag.name);
        setColor(
            tag.color && /^#[0-9a-fA-F]{6}$/.test(tag.color)
                ? tag.color
                : DEFAULT_COLOR,
        );
        setError('');
        setSuccess('');
    };

    const close = () => {
        if (!busy) onClose();
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSave) return;

        setError('');
        setSuccess('');
        try {
            const data = { name: trimmedName, color };
            if (editingId === null) {
                await create.mutateAsync(data);
                setSuccess('Tag został dodany do katalogu.');
            } else {
                await update.mutateAsync({ id: editingId, data });
                setSuccess('Definicja tagu została zapisana.');
            }
            // Both hooks invalidate the shared catalog and customer tag lists.
            setEditingId(null);
            setName('');
            setColor(DEFAULT_COLOR);
        } catch {
            setError(
                'Nie udało się zapisać tagu. Sprawdź nazwę i spróbuj ponownie.',
            );
        }
    };

    return (
        <Modal open size="lg" onClose={close}>
            <section
                className={styles.manager}
                aria-label="Zarządzanie katalogiem tagów klientów"
            >
                <div className={styles.heading}>
                    <div>
                        <span className={styles.eyebrow}>
                            Salon Black &amp; White · CRM
                        </span>
                        <h2>Tagi klientów</h2>
                        <p>
                            Edytuj wspólne nazwy i kolory tagów. Przypisania
                            klientów pozostają zachowane.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={close}
                        aria-label="Zamknij katalog tagów"
                    >
                        Zamknij
                    </button>
                </div>

                {error ? (
                    <p role="alert" className={styles.error}>
                        {error}
                    </p>
                ) : null}
                {success ? (
                    <p role="status" className={styles.success}>
                        {success}
                    </p>
                ) : null}
                {isError ? (
                    <div role="alert" className={styles.error}>
                        Nie udało się pobrać katalogu tagów.
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => void refetch()}
                        >
                            Ponów pobieranie
                        </button>
                    </div>
                ) : null}

                <div className={styles.columns}>
                    <div className={styles.listPanel}>
                        <div className={styles.sectionHeading}>
                            <h3>Istniejące tagi</h3>
                            <span>{tags.length}</span>
                        </div>
                        {isLoading ? (
                            <p role="status">Ładowanie tagów…</p>
                        ) : orderedTags.length === 0 ? (
                            <p>Nie ma jeszcze tagów klientów.</p>
                        ) : (
                            <ul className={styles.groupList}>
                                {orderedTags.map((tag) => (
                                    <li
                                        key={tag.id}
                                        className={styles.groupRow}
                                    >
                                        <span
                                            className={styles.swatch}
                                            style={{
                                                backgroundColor:
                                                    tag.color ?? DEFAULT_COLOR,
                                            }}
                                            aria-hidden="true"
                                        />
                                        <div className={styles.groupDetails}>
                                            <strong>{tag.name}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.secondary}
                                            disabled={busy || isError}
                                            aria-label={
                                                'Edytuj tag ' + tag.name
                                            }
                                            onClick={() => startEdit(tag)}
                                        >
                                            Edytuj
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <form
                        className={styles.form}
                        onSubmit={(event) => void save(event)}
                    >
                        <div className={styles.sectionHeading}>
                            <h3>
                                {editingId === null
                                    ? 'Nowy tag'
                                    : 'Edycja tagu'}
                            </h3>
                            {editingId !== null ? (
                                <button
                                    type="button"
                                    className={styles.secondary}
                                    disabled={busy}
                                    onClick={startCreate}
                                >
                                    Nowy tag
                                </button>
                            ) : null}
                        </div>
                        <label className={styles.field}>
                            <span>Nazwa tagu</span>
                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                maxLength={60}
                                placeholder="np. Koloryzacja"
                                required
                                disabled={busy || isError}
                            />
                        </label>
                        <label className={styles.colorField}>
                            <span>Kolor tagu</span>
                            <input
                                type="color"
                                value={color}
                                onChange={(event) =>
                                    setColor(event.target.value)
                                }
                                disabled={busy || isError}
                            />
                        </label>
                        {duplicated && trimmedName ? (
                            <p role="status" className={styles.hint}>
                                Tag o tej nazwie już istnieje w katalogu.
                            </p>
                        ) : null}
                        <button
                            type="submit"
                            className={styles.primary}
                            disabled={!canSave}
                        >
                            {busy
                                ? 'Zapisywanie…'
                                : editingId === null
                                  ? 'Utwórz tag'
                                  : 'Zapisz tag'}
                        </button>
                    </form>
                </div>
                <p className={styles.hint}>
                    Zmiana nazwy i koloru nie usuwa tagów przypisanych
                    klientom. Globalne usuwanie tagów nie jest dostępne
                    w tym pilotażu.
                </p>
            </section>
        </Modal>
    );
}
