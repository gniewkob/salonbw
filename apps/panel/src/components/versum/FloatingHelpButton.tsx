import VersumIcon from './VersumIcon';

export default function FloatingHelpButton() {
    return (
        <button
            type="button"
            className="versum-floating-help"
            aria-label="Pomoc"
        >
            <VersumIcon id="svg-chat" className="versum-icon versum-icon--lg" />
        </button>
    );
}
