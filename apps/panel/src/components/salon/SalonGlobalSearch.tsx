import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import type { Product, StaffOption } from '@/types';

interface OmniboxCustomer {
    id: number;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
}

type OmniboxResultType = 'customer' | 'employee' | 'product';

interface OmniboxResult {
    id: number;
    key: string;
    type: OmniboxResultType;
    label: string;
    meta?: string;
    href: string;
}

function customerLabel(customer: OmniboxCustomer): string {
    const composed = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(' ');
    return customer.name || composed || `Klient #${customer.id}`;
}

function staffRoleLabel(role?: StaffOption['role']) {
    switch (role) {
        case 'admin':
            return 'administrator';
        case 'receptionist':
            return 'recepcjonista';
        case 'employee':
            return 'pracownik';
        default:
            return 'pracownik';
    }
}

function productMeta(product: Product) {
    return [product.brand, product.sku ? `SKU: ${product.sku}` : null]
        .filter(Boolean)
        .join(' · ');
}

function groupResults(results: OmniboxResult[]) {
    return [
        {
            type: 'customer' as const,
            title: 'Klienci',
            items: results.filter((item) => item.type === 'customer'),
        },
        {
            type: 'employee' as const,
            title: 'Pracownicy',
            items: results.filter((item) => item.type === 'employee'),
        },
        {
            type: 'product' as const,
            title: 'Produkty',
            items: results.filter((item) => item.type === 'product'),
        },
    ].filter((group) => group.items.length > 0);
}

type SalonGlobalSearchProps = {
    inputId?: string;
    mobile?: boolean;
};

