import Link from 'next/link';
import { useRouter } from 'next/router';

export default function EmployeesNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href ||
        router.pathname.startsWith(`${href}/`) ||
        (href === '/settings/employees' && router.pathname === '/employees');

    return (
        <div className="sidenav" id="sidenav">
            <div className="column_row tree">
                <h4>Pracownicy</h4>
                <Link
                    className={`root ${isActive('/settings/employees') ? 'active' : ''}`.trim()}
                    href="/settings/employees"
                >
                    <div className="icon_box">
                        <span className="icon sprite-all_employees" />
                    </div>
                    Wszyscy pracownicy
                </Link>
                <ul>
                    <li>
                        <Link href="/settings/employees?role=admin">
                            Administrator
                        </Link>
                    </li>
                    <li>
                        <Link href="/settings/employees?role=receptionist">
                            Recepcjonista
                        </Link>
                    </li>
                    <li>
                        <Link href="/settings/employees?with_deleted=">
                            Usunięci pracownicy
                        </Link>
                    </li>
                </ul>
            </div>
            <div className="column_row tree">
                <Link
                    className={`root ${isActive('/settings/employees/activity_logs') ? 'active' : ''}`.trim()}
                    href="/settings/employees/activity_logs"
                >
                    <div className="icon_box">
                        <span className="icon sprite-register_activity" />
                    </div>
                    Rejestr aktywności
                </Link>
            </div>
            <div className="column_row tree">
                <Link className="root" href="/settings/employees/commissions">
                    <div className="icon_box">
                        <span className="icon sprite-settings_product_purchase_prices" />
                    </div>
                    Prowizje pracowników
                </Link>
            </div>
        </div>
    );
}
