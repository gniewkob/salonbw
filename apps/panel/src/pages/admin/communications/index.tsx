'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from '@/components/Topbar';
import AdminSidebarMenu from '@/components/sidebars/AdminSidebarMenu';
import {
    TemplatesList,
    TemplateModal,
    SmsComposer,
    SmsHistory,
    type TemplateFormData,
} from '@/components/sms';
import {
    AutomaticRulesList,
    AutomaticRuleModal,
} from '@/components/automatic-messages';
import {
    NewslettersList,
    NewsletterEditorModal,
} from '@/components/newsletters';
import {
    useMessageTemplates,
    useSmsHistory,
    useSmsStats,
    useSmsMutations,
} from '@/hooks/useSms';
import { useAutomaticMessages } from '@/hooks/useAutomaticMessages';
import { useNewsletters, useNewsletterMutations } from '@/hooks/useNewsletters';
import type {
    MessageTemplate,
    AutomaticMessageRule,
    Newsletter,
} from '@/types';

type Tab = 'send' | 'templates' | 'automatic' | 'newsletters' | 'history';

export default function AdminCommunicationsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('send');
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] =
        useState<MessageTemplate | null>(null);
    const [historyPage, setHistoryPage] = useState(1);

    // Automatic messages state
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomaticMessageRule | null>(
        null,
    );

    // Newsletter state
    const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
    const [editingNewsletter, setEditingNewsletter] =
        useState<Newsletter | null>(null);

    // Data queries
    const { data: templates, loading: templatesLoading } = useMessageTemplates({
        isActive: true,
    });
    const { data: allTemplates } = useMessageTemplates();
    const { data: history, loading: historyLoading } = useSmsHistory({
        page: historyPage,
        limit: 20,
    });
    const { data: stats } = useSmsStats();

    // Automatic messages data
    const {
        rules,
        loading: rulesLoading,
        createRule,
        updateRule,
        deleteRule,
        toggleRule,
        processOne,
    } = useAutomaticMessages();

    // Newsletter data
    const { data: newsletters, isLoading: newslettersLoading } =
        useNewsletters();
    const {
        createNewsletter,
        updateNewsletter,
        deleteNewsletter,
        duplicateNewsletter,
        sendNewsletter,
        cancelNewsletter,
    } = useNewsletterMutations();

    // Mutations
    const { createTemplate, updateTemplate, deleteTemplate, sendSms } =
        useSmsMutations();

    const handleSaveTemplate = async (data: TemplateFormData) => {
        if (editingTemplate) {
            await updateTemplate.mutateAsync({
                id: editingTemplate.id,
                ...data,
            });
        } else {
            await createTemplate.mutateAsync(data);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten szablon?')) {
            await deleteTemplate.mutateAsync(id);
        }
    };

    const handleSetDefault = async (id: number) => {
        const template = allTemplates.find((t) => t.id === id);
        if (template) {
            await updateTemplate.mutateAsync({
                id,
                isDefault: true,
            });
        }
    };

    const handleSendSms = async (data: {
        recipient: string;
        content: string;
        templateId?: number;
    }) => {
        await sendSms.mutateAsync(data);
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Brak dostępu
                    </h1>
                    <p className="text-gray-600">
                        Ta strona jest dostępna tylko dla administratorów.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Topbar />
            <div className="flex">
                <AdminSidebarMenu />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Komunikacja
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Zarządzaj wiadomościami SMS i szablonami
                        </p>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-2xl font-bold text-gray-800">
                                    {stats.totalSent}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Wysłanych (30 dni)
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.totalDelivered}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Dostarczonych
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-2xl font-bold text-red-600">
                                    {stats.totalFailed}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Nieudanych
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-2xl font-bold text-gray-800">
                                    {stats.totalCost.toFixed(2)} PLN
                                </div>
                                <div className="text-sm text-gray-600">
                                    Koszt
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex gap-6">
                            {[
                                { key: 'send', label: 'Wyślij SMS' },
                                { key: 'templates', label: 'Szablony' },
                                { key: 'automatic', label: 'Automatyczne' },
                                { key: 'newsletters', label: 'Newslettery' },
                                { key: 'history', label: 'Historia' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key as Tab)}
                                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-primary-600 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab content */}
                    {activeTab === 'send' && (
                        <div className="max-w-md">
                            <SmsComposer
                                templates={templates}
                                onSend={handleSendSms}
                                sending={sendSms.isPending}
                            />
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingTemplate(null);
                                        setTemplateModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    Nowy szablon
                                </button>
                            </div>

                            {templatesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                    <span className="ml-3 text-gray-600">
                                        Ładowanie...
                                    </span>
                                </div>
                            ) : (
                                <TemplatesList
                                    templates={allTemplates}
                                    onEdit={(template) => {
                                        setEditingTemplate(template);
                                        setTemplateModalOpen(true);
                                    }}
                                    onDelete={handleDeleteTemplate}
                                    onSetDefault={handleSetDefault}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white rounded-lg shadow">
                            <SmsHistory
                                logs={history.items}
                                loading={historyLoading}
                            />

                            {/* Pagination */}
                            {history.total > history.limit && (
                                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Strona {history.page} z{' '}
                                        {Math.ceil(
                                            history.total / history.limit,
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setHistoryPage((p) => p - 1)
                                            }
                                            disabled={historyPage === 1}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            Poprzednia
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setHistoryPage((p) => p + 1)
                                            }
                                            disabled={
                                                historyPage >=
                                                Math.ceil(
                                                    history.total /
                                                        history.limit,
                                                )
                                            }
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            Następna
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'automatic' && (
                        <div>
                            <div className="mb-6">
                                <p className="text-gray-600 mb-4">
                                    Automatyczne wiadomości są wysyłane na
                                    podstawie zdefiniowanych reguł, np.
                                    przypomnienia o wizytach, życzenia
                                    urodzinowe czy reaktywacja nieaktywnych
                                    klientów.
                                </p>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRule(null);
                                            setRuleModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                        Nowa reguła
                                    </button>
                                </div>
                            </div>

                            {rulesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                    <span className="ml-3 text-gray-600">
                                        Ładowanie...
                                    </span>
                                </div>
                            ) : (
                                <AutomaticRulesList
                                    rules={rules}
                                    onEdit={(rule) => {
                                        setEditingRule(rule);
                                        setRuleModalOpen(true);
                                    }}
                                    onDelete={async (id) => {
                                        if (
                                            window.confirm(
                                                'Czy na pewno chcesz usunąć tę regułę?',
                                            )
                                        ) {
                                            await deleteRule(id);
                                        }
                                    }}
                                    onToggle={async (id) => {
                                        await toggleRule(id);
                                    }}
                                    onProcess={async (id) => {
                                        await processOne(id);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'newsletters' && (
                        <div>
                            <div className="mb-6">
                                <p className="text-gray-600 mb-4">
                                    Twórz i wysyłaj newslettery do wybranych
                                    grup klientów. Możesz filtrować odbiorców
                                    lub wybrać ich ręcznie.
                                </p>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingNewsletter(null);
                                            setNewsletterModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                        Nowy newsletter
                                    </button>
                                </div>
                            </div>

                            {newslettersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                    <span className="ml-3 text-gray-600">
                                        Ładowanie...
                                    </span>
                                </div>
                            ) : (
                                <NewslettersList
                                    newsletters={newsletters ?? []}
                                    onEdit={(newsletter) => {
                                        setEditingNewsletter(newsletter);
                                        setNewsletterModalOpen(true);
                                    }}
                                    onDuplicate={async (id) => {
                                        await duplicateNewsletter.mutateAsync(
                                            id,
                                        );
                                    }}
                                    onDelete={async (id) => {
                                        if (
                                            window.confirm(
                                                'Czy na pewno chcesz usunąć ten newsletter?',
                                            )
                                        ) {
                                            await deleteNewsletter.mutateAsync(
                                                id,
                                            );
                                        }
                                    }}
                                    onSend={async (id) => {
                                        if (
                                            window.confirm(
                                                'Czy na pewno chcesz wysłać ten newsletter?',
                                            )
                                        ) {
                                            await sendNewsletter.mutateAsync({
                                                id,
                                            });
                                        }
                                    }}
                                    onCancel={async (id) => {
                                        if (
                                            window.confirm(
                                                'Czy na pewno chcesz anulować wysyłkę?',
                                            )
                                        ) {
                                            await cancelNewsletter.mutateAsync(
                                                id,
                                            );
                                        }
                                    }}
                                    onViewRecipients={(id) => {
                                        // TODO: Open recipients modal
                                        console.log(
                                            'View recipients for newsletter',
                                            id,
                                        );
                                    }}
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Template Modal */}
            <TemplateModal
                isOpen={templateModalOpen}
                template={editingTemplate}
                onClose={() => {
                    setTemplateModalOpen(false);
                    setEditingTemplate(null);
                }}
                onSave={handleSaveTemplate}
            />

            {/* Automatic Rule Modal */}
            <AutomaticRuleModal
                isOpen={ruleModalOpen}
                rule={editingRule}
                onClose={() => {
                    setRuleModalOpen(false);
                    setEditingRule(null);
                }}
                onSave={async (data) => {
                    if (editingRule) {
                        await updateRule(editingRule.id, data);
                    } else {
                        await createRule(data);
                    }
                }}
            />

            {/* Newsletter Modal */}
            <NewsletterEditorModal
                isOpen={newsletterModalOpen}
                newsletter={editingNewsletter}
                onClose={() => {
                    setNewsletterModalOpen(false);
                    setEditingNewsletter(null);
                }}
                onSave={async (data) => {
                    if (editingNewsletter) {
                        await updateNewsletter.mutateAsync({
                            id: editingNewsletter.id,
                            ...data,
                        });
                    } else {
                        await createNewsletter.mutateAsync(data);
                    }
                }}
            />
        </div>
    );
}
