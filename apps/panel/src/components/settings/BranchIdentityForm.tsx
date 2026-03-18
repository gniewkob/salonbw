import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';
import PanelActionBar from '@/components/ui/PanelActionBar';
import { useBranchSettings, useSettingsMutations } from '@/hooks/useSettings';
import type { UpdateBranchSettingsRequest } from '@/types';

type BranchIdentityDraft = {
    companyName: string;
    email: string;
    website: string;
    facebookUrl: string;
    instagramUrl: string;
    logoUrl: string;
    phoneNumbers: string[];
};

const EMPTY_DRAFT: BranchIdentityDraft = {
    companyName: '',
    email: '',
    website: '',
    facebookUrl: '',
    instagramUrl: '',
    logoUrl: '',
    phoneNumbers: [''],
};

function toDraft(
    input?: Partial<{
        companyName: string | null;
        email: string | null;
        website: string | null;
        facebookUrl: string | null;
        instagramUrl: string | null;
        logoUrl: string | null;
        phone: string | null;
        phoneSecondary: string | null;
    }> | null,
): BranchIdentityDraft {
    if (!input) return EMPTY_DRAFT;

    const phoneNumbers = [input.phone, input.phoneSecondary].filter(
        (value): value is string => Boolean(value && value.trim()),
    );

    return {
        companyName: input.companyName ?? '',
        email: input.email ?? '',
        website: input.website ?? '',
        facebookUrl: input.facebookUrl ?? '',
        instagramUrl: input.instagramUrl ?? '',
        logoUrl: input.logoUrl ?? '',
        phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : [''],
    };
}

function buildPayload(draft: BranchIdentityDraft): UpdateBranchSettingsRequest {
    const cleanedPhones = draft.phoneNumbers
        .map((phone) => phone.trim())
        .filter(Boolean);

    return {
        companyName: draft.companyName.trim(),
        email: draft.email.trim(),
        website: draft.website.trim(),
        facebookUrl: draft.facebookUrl.trim(),
        instagramUrl: draft.instagramUrl.trim(),
        logoUrl: draft.logoUrl.trim(),
        phone: cleanedPhones[0] ?? '',
        phoneSecondary: cleanedPhones[1] ?? '',
    };
}

