import SalonBWIcon from './SalonBWIcon';

export default function FloatingHelpButton() {
    return (
        <button
            type="button"
            className="salonbw-floating-help"
            aria-label="Pomoc"
        >
            <SalonBWIcon
                id="svg-chat"
                className="salonbw-icon salonbw-icon--lg"
            />
        </button>
    );
}
