export default function LoadingSpinner({ size = 16 }: { size?: number }) {
    return (
        <span
            aria-label="Loading"
            className="spinner-border spinner-border-sm align-middle"
            style={{ width: size, height: size }}
            role="status"
        />
    );
}
