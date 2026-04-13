export default function LoadingSpinner({ size = 16 }: { size?: number }) {
    const style = { width: `${size}px`, height: `${size}px` };
    return (
        <span
            aria-label="Ładowanie"
            className="inline-block align-middle border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
            style={style}
        />
    );
}