export default function BranchIdentityForm() {
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useBranchSettings();
    const { updateBranchSettings } = useSettingsMutations();
    const [draft, setDraft] = useState<BranchIdentityDraft>(EMPTY_DRAFT);
    const [isSaved, setIsSaved] = useState(false);
    const [showLogoEditor, setShowLogoEditor] = useState(false);

    useEffect(() => {
        if (!settings) return;
        setDraft(toDraft(settings));
        setShowLogoEditor(false);
    }, [settings]);

    const submitError = useMemo(() => {
        if (!updateBranchSettings.isError) return null;
        const message =
            updateBranchSettings.error instanceof Error
                ? updateBranchSettings.error.message
                : 'Nie udało się zapisać danych salonu.';
        return message;
    }, [updateBranchSettings.error, updateBranchSettings.isError]);

    const handleFieldChange =
        (field: keyof Omit<BranchIdentityDraft, 'phoneNumbers'>) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setDraft((current) => ({
                ...current,
                [field]: value,
            }));
            setIsSaved(false);
        };

    const handlePhoneChange =
        (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setDraft((current) => ({
                ...current,
                phoneNumbers: current.phoneNumbers.map((phone, phoneIndex) =>
                    phoneIndex === index ? value : phone,
                ),
            }));
            setIsSaved(false);
        };

    const handleAddPhone = () => {
        setDraft((current) => {
            if (current.phoneNumbers.length >= 2) return current;
            return {
                ...current,
                phoneNumbers: [...current.phoneNumbers, ''],
            };
        });
        setIsSaved(false);
    };

    const handleRemovePhone = (index: number) => {
        setDraft((current) => {
            const nextPhones = current.phoneNumbers.filter(
                (_, phoneIndex) => phoneIndex !== index,
            );
            return {
                ...current,
                phoneNumbers: nextPhones.length > 0 ? nextPhones : [''],
            };
        });
        setIsSaved(false);
    };

    const handleRemoveLogo = () => {
        setDraft((current) => ({
            ...current,
            logoUrl: '',
        }));
        setShowLogoEditor(true);
        setIsSaved(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaved(false);
        try {
            await updateBranchSettings.mutateAsync(buildPayload(draft));
            setIsSaved(true);
            setShowLogoEditor(false);
        } catch {
            setIsSaved(false);
        }
    };

    if (isLoading) {
        return (
            <div className="settings-detail-state settings-detail-state--loading">
                ładowanie...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="settings-detail-state settings-detail-state--error">
                <p>
                    {error instanceof Error
                        ? error.message
                        : 'Nie udało się pobrać danych salonu.'}
                </p>
                <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => void refetch()}
                >
                    spróbuj ponownie
                </button>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="settings-detail-state settings-detail-state--empty">
                Brak danych salonu do wyświetlenia.
            </div>
        );
    }

    return (
        <form
            className="simple_form edit_branch"
            onSubmit={(event) => void handleSubmit(event)}
        >
            <ol>
                <li className="control-group">
                    <label
                        className="string required control-label"
                        htmlFor="branch-name"
                    >
                        Nazwa
                    </label>
                    <div className="controls">
                        <input
                            id="branch-name"
                            className="string required"
                            type="text"
                            value={draft.companyName}
                            onChange={handleFieldChange('companyName')}
                            required
                        />
                        <div className="info_tip ml-s">
                            <span
                                className="icon sprite-info_tip2"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </li>
                <li className="control-group">
                    <label
                        className="email optional control-label"
                        htmlFor="branch-email"
                    >
                        Email
                    </label>
                    <div className="controls">
                        <input
                            id="branch-email"
                            className="string email optional"
                            type="email"
                            value={draft.email}
                            onChange={handleFieldChange('email')}
                        />
                        <div className="info_tip ml-s">
                            <span
                                className="icon sprite-info_tip2"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </li>
                <li className="control-group">
                    <label className="string optional control-label">
                        Numer telefonu
                    </label>
                    <div className="controls phones">
                        {draft.phoneNumbers.map((phone, index) => (
                            <div
                                className="controls-row"
                                key={`phone-${index}`}
                            >
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange(index)}
                                />
                                <button
                                    type="button"
                                    className={`settings-branch-form__remove-phone ${
                                        draft.phoneNumbers.length === 1
                                            ? 'settings-branch-form__remove-phone--hidden'
                                            : ''
                                    }`}
                                    onClick={() => handleRemovePhone(index)}
                                    aria-label="Usuń numer telefonu"
                                >
                                    <i
                                        className="icon sprite-filter_cancellation_visits"
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                        ))}
                        {draft.phoneNumbers.length < 2 ? (
                            <div className="add_phone_number">
                                <button
                                    type="button"
                                    className="dark"
                                    onClick={handleAddPhone}
                                >
                                    + dodaj kolejny
                                </button>
                            </div>
                        ) : null}
                    </div>
                </li>
                <li className="control-group">
                    <label
                        className="string optional control-label"
                        htmlFor="branch-website"
                    >
                        Adres strony internetowej
                    </label>
                    <div className="controls">
                        <input
                            id="branch-website"
                            className="string optional"
                            type="text"
                            value={draft.website}
                            onChange={handleFieldChange('website')}
                        />
                        <div className="info_tip ml-s">
                            <span
                                className="icon sprite-info_tip2"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </li>
                <li className="control-group">
                    <label
                        className="string optional control-label"
                        htmlFor="branch-facebook"
                    >
                        Facebook
                    </label>
                    <div className="controls">
                        <input
                            id="branch-facebook"
                            className="string url optional"
                            type="url"
                            value={draft.facebookUrl}
                            onChange={handleFieldChange('facebookUrl')}
                        />
                    </div>
                </li>
                <li className="control-group">
                    <label
                        className="string optional control-label"
                        htmlFor="branch-instagram"
                    >
                        Instagram
                    </label>
                    <div className="controls">
                        <input
                            id="branch-instagram"
                            className="string url optional"
                            type="url"
                            value={draft.instagramUrl}
                            onChange={handleFieldChange('instagramUrl')}
                        />
                    </div>
                </li>
                <li className="control-group">
                    <label
                        className="file optional control-label"
                        htmlFor="branch-logo-url"
                    >
                        Logo
                    </label>
                    <div className="controls">
                        <div className="gallery-container">
                            <div className="gallery-image">
                                <div className="image-box settings-branch-form__logo-box">
                                    {draft.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            crossOrigin="anonymous"
                                            src={draft.logoUrl}
                                            alt="Logo salonu"
                                        />
                                    ) : (
                                        <div className="settings-branch-form__logo-placeholder">
                                            brak logo
                                        </div>
                                    )}
                                </div>
                                <div className="image-footer">
                                    <div className="image-actions">
                                        <button
                                            type="button"
                                            className="settings-branch-form__icon-action"
                                            onClick={() =>
                                                setShowLogoEditor(
                                                    (current) => !current,
                                                )
                                            }
                                            aria-label="Edytuj adres logo"
                                        >
                                            <div className="icon_box">
                                                <div
                                                    className="icon sprite-settings_cut_logo"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            className="settings-branch-form__icon-action"
                                            onClick={handleRemoveLogo}
                                            aria-label="Usuń logo"
                                        >
                                            <div className="icon_box">
                                                <div
                                                    className="icon sprite-delete"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="add-item">
                                <button
                                    type="button"
                                    className="btn fileinput-button"
                                    onClick={() => setShowLogoEditor(true)}
                                >
                                    <span className="add-file-label">
                                        {draft.logoUrl
                                            ? 'Zmień zdjęcie'
                                            : 'dodaj zdjęcie'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        {showLogoEditor ? (
                            <div className="settings-branch-form__logo-editor">
                                <input
                                    id="branch-logo-url"
                                    className="string url optional"
                                    type="url"
                                    placeholder="https://..."
                                    value={draft.logoUrl}
                                    onChange={handleFieldChange('logoUrl')}
                                />
                                <p className="settings-branch-form__hint">
                                    W salonbw zapis logo odbywa się przez adres
                                    URL.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </li>
            </ol>

            {submitError ? (
                <div className="alert alert-danger">{submitError}</div>
            ) : null}
            {isSaved ? (
                <div className="alert alert-success">
                    Dane salonu zostały zapisane.
                </div>
            ) : null}

            <PanelActionBar
                primary={
                    <button
                        type="submit"
                        name="commit"
                        className="btn btn-primary"
                        disabled={updateBranchSettings.isPending}
                    >
                        <span className="icon sprite-add_customer_save mr-xs" />
                        {updateBranchSettings.isPending
                            ? 'Przetwarzanie danych...'
                            : 'zapisz zmiany'}
                    </button>
                }
            />
        </form>
    );
}
