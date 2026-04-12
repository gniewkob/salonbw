'use client';

import { useState, useEffect } from 'react';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineBookingSettings, useSettingsMutations } from '@/hooks/useSettings';
import RouteGuard from '@/components/RouteGuard';

export default function BookingWidgetsSettingsPage() {
    const { role } = useAuth();
    const { data: settings, isLoading } = useOnlineBookingSettings();
    const { updateOnlineBookingSettings } = useSettingsMutations();
    
    const [form, setForm] = useState({
        facebookBookingEnabled: false,
        facebookPageId: '',
        instagramBookingEnabled: false,
    });

    useEffect(() => {
        if (settings) {
            setForm({
                facebookBookingEnabled: settings.facebookBookingEnabled || false,
                facebookPageId: settings.facebookPageId || '',
                instagramBookingEnabled: settings.instagramBookingEnabled || false,
            });
        }
    }, [settings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateOnlineBookingSettings.mutateAsync(form);
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']}>
            <SalonShell role={role}>
                <div className="salonbw-page settings-module">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/admin/settings' },
                            { label: 'Widgety i Social Media' },
                        ]}
                    />

                    <div className="description">
                        <h2>Widgety rezerwacyjne i Social Media</h2>
                        <p className="text-muted">
                            Skonfiguruj integracje umożliwiające klientom rezerwację wizyt bezpośrednio z Twoich profili społecznościowych.
                        </p>

                        {isLoading ? (
                            <div className="p-20 text-center">Ładowanie ustawień...</div>
                        ) : (
                            <form onSubmit={handleSave} className="mt-l">
                                {/* Facebook Section */}
                                <div className="card mb-l border-0 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="d-flex ai-center mb-m">
                                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                                                <i className="sprite-social_facebook" style={{ display: 'block', width: '24px', height: '24px' }}></i>
                                            </div>
                                            <div>
                                                <h4 className="mb-0">Facebook Booking</h4>
                                                <p className="small text-muted mb-0">Dodaj przycisk "Zarezerwuj teraz" na swoim fanpage'u.</p>
                                            </div>
                                            <div className="ms-auto">
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={form.facebookBookingEnabled}
                                                        onChange={e => setForm({...form, facebookBookingEnabled: e.target.checked})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {form.facebookBookingEnabled && (
                                            <div className="mt-m p-3 bg-light rounded">
                                                <label className="form-label small fw-bold">Facebook Page ID</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.facebookPageId}
                                                    onChange={e => setForm({...form, facebookPageId: e.target.value})}
                                                    placeholder="Wpisz ID swojej strony..."
                                                />
                                                <div className="form-text x-small mt-2">
                                                    ID strony znajdziesz w ustawieniach "Informacje o stronie" na Facebooku.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Instagram Section */}
                                <div className="card mb-l border-0 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="d-flex ai-center">
                                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                                                <i className="sprite-social_instagram" style={{ display: 'block', width: '24px', height: '24px' }}></i>
                                            </div>
                                            <div>
                                                <h4 className="mb-0">Instagram Booking</h4>
                                                <p className="small text-muted mb-0">Zintegruj swój profil na Instagramie z systemem rezerwacji.</p>
                                            </div>
                                            <div className="ms-auto">
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={form.instagramBookingEnabled}
                                                        onChange={e => setForm({...form, instagramBookingEnabled: e.target.checked})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex jc-between ai-center mt-xl p-3 bg-white border rounded shadow-sm sticky-bottom">
                                    <p className="mb-0 small text-muted">
                                        Pamiętaj o zapisaniu zmian po każdej modyfikacji.
                                    </p>
                                    <button
                                        type="submit"
                                        className="button button-blue px-5"
                                        disabled={updateOnlineBookingSettings.isPending}
                                    >
                                        {updateOnlineBookingSettings.isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