export default function SalonGlobalSearch({
    inputId = 'omnibox',
    mobile = false,
}: SalonGlobalSearchProps) {
    const { user, apiFetch } = useAuth();
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OmniboxResult[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchActive, setSearchActive] = useState(-1);
    const groupedSearchResults = groupResults(searchResults);
    const isStaff = user?.role !== 'client';
    // Wyniki "Pracownicy" linkują do /settings/employees/* (RouteGuard admin-only),
    // więc pokazujemy je tylko adminowi.
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!isStaff) return;
        const query = searchQuery.trim();
        if (query.length < 2) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            const encoded = encodeURIComponent(query);
            Promise.allSettled([
                apiFetch<{ items?: OmniboxCustomer[] } | OmniboxCustomer[]>(
                    `/customers?search=${encoded}&limit=8`,
                ),
                isAdmin
                    ? apiFetch<StaffOption[]>(
                          `/employees/staff-options?search=${encoded}&limit=5`,
                      )
                    : Promise.reject(new Error('skipped')),
                apiFetch<Product[]>(`/products?search=${encoded}&limit=6`),
            ])
                .then(([customersResult, employeesResult, productsResult]) => {
                    if (cancelled) return;
                    const nextResults: OmniboxResult[] = [];

                    if (customersResult.status === 'fulfilled') {
                        const customers = Array.isArray(customersResult.value)
                            ? customersResult.value
                            : (customersResult.value.items ?? []);
                        nextResults.push(
                            ...customers.slice(0, 6).map((customer) => ({
                                id: customer.id,
                                key: `customer-${customer.id}`,
                                type: 'customer' as const,
                                label: customerLabel(customer),
                                meta: customer.phone ?? 'klient',
                                href: `/customers/${customer.id}`,
                            })),
                        );
                    }

                    if (isAdmin && employeesResult.status === 'fulfilled') {
                        const normalizedQuery = query.toLowerCase();
                        nextResults.push(
                            ...employeesResult.value
                                .filter((employee) =>
                                    [
                                        employee.name,
                                        staffRoleLabel(employee.role),
                                    ]
                                        .join(' ')
                                        .toLowerCase()
                                        .includes(normalizedQuery),
                                )
                                .slice(0, 5)
                                .map((employee) => ({
                                    id: employee.id,
                                    key: `employee-${employee.id}`,
                                    type: 'employee' as const,
                                    label: employee.name,
                                    meta: staffRoleLabel(employee.role),
                                    href: `/settings/employees/${employee.id}`,
                                })),
                        );
                    }

                    if (productsResult.status === 'fulfilled') {
                        nextResults.push(
                            ...productsResult.value
                                .slice(0, 6)
                                .map((product) => ({
                                    id: product.id,
                                    key: `product-${product.id}`,
                                    type: 'product' as const,
                                    label: product.name,
                                    meta: productMeta(product) || 'produkt',
                                    href: `/products/${product.id}`,
                                })),
                        );
                    }

                    setSearchResults(nextResults);
                    setSearchOpen(true);
                    setSearchActive(-1);
                })
                .catch(() => {
                    if (!cancelled) setSearchResults([]);
                });
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery, apiFetch, isStaff, isAdmin]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isStaff) return null;

    const listboxId = `${inputId}-listbox`;
    const hasResults = searchResults.length > 0;
    const activeResult =
        searchActive >= 0 ? searchResults[searchActive] : undefined;
    const activeOptionId = activeResult
        ? `${inputId}-option-${activeResult.key}`
        : undefined;

    const goToSearchResult = (result: OmniboxResult) => {
        setSearchOpen(false);
        setSearchQuery('');
        void router.push(result.href);
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!searchOpen || searchResults.length === 0) {
            if (event.key === 'Escape') {
                setSearchQuery('');
                setSearchOpen(false);
            }
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSearchActive((i) => (i + 1) % searchResults.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSearchActive(
                (i) => (i - 1 + searchResults.length) % searchResults.length,
            );
        } else if (event.key === 'Enter') {
            event.preventDefault();
            goToSearchResult(searchResults[Math.max(searchActive, 0)]);
        } else if (event.key === 'Escape') {
            setSearchOpen(false);
        }
    };

    return (
        <div
            ref={searchRef}
            className={`omnibox-wrapper position-relative${mobile ? ' omnibox-wrapper--mobile' : ''}`}
        >
            <input
                className="omnibox"
                id={inputId}
                // type="text", not "search": Chromium's accessibility tree
                // keeps a type=search input pinned to the native "searchbox"
                // role and does not honor a role="combobox" override on it
                // (confirmed live — Playwright's getByRole('combobox', ...)
                // never found the element even though jsdom/RTL's role
                // computation is permissive enough to let the unit test
                // pass). type="text" is the standard WAI-ARIA APG combobox
                // input type and is exposed correctly.
                type="text"
                autoComplete="off"
                placeholder="Szukaj..."
                aria-label="Szukaj klientów, pracowników i produktów"
                role="combobox"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-expanded={searchOpen}
                aria-controls={searchOpen && hasResults ? listboxId : undefined}
                aria-activedescendant={activeOptionId}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                    if (searchResults.length > 0) {
                        setSearchOpen(true);
                    }
                }}
                onKeyDown={handleSearchKeyDown}
            />
            {searchOpen && (
                <div className="dropdown-menu show omnibox-results">
                    {!hasResults ? (
                        <div
                            className="dropdown-item-text text-muted small"
                            role="status"
                        >
                            Brak wyników dla „{searchQuery.trim()}&rdquo;
                        </div>
                    ) : (
                        <div
                            id={listboxId}
                            role="listbox"
                            aria-label="Wyniki wyszukiwania"
                        >
                            {groupedSearchResults.map((group) => {
                                const headingId = `${listboxId}-heading-${group.type}`;
                                return (
                                    <div
                                        key={group.type}
                                        className="omnibox-results__group"
                                        role="group"
                                        aria-labelledby={headingId}
                                    >
                                        <div
                                            id={headingId}
                                            className="omnibox-results__heading"
                                        >
                                            {group.title} ({group.items.length})
                                        </div>
                                        {group.items.map((item) => {
                                            const index =
                                                searchResults.findIndex(
                                                    (result) =>
                                                        result.key === item.key,
                                                );
                                            const optionId = `${inputId}-option-${item.key}`;
                                            const selected =
                                                index === searchActive;
                                            return (
                                                <button
                                                    key={item.key}
                                                    id={optionId}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selected}
                                                    tabIndex={-1}
                                                    className={`dropdown-item omnibox-results__item${selected ? ' active' : ''}`}
                                                    onClick={() =>
                                                        goToSearchResult(item)
                                                    }
                                                    onMouseEnter={() =>
                                                        setSearchActive(index)
                                                    }
                                                >
                                                    <span className="omnibox-results__label">
                                                        {item.label}
                                                    </span>
                                                    {item.meta ? (
                                                        <span className="omnibox-results__meta">
                                                            {item.meta}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
