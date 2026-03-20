import Link from 'next/link';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function NewsletterNewPage() {
    const { role } = useAuth();
    if (!role) return null;
    return (
        <SalonBWShell role={role}>
            <div className="breadcrumbs" e2e-breadcrumbs="">
                <ul>
                    <li>
                        <div className="icon sprite-breadcrumbs_communication" />
                        <Link href="/communication">Komunikacja</Link>
                    </li>
                    <li>
                        <span> / </span>
                        Nowy newsletter
                    </li>
                </ul>
            </div>
            <div className="inner">
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
        </SalonBWShell>
    );
}
