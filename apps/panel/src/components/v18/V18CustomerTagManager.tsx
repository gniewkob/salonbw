import { useState, type FormEvent } from 'react';
import Modal from '@/components/Modal';
import {
    useAssignTags,
    useCreateCustomerTag,
    useCustomerTags,
    useRemoveTag,
    useTagsForCustomer,
} from '@/hooks/useCustomers';
import styles from '@/styles/V18CustomerTagManager.module.css';

type Props = {
    customerId: number;
    customerName: string;
    onClose: () => void;
    onChanged?: () => void;
};

/**
 * Uses existing CRM tag APIs. Assignment is additive: it does not remove
 * other tags from this customer. Global deletion is deliberately excluded.
 */
export default function V18CustomerTagManager({
    customerId,
    customerName,
    onClose,
    onChanged,
}: Props) {
    const {
        data: availableTags,
        isLoading: tagsLoading,
        isError: tagsError,
    } = useCustomerTags();
    const {
        data: assignedTags,
        isLoading: assignedLoading,
        isError: assignedError,
        refetch: reloadAssigned,
    } = useTagsForCustomer(customerId);
    const assign = useAssignTags();
    const remove = useRemoveTag();
    const create = useCreateCustomerTag();
    const [newTagName, setNewTagName] = useState('');
    const [error, setError] = useState('');
    const [workingId, setWorkingId] = useState<number | null>(null);
    const busy = assign.isPending || remove.isPending || create.isPending;
    const loading = tagsLoading || assignedLoading;
    const failed = tagsError || assignedError;
    const assignedIds = new Set((assignedTags ?? []).map((tag) => tag.id));
    const remainingTags = (availableTags ?? []).filter(
        (tag) => !assignedIds.has(tag.id),
    );
    const trimmed = newTagName.trim();
    const normalizedName = trimmed.toLocaleLowerCase('pl-PL');
    const alreadyExists = (availableTags ?? []).some(
        (tag) => tag.name.toLocaleLowerCase('pl-PL') === normalizedName,
    );

    const close = () => {
        if (!busy) onClose();
    };

    const addTag = async (tagId: number) => {
        if (busy || failed || assignedIds.has(tagId)) return;
        setError('');
        setWorkingId(tagId);
        try {
            await assign.mutateAsync({ customerId, tagIds: [tagId] });
            onChanged?.();
        } catch {
            setError('Nie udało się przypisać tagu. Spróbuj ponownie.');
        } finally {
            setWorkingId(null);
        }
    };

    const removeAssignedTag = async (tagId: number) => {
        if (busy || failed || !assignedIds.has(tagId)) return;
        setError('');
        setWorkingId(tagId);
        try {
            await remove.mutateAsync({ customerId, tagId });
            onChanged?.();
        } catch {
            setError('Nie udało się odpiąć tagu. Spróbuj ponownie.');
        } finally {
            setWorkingId(null);
        }
    };

    const createNewTag = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            busy ||
            failed ||
            !trimmed ||
            trimmed.length > 60 ||
            alreadyExists
        ) {
            return;
        }
        setError('');
        try {
            // Creating a shared tag does not automatically assign it.
            await create.mutateAsync({ name: trimmed });
            setNewTagName('');
        } catch {
            setError('Nie udało się utworzyć tagu. Spróbuj ponownie.');
        }
    };

    return (
        <Modal open onClose={close} size="md">
            <section
                className={styles.manager}
                aria-label="Zarządzanie tagami klienta"
            >
                <div className={styles.heading}>
                    <div>
                        <span className={styles.eyebrow}>
                            Salon Black &amp; White · CRM
                        </span>
                        <h2>Zarządzaj tagami</h2>
                        <p className={styles.description}>{customerName}</p>
                    </div>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={close}
                        disabled={busy}
                        aria-label="Zamknij zarządzanie tagami"
                    >
                        Zamknij
                    </button>
                </div>

                {error ? (
                    <p role="alert" className={styles.error}>
                        {error}
                    </p>
                ) : null}
                {failed ? (
                    <div role="alert" className={styles.error}>
                        Nie udało się pobrać tagów. Spróbuj ponownie później.
                        {assignedError ? (
                            <button
                                type="button"
                                onClick={() => void reloadAssigned()}
                            >
                                Ponów
                            </button>
                        ) : null}
                    </div>
                ) : null}

                <h3 className={styles.sectionTitle}>
                    Tagi przypisane klientowi
                </h3>
                {loading ? (
                    <p role="status" className={styles.muted}>
                        Ładowanie tagów…
                    </p>
                ) : (assignedTags?.length ?? 0) === 0 ? (
                    <p className={styles.muted}>
                        Ten klient nie ma przypisanych tagów.
                    </p>
                ) : (
                    <ul className={styles.tagList}>
                        {assignedTags?.map((tag) => (
                            <li key={tag.id} className={styles.tagRow}>
                                <span className={styles.tagLabel}>
                                    {tag.name}
                                </span>
                                <button
                                    type="button"
                                    disabled={busy || failed}
                                    onClick={() =>
                                        void removeAssignedTag(tag.id)
                                    }
                                    aria-label={
                                        'Usuń tag ' + tag.name + ' od klienta'
                                    }
                                >
                                    {remove.isPending && workingId === tag.id
                                        ? 'Usuwanie…'
                                        : 'Odepnij'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <h3 className={styles.sectionTitle}>Dodaj istniejący tag</h3>
                <div className={styles.availableList}>
                    {remainingTags.length > 0 ? (
                        remainingTags.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                className={styles.addTag}
                                disabled={busy || failed || loading}
                                onClick={() => void addTag(tag.id)}
                                aria-label={'Przypisz tag ' + tag.name}
                            >
                                <span aria-hidden="true">+</span> {tag.name}
                            </button>
                        ))
                    ) : (
                        <p className={styles.muted}>
                            {loading
                                ? 'Ładowanie dostępnych tagów…'
                                : 'Brak innych tagów.'}
                        </p>
                    )}
                </div>

                <form
                    className={styles.createForm}
                    onSubmit={(event) => void createNewTag(event)}
                >
                    <label htmlFor="v18-new-tag-name">
                        Nowy tag w katalogu CRM
                    </label>
                    <div className={styles.createRow}>
                        <input
                            id="v18-new-tag-name"
                            value={newTagName}
                            onChange={(event) =>
                                setNewTagName(event.target.value)
                            }
                            maxLength={60}
                            placeholder="Nazwa tagu"
                            disabled={busy || failed}
                        />
                        <button
                            type="submit"
                            disabled={
                                busy ||
                                failed ||
                                !trimmed ||
                                trimmed.length > 60 ||
                                alreadyExists
                            }
                        >
                            {create.isPending ? 'Tworzenie…' : 'Utwórz tag'}
                        </button>
                    </div>
                    {alreadyExists && trimmed ? (
                        <p role="status" className={styles.muted}>
                            Ten tag już istnieje. Przypisz go powyżej.
                        </p>
                    ) : (
                        <p className={styles.muted}>
                            Utworzenie dodaje tag do wspólnego katalogu.
                            Przypisanie klientowi jest osobną operacją.
                        </p>
                    )}
                </form>
            </section>
        </Modal>
    );
}
