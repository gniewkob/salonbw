import Link from 'next/link';
import SalonIcon from './SalonIcon';

export default function FloatingHelpButton() {
    return (
        <Link
            href="/helps/new"
            className="salonbw-floating-help"
            aria-label="Pomoc"
        >
            <SalonIcon
                id="svg-chat"
                className="salonbw-icon salonbw-icon--lg"
            />
        </Link>
    );
}
