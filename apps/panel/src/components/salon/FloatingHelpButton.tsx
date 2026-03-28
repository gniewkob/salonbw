import SalonIcon from './SalonIcon';

export default function FloatingHelpButton() {
    return (
        <button
            type="button"
            className="salonbw-floating-help"
            aria-label="Pomoc"
        >
            <SalonIcon
                id="svg-chat"
                className="salonbw-icon salonbw-icon--lg"
            />
        </button>
    );
}
