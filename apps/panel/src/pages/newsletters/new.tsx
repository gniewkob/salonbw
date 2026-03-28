import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

export default function NewsletterNewPage() {
    const { role } = useAuth();
    if (!role) return null;
    return (
        <SalonShell role={role}>
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_communication"
                items={[
                    { label: 'Komunikacja', href: '/communication' },
                    { label: 'Nowy newsletter' },
                ]}
            />
            <div>
                <div className="actions">
                    <button
                        type="button"
                        className="btn button-blue pull-right"
                        disabled
                    >
                        wyślij
                    </button>
                </div>
                <h2>Nowy newsletter</h2>
                <form>
                    <div className="form-group">
                        <label htmlFor="subject" className="control-label">
                            Temat
                        </label>
                        <input
                            id="subject"
                            type="text"
                            className="form-control"
                            placeholder="Temat wiadomości"
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="recipients" className="control-label">
                            Odbiorcy
                        </label>
                        <select
                            id="recipients"
                            className="form-control"
                            disabled
                        >
                            <option>Wszyscy klienci</option>
                            <option>
                                Klienci aktywni (ostatnie 3 miesiące)
                            </option>
                            <option>Klienci nieaktywni</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="body" className="control-label">
                            Treść
                        </label>
                        <textarea
                            id="body"
                            className="form-control"
                            rows={10}
                            placeholder="Treść newslettera"
                            disabled
                        />
                    </div>
                </form>
            </div>
        </SalonShell>
    );
}
