'use client';

import { useState, useEffect } from 'react';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import type { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function CustomerProfilePage() {
    const { role, apiFetch } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await apiFetch<User>('/users/profile');
                setProfile(data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [apiFetch]);

    const handleLinkAccount = (provider: string) => {
        window.location.href = `${API_URL}/auth/social/${provider}?link=true`;
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['customer']}>
            <SalonShell role={role}>
                <div className="salonbw-page profile-module">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_customers"
                        items={[{ label: 'Twoje ustawienia' }]}
                    />

                    <div className="description mb-l">
                        <h2>Ustawienia profilu</h2>
                        <p className="text-muted">Zarządzaj swoimi danymi i powiązanymi kontami społecznościowymi.</p>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center">Ładowanie profilu...</div>
                    ) : (
                        <div className="row">
                            <div className="col-lg-8">
                                <div className="card border-0 shadow-sm mb-l">
                                    <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                        <h5 className="mb-0">Dane osobowe</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Imię i nazwisko</label>
                                                <input type="text" className="form-control" value={profile?.name || ''} readOnly disabled />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Adres e-mail</label>
                                                <input type="email" className="form-control" value={profile?.email || ''} readOnly disabled />
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <p className="small text-muted italic">Edycja danych osobowych jest dostępna po kontakcie z recepcją salonu.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm border-start border-primary border-4">
                                    <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                        <h5 className="mb-0">Połączone konta</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        <p className="small text-muted mb-4">Połącz konto z serwisami zewnętrznymi, aby logować się jednym kliknięciem.</p>
                                        
                                        <div className="d-grid gap-3">
                                            {/* Google */}
                                            <div className="d-flex ai-center jc-between p-2 border rounded">
                                                <div className="d-flex ai-center">
                                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{ width: '20px' }} className="me-2" alt="Google" />
                                                    <span className="small">Google</span>
                                                </div>
                                                {(profile as any)?.googleId ? (
                                                    <span className="badge bg-success">Połączono</span>
                                                ) : (
                                                    <button onClick={() => handleLinkAccount('google')} className="btn btn-sm btn-outline-primary py-0">Połącz</button>
                                                )}
                                            </div>

                                            {/* Facebook */}
                                            <div className="d-flex ai-center jc-between p-2 border rounded">
                                                <div className="d-flex ai-center">
                                                    <i className="sprite-social_facebook me-2" style={{ display: 'block', width: '20px', height: '20px' }}></i>
                                                    <span className="small">Facebook</span>
                                                </div>
                                                {(profile as any)?.facebookId ? (
                                                    <span className="badge bg-success">Połączono</span>
                                                ) : (
                                                    <button onClick={() => handleLinkAccount('facebook')} className="btn btn-sm btn-outline-primary py-0">Połącz</button>
                                                )}
                                            </div>

                                            {/* Apple */}
                                            <div className="d-flex ai-center jc-between p-2 border rounded">
                                                <div className="d-flex ai-center">
                                                    <i className="sprite-social_apple me-2" style={{ display: 'block', width: '20px', height: '20px' }}></i>
                                                    <span className="small">Apple</span>
                                                </div>
                                                {(profile as any)?.appleId ? (
                                                    <span className="badge bg-success">Połączono</span>
                                                ) : (
                                                    <button onClick={() => handleLinkAccount('apple')} className="btn btn-sm btn-outline-primary py-0">Połącz</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
