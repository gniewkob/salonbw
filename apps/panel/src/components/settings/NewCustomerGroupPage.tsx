import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import PanelActionBar from '@/components/ui/PanelActionBar';
import {
    useCreateCustomerGroup,
    useCustomerGroups,
} from '@/hooks/useCustomers';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from './CustomerSettingsNav';

const CUSTOMER_SETTINGS_NAV = <CustomerSettingsNav />;

export default function NewCustomerGroupPage() {
    const router = useRouter();
    const createGroup = useCreateCustomerGroup();
    const { data: groups = [] } = useCustomerGroups();
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState(
        typeof router.query.parent_id === 'string'
            ? router.query.parent_id
            : '',
    );
    const [submitError, setSubmitError] = useState<string | null>(null);

    useSetSecondaryNav(CUSTOMER_SETTINGS_NAV);

    const parentOptions = useMemo(
        () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
        [groups],
    );

    return (
        <div className="settings-customer-group-form-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_settings"
                items={[
                    { label: 'Ustawienia', href: '/settings' },
                    {
                        label: 'Grupy klientów',
                        href: '/settings/customer_groups',
                    },
                    { label: 'Dodaj' },
                ]}
            />

            <form
                className="simple_form new_physical_customers_group"
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitError(null);
                    void createGroup
                        .mutateAsync({
                            name: name.trim(),
                            parentId: parentId ? Number(parentId) : null,
                        })
                        .then(() => router.push('/settings/customer_groups'))
                        .catch(() =>
                            setSubmitError(
                                'Nie udało się utworzyć grupy klientów.',
                            ),
                        );
                }}
            >
                <ol>
                    <li className="control-group">
                        <label
                            className="string required control-label"
                            htmlFor="physical-customers-group-name"
                        >
                            Nazwa
                        </label>
                        <div className="controls">
                            <input
                                id="physical-customers-group-name"
                                className="string required"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                required
                            />
                        </div>
                    </li>
                    <li className="control-group">
                        <label
                            className="select optional control-label"
                            htmlFor="physical-customers-group-parent-id"
                        >
                            Grupa nadrzędna
                        </label>
                        <div className="controls">
                            <select
                                id="physical-customers-group-parent-id"
                                className="select optional"
                                value={parentId}
                                onChange={(event) =>
                                    setParentId(event.target.value)
                                }
                            >
                                <option value=""></option>
                                {parentOptions.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </li>
                </ol>

                {submitError ? (
                    <div className="alert alert-danger">{submitError}</div>
                ) : null}

                <PanelActionBar
                    primary={
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={createGroup.isPending || !name.trim()}
                        >
                            <span className="icon sprite-add_customer_save mr-xs" />
                            {createGroup.isPending
                                ? 'Przetwarzanie danych...'
                                : 'dodaj grupę'}
                        </button>
                    }
                />
            </form>
        </div>
    );
}
